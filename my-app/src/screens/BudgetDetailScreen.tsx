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
import { Budget } from '../types';
import { budgetStorage } from '../storage/budgetStorage';
import { formatDateLong } from '../utils/dateFormatter';

type BudgetDetailScreenProps = NativeStackScreenProps<any, 'BudgetDetail'>;

export const BudgetDetailScreen: React.FC<BudgetDetailScreenProps> = ({ route, navigation }) => {
  const { colors, fontScaling } = useTheme();
  const insets = useSafeAreaInsets();
  const budgetId = route.params?.budgetId;
  const [budget, setBudget] = useState<Budget | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (budgetId) {
      loadBudget();
    }
  }, [budgetId]);

  const loadBudget = async () => {
    if (!budgetId) return;
    setLoading(true);
    const data = await budgetStorage.getBudgetById(budgetId);
    setBudget(data);
    setLoading(false);
  };

  const handleEdit = () => {
    if (budget) {
      navigation.navigate('CreateBudget', { 
        budgetId,
        fecha: budget.fecha
      });
    }
  };

  const handleDelete = () => {
    Alert.alert(
      'Eliminar presupuesto',
      '¿Está seguro de que desea eliminar este presupuesto?',
      [
        { text: 'Cancelar', onPress: () => {} },
        {
          text: 'Eliminar',
          onPress: async () => {
            try {
              await budgetStorage.deleteBudget(budgetId);
              navigation.goBack();
            } catch (error) {
              Alert.alert('Error', 'No se pudo eliminar el presupuesto');
            }
          },
          style: 'destructive',
        },
      ]
    );
  };

  const handleGeneratePDF = () => {
    navigation.navigate('BudgetPDF', { budgetId });
  };



  if (loading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!budget) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top }]}>
        <Text style={[styles.errorText, { color: colors.textSecondary, fontSize: fontScaling.body }]}>
          Presupuesto no encontrado
        </Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top }]}>
      <ScrollView style={styles.content}>
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.text, fontSize: fontScaling.heading1 }]}>
            Presupuesto #{budget.id}
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text, fontSize: fontScaling.heading3 }]}>
            Información del Presupuesto
          </Text>
          <View style={[styles.infoBox, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={styles.infoRow}>
              <Text style={[styles.infoLabel, { color: colors.textSecondary, fontSize: fontScaling.small }]}>
                Fecha:
              </Text>
              <Text style={[styles.infoValue, { color: colors.text, fontSize: fontScaling.body }]}>
                {new Date(budget.fecha).toLocaleDateString('es-ES')}
              </Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.infoRow}>
              <Text style={[styles.infoLabel, { color: colors.textSecondary, fontSize: fontScaling.small }]}>
                Total Mano de Obra:
              </Text>
              <Text style={[styles.infoValue, { color: colors.success, fontSize: fontScaling.heading3, fontWeight: 'bold' }]}>
                ${budget.total_mano_obra.toFixed(2)}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text, fontSize: fontScaling.heading3 }]}>
            Total Final
          </Text>
          <View style={[styles.totalBox, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[styles.totalAmount, { color: colors.success, fontSize: fontScaling.heading1 }]}>
              ${budget.total_final.toFixed(2)}
            </Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text, fontSize: fontScaling.heading3 }]}>
            Trabajos ({budget.trabajos?.length || 0})
          </Text>
          {budget.trabajos && budget.trabajos.length > 0 ? (
            <FlatList
              data={budget.trabajos}
              scrollEnabled={false}
              renderItem={({ item }) => (
                <View style={[styles.itemRow, { backgroundColor: colors.surface, borderLeftColor: colors.primary }]}>
                  <View style={styles.itemInfo}>
                    <Text style={[styles.itemDesc, { color: colors.text, fontSize: fontScaling.body }]}>
                      Trabajo #{item.id}
                    </Text>
                    <Text style={[styles.itemMeta, { color: colors.textSecondary, fontSize: fontScaling.small }]}>
                      {item.cantidad} × ${item.precio_unitario.toFixed(2)}
                    </Text>
                  </View>
                  <Text style={[styles.itemTotal, { color: colors.success, fontSize: fontScaling.body }]}>
                    ${item.subtotal.toFixed(2)}
                  </Text>
                </View>
              )}
              keyExtractor={item => item.id.toString()}
            />
          ) : (
            <Text style={[styles.emptyText, { color: colors.textSecondary, fontSize: fontScaling.small }]}>
              Sin trabajos registrados
            </Text>
          )}
        </View>
      </ScrollView>

      <View style={[styles.footer, { backgroundColor: colors.surface, borderTopColor: colors.border }]}>
        <TouchableOpacity 
          style={[styles.deleteBtn, { borderColor: colors.danger }]} 
          onPress={handleDelete}
        >
          <Text style={[styles.deleteBtnText, { color: colors.danger, fontSize: fontScaling.body }]}>
            Eliminar
          </Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.pdfBtn, { backgroundColor: colors.success }]} 
          onPress={handleGeneratePDF}
        >
          <Text style={[styles.pdfBtnText, { fontSize: fontScaling.body }]}>
            PDF
          </Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.editBtn, { backgroundColor: colors.primary }]} 
          onPress={handleEdit}
        >
          <Text style={[styles.editBtnText, { fontSize: fontScaling.body }]}>
            Editar
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  header: {
    marginBottom: 24,
  },
  title: {
    fontWeight: 'bold',
    marginBottom: 8,
  },
  description: {
    lineHeight: 20,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontWeight: '600',
    marginBottom: 12,
  },
  totalBox: {
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 1,
  },
  totalAmount: {
    fontWeight: 'bold',
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    marginBottom: 10,
    borderLeftWidth: 4,
  },
  itemInfo: {
    flex: 1,
  },
  itemDesc: {
    fontWeight: '500',
  },
  itemMeta: {
    marginTop: 4,
  },
  itemTotal: {
    fontWeight: 'bold',
    marginLeft: 12,
  },
  materialsContainer: {
    marginLeft: 16,
    marginRight: 0,
    marginBottom: 10,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderLeftWidth: 3,
    borderRadius: 4,
  },
  materialsTitle: {
    fontWeight: '600',
    marginBottom: 6,
  },
  materialItem: {
    marginBottom: 3,
    marginLeft: 4,
  },
  infoBox: {
    padding: 12,
    borderRadius: 8,
    marginBottom: 10,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  infoLabel: {
    fontWeight: '600',
  },
  infoValue: {
    marginTop: 4,
  },
  divider: {
    height: 1,
    backgroundColor: '#eee',
    marginVertical: 8,
  },
  emptyText: {
    textAlign: 'center',
    marginVertical: 16,
  },
  footer: {
    flexDirection: 'row',
    padding: 16,
    gap: 8,
    borderTopWidth: 1,
  },
  deleteBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
  },
  deleteBtnText: {
    fontWeight: 'bold',
  },
  pdfBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  pdfBtnText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  editBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  editBtnText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  errorText: {
    textAlign: 'center',
  },
});
