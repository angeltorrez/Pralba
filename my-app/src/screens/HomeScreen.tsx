import React, { useState, useCallback } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../context/ThemeContext';
import { Presupuesto, Cliente } from '../types';
import { getPresupuestoStorage, getClienteStorage } from '../storage/storageFactory';
import { getSyncService } from '../storage/syncService';

type HomeScreenProps = NativeStackScreenProps<any, 'Home'>;

interface PresupuestoItem extends Presupuesto {
  clienteName?: string;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({ navigation }) => {
  const { colors, fontScaling } = useTheme();
  const [presupuestos, setPresupuestos] = useState<PresupuestoItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const insets = useSafeAreaInsets();

  const loadPresupuestos = useCallback(async () => {
    try {
      const presupuestoStorage = getPresupuestoStorage();
      const clienteStorage = getClienteStorage();
      
      const allPresupuestos = await presupuestoStorage.getAllPresupuestos();
      
      // Enrich with client names
      const enriched: PresupuestoItem[] = [];
      for (const p of allPresupuestos) {
        const cliente = await clienteStorage.getClienteById(p.cliente_id);
        enriched.push({
          ...p,
          clienteName: cliente?.nombre || 'Cliente desconocido'
        });
      }
      
      setPresupuestos(enriched.sort((a, b) => b.fecha - a.fecha));
    } catch (error) {
      console.error('Error loading presupuestos:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadPresupuestos();
    }, [loadPresupuestos])
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      // Try to sync with backend
      const syncService = getSyncService();
      await syncService.sync();
      // Reload presupuestos
      await loadPresupuestos();
    } finally {
      setRefreshing(false);
    }
  }, [loadPresupuestos]);

  const handleDeletePresupuesto = useCallback(async (id: number) => {
    try {
      const presupuestoStorage = getPresupuestoStorage();
      await presupuestoStorage.deletePresupuesto(id);
      setPresupuestos(presupuestos.filter(p => p.id !== id));
    } catch (error) {
      console.error('Error deleting presupuesto:', error);
    }
  }, [presupuestos]);

  const handleCreatePresupuesto = () => {
    navigation.navigate('CrearPresupuesto');
  };

  const handleSelectPresupuesto = (presupuesto: PresupuestoItem) => {
    navigation.navigate('DetallePresupuesto', { presupuestoId: presupuesto.id });
  };

  const renderPresupuestoCard = ({ item }: { item: PresupuestoItem }) => (
    <TouchableOpacity
      style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}
      onPress={() => handleSelectPresupuesto(item)}
      activeOpacity={0.7}
    >
      <View style={styles.cardHeader}>
        <Text style={[styles.cardTitle, { color: colors.text, fontSize: fontScaling.body }]}>
          {item.clienteName}
        </Text>
        <Text style={[styles.cardAmount, { color: colors.primary, fontSize: fontScaling.heading2 }]}>
          ${item.total_final.toFixed(2)}
        </Text>
      </View>
      <Text style={[styles.cardDate, { color: colors.textSecondary, fontSize: fontScaling.small }]}>
        {new Date(item.fecha).toLocaleDateString()}
      </Text>
      <TouchableOpacity
        style={styles.deleteButton}
        onPress={() => handleDeletePresupuesto(item.id)}
      >
        <Text style={styles.deleteButtonText}>🗑️</Text>
      </TouchableOpacity>
    </TouchableOpacity>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyIcon}>📋</Text>
      <Text style={[styles.emptyTitle, { color: colors.text, fontSize: fontScaling.heading2 }]}>
        No hay presupuestos
      </Text>
      <Text style={[styles.emptyDescription, { color: colors.textSecondary, fontSize: fontScaling.body }]}>
        Crea tu primer presupuesto tocando el botón de abajo
      </Text>
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top }]}>
      <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <Text style={[styles.headerTitle, { color: colors.text, fontSize: fontScaling.heading1 }]}>
          Mis Presupuestos
        </Text>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <FlatList
          data={presupuestos}
          renderItem={renderPresupuestoCard}
          keyExtractor={item => String(item.id)}
          contentContainerStyle={styles.listContainer}
          ListEmptyComponent={renderEmptyState}
          scrollEnabled={true}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[colors.primary]}
            />
          }
        />
      )}

      <TouchableOpacity
        style={[styles.floatingButton, { backgroundColor: colors.primary }]}
        onPress={handleCreatePresupuesto}
        activeOpacity={0.8}
      >
        <Text style={[styles.floatingButtonText, { fontSize: fontScaling.heading1 }]}>+</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontWeight: 'bold',
  },
  listContainer: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 100,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyTitle: {
    fontWeight: 'bold',
    marginBottom: 8,
  },
  emptyDescription: {
    textAlign: 'center',
  },
  card: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  cardTitle: {
    fontWeight: '600',
    flex: 1,
  },
  cardAmount: {
    fontWeight: 'bold',
  },
  cardDate: {
    fontSize: 12,
  },
  deleteButton: {
    position: 'absolute',
    top: 12,
    right: 12,
    padding: 8,
  },
  deleteButtonText: {
    fontSize: 16,
  },
  floatingButton: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  floatingButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
});
