import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Text,
  Alert,
  FlatList,
  ActivityIndicator,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import uuid from 'react-native-uuid';
import { useTheme } from '../context/ThemeContext';
import { JobAutocomplete } from '../components/JobAutocomplete';
import { Budget, BudgetWork, CalculatedMaterial } from '../types';
import { budgetStorage } from '../storage/budgetStorage';
import { jobsStorage, Job } from '../storage/jobsStorage';
import { calculateMaterials } from '../utils/calculateMaterials';

type CreateBudgetScreenProps = NativeStackScreenProps<any, 'CreateBudget'>;

export const CreateBudgetScreen: React.FC<CreateBudgetScreenProps> = ({ navigation, route }) => {
  const { colors, fontScaling } = useTheme();
  const insets = useSafeAreaInsets();
  const budgetId = route.params?.budgetId;
  const isEditMode = !!budgetId;

  const [clientOrProject, setClientOrProject] = useState('');
  const [works, setWorks] = useState<BudgetWork[]>([]);
  const [jobSearch, setJobSearch] = useState('');
  const [workQuantity, setWorkQuantity] = useState('1');
  const [workPrice, setWorkPrice] = useState('');
  const [loading, setLoading] = useState(isEditMode);

  useEffect(() => {
    if (isEditMode) {
      loadBudgetData();
    }
  }, [budgetId]);

  const loadBudgetData = async () => {
    if (!budgetId) return;
    try {
      const budget = await budgetStorage.getBudgetById(budgetId);
      if (budget) {
        setClientOrProject(budget.clientOrProject);
        setWorks(budget.works || []);
      }
    } catch (error) {
      Alert.alert('Error', 'No se pudo cargar el presupuesto');
    } finally {
      setLoading(false);
    }
  };

  const calculateTotal = () => {
    return works.reduce((sum, work) => sum + work.total, 0);
  };

  const handleSelectJob = async (job: Job) => {
    if (!workQuantity.trim() || !workPrice.trim()) {
      Alert.alert('Error', 'Ingrese cantidad y precio');
      return;
    }

    const quantity = parseFloat(workQuantity);
    const unitPrice = parseFloat(workPrice);

    if (isNaN(quantity) || isNaN(unitPrice) || quantity <= 0 || unitPrice < 0) {
      Alert.alert('Error', 'Ingrese valores numéricos válidos');
      return;
    }

    const calculatedMaterials = calculateMaterials(job.materialFormulas, quantity);

    const newWork: BudgetWork = {
      id: uuid.v4() as string,
      jobName: job.name,
      quantity,
      unitPrice,
      total: quantity * unitPrice,
      estimatedMaterials: job.estimatedMaterials,
      unit: job.unit,
      materialFormulas: job.materialFormulas,
      calculatedMaterials,
    };

    setWorks([...works, newWork]);
    resetWorkForm();
  };

  const handleAddNewJob = async (jobName: string) => {
    if (!workQuantity.trim() || !workPrice.trim()) {
      Alert.alert('Error', 'Ingrese cantidad y precio');
      return;
    }

    const quantity = parseFloat(workQuantity);
    const unitPrice = parseFloat(workPrice);

    if (isNaN(quantity) || isNaN(unitPrice) || quantity <= 0 || unitPrice < 0) {
      Alert.alert('Error', 'Ingrese valores numéricos válidos');
      return;
    }

    try {
      const newJob = await jobsStorage.addJob(jobName, [], 'm2', []);
      const newWork: BudgetWork = {
        id: uuid.v4() as string,
        jobName: newJob.name,
        quantity,
        unitPrice,
        total: quantity * unitPrice,
        estimatedMaterials: [],
        unit: newJob.unit,
        materialFormulas: [],
        calculatedMaterials: [],
      };

      setWorks([...works, newWork]);
      resetWorkForm();
    } catch (error) {
      Alert.alert('Error', 'No se pudo agregar el trabajo');
    }
  };

  const resetWorkForm = () => {
    setJobSearch('');
    setWorkQuantity('1');
    setWorkPrice('');
  };

  const handleRemoveWork = (workId: string) => {
    setWorks(works.filter(work => work.id !== workId));
  };

  const handleSaveBudget = async () => {
    if (!clientOrProject.trim()) {
      Alert.alert('Error', 'Ingrese el nombre de la obra o cliente');
      return;
    }

    if (works.length === 0) {
      Alert.alert('Error', 'Debe agregar al menos un trabajo');
      return;
    }

    const now = new Date().toISOString();
    const budgetData = isEditMode
      ? {
          id: budgetId,
          clientOrProject,
          totalAmount: calculateTotal(),
          works,
          createdAt: route.params?.createdAt || now,
          updatedAt: now,
        }
      : {
          id: uuid.v4() as string,
          clientOrProject,
          totalAmount: calculateTotal(),
          works,
          createdAt: now,
          updatedAt: now,
        };
    const budget: Budget = budgetData;

    try {
      await budgetStorage.saveBudget(budget);
      const message = isEditMode ? 'Presupuesto actualizado' : 'Presupuesto guardado';
      Alert.alert('Éxito', message + ' correctamente', [
        {
          text: 'OK',
          onPress: () => navigation.goBack(),
        },
      ]);
    } catch (error) {
      Alert.alert('Error', 'No se pudo guardar el presupuesto');
    }
  };

  const renderWorkItem = ({ item }: { item: BudgetWork }) => (
    <View style={[styles.workCard, { backgroundColor: colors.surface }]}>
      <View style={styles.workHeader}>
        <Text style={[styles.workName, { color: colors.text, fontSize: fontScaling.heading3 }]}>
          {item.jobName}
        </Text>
        <TouchableOpacity
          onPress={() => handleRemoveWork(item.id)}
          style={[styles.removeBtn, { backgroundColor: colors.danger }]}
        >
          <Text style={styles.removeText}>✕</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.workDetails}>
        <View style={styles.workInfo}>
          <Text style={[styles.workLabel, { color: colors.textSecondary, fontSize: fontScaling.small }]}>
            {item.quantity} × ${item.unitPrice.toFixed(2)}
          </Text>
        </View>
        <Text style={[styles.workTotal, { color: colors.success, fontSize: fontScaling.heading3 }]}>
          ${item.total.toFixed(2)}
        </Text>
      </View>

      {item.estimatedMaterials.length > 0 && (
        <View style={[styles.materialsSection, { backgroundColor: colors.background, borderColor: colors.border }]}>
          <Text style={[styles.materialsTitle, { color: colors.text, fontSize: fontScaling.body }]}>
            Materiales estimados
          </Text>
          <View style={styles.materialsList}>
            {item.estimatedMaterials.map((material, idx) => (
              <Text
                key={idx}
                style={[styles.material, { color: colors.textSecondary, fontSize: fontScaling.small }]}
              >
                • {material}
              </Text>
            ))}
          </View>
        </View>
      )}
    </View>
  );

  if (loading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top }]}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.form}>
          <Text style={[styles.label, { color: colors.text, fontSize: fontScaling.heading3 }]}>
            Nombre de la Obra o Cliente *
          </Text>
          <TextInput
            style={[
              styles.input,
              {
                backgroundColor: colors.surface,
                borderColor: colors.border,
                color: colors.text,
                fontSize: fontScaling.body,
              },
            ]}
            placeholder="Ej: Reforma casa calle principal"
            placeholderTextColor={colors.textSecondary}
            value={clientOrProject}
            onChangeText={setClientOrProject}
          />

          <View style={styles.spacer} />

          <Text style={[styles.sectionTitle, { color: colors.text, fontSize: fontScaling.heading3 }]}>
            Trabajos ({works.length})
          </Text>

          {works.length > 0 && (
            <FlatList
              data={works}
              renderItem={renderWorkItem}
              keyExtractor={item => item.id}
              scrollEnabled={false}
              style={styles.worksList}
            />
          )}

          <View style={[styles.addWorkSection, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[styles.addWorkLabel, { color: colors.text, fontSize: fontScaling.body }]}>
              Agregar Trabajo
            </Text>

            <JobAutocomplete
              value={jobSearch}
              onSelect={handleSelectJob}
              onChangeText={setJobSearch}
              onAddNew={handleAddNewJob}
              placeholder="Buscar trabajo..."
            />

            <View style={styles.workInputsRow}>
              <View style={styles.inputWrapper}>
                <Text style={[styles.inputLabel, { color: colors.text, fontSize: fontScaling.small }]}>
                  Cantidad
                </Text>
                <TextInput
                  style={[
                    styles.numberInput,
                    {
                      backgroundColor: colors.background,
                      borderColor: colors.border,
                      color: colors.text,
                      fontSize: fontScaling.body,
                    },
                  ]}
                  placeholder="1"
                  placeholderTextColor={colors.textSecondary}
                  value={workQuantity}
                  onChangeText={setWorkQuantity}
                  keyboardType="decimal-pad"
                />
              </View>

              <View style={styles.inputWrapper}>
                <Text style={[styles.inputLabel, { color: colors.text, fontSize: fontScaling.small }]}>
                  Precio Unitario
                </Text>
                <TextInput
                  style={[
                    styles.numberInput,
                    {
                      backgroundColor: colors.background,
                      borderColor: colors.border,
                      color: colors.text,
                      fontSize: fontScaling.body,
                    },
                  ]}
                  placeholder="0.00"
                  placeholderTextColor={colors.textSecondary}
                  value={workPrice}
                  onChangeText={setWorkPrice}
                  keyboardType="decimal-pad"
                />
              </View>
            </View>
          </View>

          {works.length > 0 && (
            <View style={[styles.totalSection, { backgroundColor: colors.surface, borderColor: colors.success }]}>
              <Text style={[styles.totalLabel, { color: colors.text, fontSize: fontScaling.heading3 }]}>
                Total:
              </Text>
              <Text style={[styles.totalAmount, { color: colors.success, fontSize: fontScaling.heading1 }]}>
                ${calculateTotal().toFixed(2)}
              </Text>
            </View>
          )}
        </View>
      </ScrollView>

      <View style={[styles.footer, { backgroundColor: colors.surface, borderTopColor: colors.border }]}>
        <TouchableOpacity
          style={[styles.cancelBtn, { borderColor: colors.border }]}
          onPress={() => navigation.goBack()}
        >
          <Text style={[styles.cancelBtnText, { color: colors.textSecondary, fontSize: fontScaling.body }]}>
            Cancelar
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.saveBtn, { backgroundColor: colors.primary }]}
          onPress={handleSaveBudget}
        >
          <Text style={[styles.saveBtnText, { fontSize: fontScaling.body }]}>Guardar</Text>
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
  scrollView: {
    flex: 1,
  },
  form: {
    padding: 16,
  },
  label: {
    fontWeight: '600',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  spacer: {
    height: 24,
  },
  sectionTitle: {
    fontWeight: '600',
    marginBottom: 12,
  },
  worksList: {
    marginBottom: 12,
  },
  workCard: {
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#eee',
  },
  workHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  workName: {
    fontWeight: '600',
    flex: 1,
  },
  removeBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  removeText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  workDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  workInfo: {
    flex: 1,
  },
  workLabel: {
    fontWeight: '500',
  },
  workTotal: {
    fontWeight: 'bold',
    marginLeft: 12,
  },
  materialsSection: {
    borderRadius: 8,
    padding: 10,
    borderWidth: 1,
    marginTop: 8,
  },
  materialsTitle: {
    fontWeight: '600',
    marginBottom: 6,
  },
  materialsList: {
    gap: 4,
  },
  material: {
    fontWeight: '400',
  },
  addWorkSection: {
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    marginBottom: 12,
  },
  addWorkLabel: {
    fontWeight: '600',
    marginBottom: 10,
  },
  workInputsRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 10,
  },
  inputWrapper: {
    flex: 1,
  },
  inputLabel: {
    fontWeight: '600',
    marginBottom: 4,
  },
  numberInput: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  totalSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 2,
  },
  totalLabel: {
    fontWeight: '600',
  },
  totalAmount: {
    fontWeight: 'bold',
  },
  footer: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
    borderTopWidth: 1,
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
  },
  cancelBtnText: {
    fontWeight: 'bold',
  },
  saveBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  saveBtnText: {
    color: '#fff',
    fontWeight: 'bold',
  },
});
