/**
 * Presupuesto Detail Screen
 * View and manage a single presupuesto
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  FlatList,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../context/ThemeContext';
import { usePresupuesto } from '../hooks/usePresupuesto';
import { PresupuestoItemCard } from '../components/PresupuestoItemCard';
import { PresupuestoDetalle } from '../types';
import { formatCurrency, calculateTotal } from '../utils/presupuestoHelpers';
import { formatDateLong } from '../utils/dateFormatter';

type PresupuestoDetailScreenProps = NativeStackScreenProps<any, 'DetallePresupuesto'>;

export const PresupuestoDetailScreen: React.FC<PresupuestoDetailScreenProps> = ({
  route,
  navigation,
}) => {
  const { colors, fontScaling } = useTheme();
  const insets = useSafeAreaInsets();
  const [presupuesto, setPresupuesto] = useState<PresupuestoDetalle | null>(null);
  const [loading, setLoading] = useState(true);
  const { fetchPresupuestoDetail, deletePresupuesto } = usePresupuesto();

  const presupuestoId = route.params?.presupuestoId;

  useEffect(() => {
    loadPresupuesto();
  }, [presupuestoId]);

  const loadPresupuesto = async () => {
    if (!presupuestoId) return;
    
    setLoading(true);
    try {
      const data = await fetchPresupuestoDetail(presupuestoId);
      setPresupuesto(data);
    } catch (err) {
      Alert.alert('Error', 'No se pudo cargar el presupuesto');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = () => {
    Alert.alert(
      'Eliminar Presupuesto',
      '¿Está seguro de que desea eliminar este presupuesto?',
      [
        { text: 'Cancelar' },
        {
          text: 'Eliminar',
          onPress: async () => {
            try {
              await deletePresupuesto(presupuestoId);
              navigation.goBack();
            } catch (err) {
              Alert.alert('Error', 'No se pudo eliminar el presupuesto');
            }
          },
          style: 'destructive',
        },
      ]
    );
  };

  const handleGeneratePDF = () => {
    navigation.navigate('PresupuestoPDF', { presupuestoId });
  };

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!presupuesto) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top }]}>
        <Text style={[styles.errorText, { color: colors.textSecondary }]}>
          Presupuesto no encontrado
        </Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top }]}>
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={[styles.clientName, { color: colors.text, fontSize: fontScaling.heading1 }]}>
              {presupuesto.cliente.nombre}
            </Text>
            <Text style={[styles.date, { color: colors.textSecondary, fontSize: fontScaling.body }]}>
              {formatDateLong(presupuesto.fecha)}
            </Text>
          </View>
          <Text
            style={[styles.totalAmount, { color: colors.primary, fontSize: fontScaling.heading1 }]}
          >
            {formatCurrency(presupuesto.total_final)}
          </Text>
        </View>

        {/* Trabajos */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text, fontSize: fontScaling.heading3 }]}>
            Trabajos ({presupuesto.trabajos_detalle.length})
          </Text>
          <FlatList
            data={presupuesto.trabajos_detalle}
            renderItem={({ item }) => <PresupuestoItemCard item={item} showMaterials={true} />}
            keyExtractor={(item) => item.id.toString()}
            scrollEnabled={false}
          />
        </View>

        {/* Summary */}
        <View style={[styles.summaryCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={styles.summaryRow}>
            <Text style={[styles.summaryLabel, { color: colors.text }]}>Subtotal Mano de Obra:</Text>
            <Text style={[styles.summaryValue, { color: colors.text }]}>
              {formatCurrency(presupuesto.total_mano_obra)}
            </Text>
          </View>
          <View style={[styles.divider, { backgroundColor: colors.border }]} />
          <View style={styles.summaryRow}>
            <Text style={[styles.summaryLabel, { color: colors.text, fontWeight: 'bold' }]}>
              Total Final:
            </Text>
            <Text
              style={[
                styles.summaryValue,
                { color: colors.primary, fontWeight: 'bold', fontSize: 16 },
              ]}
            >
              {formatCurrency(presupuesto.total_final)}
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* Action Buttons */}
      <View style={[styles.footer, { backgroundColor: colors.surface, borderTopColor: colors.border }]}>
        <TouchableOpacity
          style={[styles.actionBtn, { backgroundColor: colors.danger }]}
          onPress={handleDelete}
        >
          <Text style={styles.actionBtnText}>Eliminar</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionBtn, { backgroundColor: colors.primary }]}
          onPress={handleGeneratePDF}
        >
          <Text style={styles.actionBtnText}>Generar PDF</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  clientName: {
    fontWeight: '600',
    marginBottom: 4,
  },
  date: {
    fontWeight: '400',
  },
  totalAmount: {
    fontWeight: 'bold',
    textAlign: 'right',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontWeight: '600',
    marginBottom: 12,
  },
  summaryCard: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  summaryLabel: {
    fontWeight: '500',
  },
  summaryValue: {
    fontWeight: 'bold',
  },
  divider: {
    height: 1,
    marginVertical: 12,
  },
  footer: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
    borderTopWidth: 1,
  },
  actionBtn: {
    flex: 1,
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
  },
  actionBtnText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  errorText: {
    fontSize: 16,
    textAlign: 'center',
  },
});
