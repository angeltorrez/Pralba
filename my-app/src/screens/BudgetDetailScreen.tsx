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
import { formatMaterial } from '../utils/calculateMaterials';

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
        createdAt: budget.createdAt
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
            await budgetStorage.deleteBudget(budgetId);
            navigation.goBack();
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
            {budget.clientOrProject}
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text, fontSize: fontScaling.heading3 }]}>
            Total del Presupuesto
          </Text>
          <View style={[styles.totalBox, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[styles.totalAmount, { color: colors.success, fontSize: fontScaling.heading1 }]}>
              ${budget.totalAmount.toFixed(2)}
            </Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text, fontSize: fontScaling.heading3 }]}>
            Trabajos ({budget.works.length})
          </Text>
          <FlatList
            data={budget.works}
            renderItem={({ item }) => (
              <View>
                <View style={[styles.itemRow, { backgroundColor: colors.surface, borderLeftColor: colors.primary }]}>
                  <View style={styles.itemInfo}>
                    <Text style={[styles.itemDesc, { color: colors.text, fontSize: fontScaling.body }]}>
                      {item.jobName}
                    </Text>
                    <Text style={[styles.itemMeta, { color: colors.textSecondary, fontSize: fontScaling.small }]}>
                      {item.quantity} {item.unit || 'unidad'} × ${item.unitPrice.toFixed(2)}
                    </Text>
                  </View>
                  <Text style={[styles.itemTotal, { color: colors.success, fontSize: fontScaling.body }]}>
                    ${item.total.toFixed(2)}
                  </Text>
                </View>
                {item.calculatedMaterials && item.calculatedMaterials.length > 0 && (
                  <View style={[styles.materialsContainer, { backgroundColor: colors.background, borderColor: colors.border }]}>
                    <Text style={[styles.materialsTitle, { color: colors.text, fontSize: fontScaling.small }]}>
                      📦 Materiales:
                    </Text>
                    {item.calculatedMaterials.map((material, idx) => (
                      <Text
                        key={idx}
                        style={[
                          styles.materialItem,
                          { color: colors.textSecondary, fontSize: fontScaling.small },
                        ]}
                      >
                        • {formatMaterial(material)}
                      </Text>
                    ))}
                  </View>
                )}
              </View>
            )}
            keyExtractor={item => item.id}
            scrollEnabled={false}
          />
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text, fontSize: fontScaling.heading3 }]}>
            Información
          </Text>
          <View style={[styles.infoBox, { backgroundColor: colors.surface }]}>
            <Text style={[styles.infoLabel, { color: colors.textSecondary, fontSize: fontScaling.small }]}>
              Creado:
            </Text>
            <Text style={[styles.infoValue, { color: colors.text, fontSize: fontScaling.body }]}>
              {formatDateLong(budget.createdAt)}
            </Text>
          </View>
          <View style={[styles.infoBox, { backgroundColor: colors.surface }]}>
            <Text style={[styles.infoLabel, { color: colors.textSecondary, fontSize: fontScaling.small }]}>
              Actualizado:
            </Text>
            <Text style={[styles.infoValue, { color: colors.text, fontSize: fontScaling.body }]}>
              {formatDateLong(budget.updatedAt)}
            </Text>
          </View>
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
            PDFs
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
  infoLabel: {
    fontWeight: '600',
  },
  infoValue: {
    marginTop: 4,
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
