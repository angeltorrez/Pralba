/**
 * Create/Edit Presupuesto Screen
 * Clean, focused workflow for creating presupuestos
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Text,
  Alert,
  ActivityIndicator,
  FlatList,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../context/ThemeContext';
import { usePresupuesto } from '../hooks/usePresupuesto';
import { TrabajoAutocomplete } from '../components/TrabajoAutocomplete';
import { PresupuestoItemCard } from '../components/PresupuestoItemCard';
import { calculateTotal, formatCurrency, validatePresupuesto } from '../utils/presupuestoHelpers';
import { TrabajoCatalogo, Cliente } from '../types';

type CreatePresupuestoScreenProps = NativeStackScreenProps<any, 'CrearPresupuesto'>;

interface TrabajoPendiente {
  trabajo_catalogo_id: number;
  cantidad: number;
  precio_unitario: number;
  trabajo: TrabajoCatalogo;
  tempId: string;
}

export const CreatePresupuestoScreen: React.FC<CreatePresupuestoScreenProps> = ({
  navigation
}) => {
  const { colors, fontScaling } = useTheme();
  const insets = useSafeAreaInsets();
  const { clientes, fetchClientes, createPresupuesto, loading: saving } = usePresupuesto();

  const [selectedClienteId, setSelectedClienteId] = useState<number | null>(null);
  const [trabajosPendientes, setTrabajosPendientes] = useState<TrabajoPendiente[]>([]);
  const [jobSearch, setJobSearch] = useState('');
  const [cantidad, setCantidad] = useState('1');
  const [precioUnitario, setPrecioUnitario] = useState('');
  const [loadingClientes, setLoadingClientes] = useState(false);

  useEffect(() => {
    initializeScreen();
  }, []);

  const initializeScreen = async () => {
    setLoadingClientes(true);
    try {
      await fetchClientes();
    } catch (err) {
      Alert.alert('Error', 'No se pudieron cargar los clientes');
    } finally {
      setLoadingClientes(false);
    }
  };

  const handleSelectTrabajo = (trabajo: TrabajoCatalogo) => {
    const cantidadNum = parseFloat(cantidad);
    const precioNum = parseFloat(precioUnitario);

    // Validate inputs
    if (!cantidad.trim() || !precioUnitario.trim()) {
      Alert.alert('Error', 'Ingrese cantidad y precio unitario');
      return;
    }

    if (isNaN(cantidadNum) || isNaN(precioNum)) {
      Alert.alert('Error', 'Cantidad y precio deben ser números válidos');
      return;
    }

    if (cantidadNum <= 0) {
      Alert.alert('Error', 'La cantidad debe ser mayor a 0');
      return;
    }

    if (precioNum < 0) {
      Alert.alert('Error', 'El precio no puede ser negativo');
      return;
    }

    // Add trabajo to pending list
    const newTrabajo: TrabajoPendiente = {
      trabajo_catalogo_id: trabajo.id,
      cantidad: cantidadNum,
      precio_unitario: precioNum,
      trabajo,
      tempId: `${trabajo.id}-${Date.now()}`,
    };

    setTrabajosPendientes([...trabajosPendientes, newTrabajo]);
    resetWorkForm();
  };

  const resetWorkForm = () => {
    setJobSearch('');
    setCantidad('1');
    setPrecioUnitario('');
  };

  const handleRemoveWork = (tempId: string) => {
    setTrabajosPendientes(trabajosPendientes.filter((t) => t.tempId !== tempId));
  };

  const handleCreatePresupuesto = async () => {
    if (!selectedClienteId) {
      Alert.alert('Error', 'Seleccione un cliente');
      return;
    }

    if (trabajosPendientes.length === 0) {
      Alert.alert('Error', 'Agregue al menos un trabajo');
      return;
    }

    try {
      const trabajosData = trabajosPendientes.map((t) => ({
        trabajo_catalogo_id: t.trabajo_catalogo_id,
        cantidad: t.cantidad,
        precio_unitario: t.precio_unitario,
      }));

      await createPresupuesto(selectedClienteId, trabajosData);

      Alert.alert('Éxito', 'Presupuesto creado correctamente', [
        {
          text: 'OK',
          onPress: () => navigation.goBack(),
        },
      ]);
    } catch (error) {
      Alert.alert('Error', error instanceof Error ? error.message : 'No se pudo crear el presupuesto');
    }
  };

  if (loadingClientes) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  const total = trabajosPendientes.reduce((sum, t) => sum + t.cantidad * t.precio_unitario, 0);

  return (
    <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top }]}>
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Cliente Selection */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text, fontSize: fontScaling.heading3 }]}>
            Cliente *
          </Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.clientesList}
          >
            {clientes.map((cliente) => (
              <TouchableOpacity
                key={cliente.id}
                onPress={() => setSelectedClienteId(cliente.id)}
                style={[
                  styles.clienteChip,
                  {
                    backgroundColor:
                      selectedClienteId === cliente.id ? colors.primary : colors.surface,
                    borderColor: colors.border,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.clienteChipText,
                    {
                      color: selectedClienteId === cliente.id ? '#fff' : colors.text,
                      fontSize: fontScaling.body,
                    },
                  ]}
                >
                  {cliente.nombre}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Add Trabajo Section */}
        <View style={[styles.section, styles.addWorkSection, { backgroundColor: colors.surface }]}>
          <Text style={[styles.sectionTitle, { color: colors.text, fontSize: fontScaling.heading3 }]}>
            Agregar Trabajo
          </Text>

          <TrabajoAutocomplete
            value={jobSearch}
            onSelect={handleSelectTrabajo}
            onChangeText={setJobSearch}
            placeholder="Buscar trabajo..."
          />

          {/* Inputs for quantity and price */}
          <View style={styles.inputRow}>
            <View style={styles.inputContainer}>
              <Text style={[styles.inputLabel, { color: colors.text }]}>Cantidad</Text>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: colors.background,
                    borderColor: colors.border,
                    color: colors.text,
                  },
                ]}
                placeholder="1"
                placeholderTextColor={colors.textSecondary}
                value={cantidad}
                onChangeText={setCantidad}
                keyboardType="decimal-pad"
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={[styles.inputLabel, { color: colors.text }]}>Precio Unitario</Text>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: colors.background,
                    borderColor: colors.border,
                    color: colors.text,
                  },
                ]}
                placeholder="0.00"
                placeholderTextColor={colors.textSecondary}
                value={precioUnitario}
                onChangeText={setPrecioUnitario}
                keyboardType="decimal-pad"
              />
            </View>
          </View>
        </View>

        {/* Trabajos agregados */}
        {trabajosPendientes.length > 0 && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text, fontSize: fontScaling.heading3 }]}>
              Trabajos ({trabajosPendientes.length})
            </Text>

            <FlatList
              data={trabajosPendientes}
              renderItem={({ item }) => (
                <View style={[styles.trajajoItem, { backgroundColor: colors.surface }]}>
                  <View style={styles.trajajoInfo}>
                    <Text style={[styles.trajajoName, { color: colors.text }]}>
                      {item.trabajo.nombre}
                    </Text>
                    <Text style={[styles.trajajoDetails, { color: colors.textSecondary }]}>
                      {item.cantidad} × ${item.precio_unitario.toFixed(2)}
                    </Text>
                  </View>
                  <View style={styles.trajajoActions}>
                    <Text style={[styles.trajajoSubtotal, { color: colors.primary }]}>
                      ${(item.cantidad * item.precio_unitario).toFixed(2)}
                    </Text>
                    <TouchableOpacity
                      onPress={() => handleRemoveWork(item.tempId)}
                      style={[styles.removeBtn, { backgroundColor: colors.danger }]}
                    >
                      <Text style={styles.removeBtnText}>✕</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}
              keyExtractor={(item) => item.tempId}
              scrollEnabled={false}
            />

            {/* Total */}
            <View
              style={[
                styles.totalSection,
                { backgroundColor: colors.primary, borderColor: colors.primary },
              ]}
            >
              <Text style={[styles.totalLabel, { color: '#fff' }]}>Total Mano de Obra:</Text>
              <Text style={[styles.totalAmount, { color: '#fff' }]}>{formatCurrency(total)}</Text>
            </View>
          </View>
        )}
      </ScrollView>

      {/* Button Footer */}
      <View style={[styles.footer, { backgroundColor: colors.surface, borderTopColor: colors.border }]}>
        <TouchableOpacity
          style={[styles.cancelBtn, { borderColor: colors.border }]}
          onPress={() => navigation.goBack()}
          disabled={saving}
        >
          <Text style={[styles.cancelBtnText, { color: colors.textSecondary }]}>Cancelar</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.saveBtn, { backgroundColor: colors.primary }]}
          onPress={handleCreatePresupuesto}
          disabled={saving || !selectedClienteId || trabajosPendientes.length === 0}
        >
          {saving ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.saveBtnText}>Crear Presupuesto</Text>
          )}
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
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontWeight: '600',
    marginBottom: 12,
  },
  clientesList: {
    marginBottom: 8,
  },
  clienteChip: {
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 8,
  },
  clienteChipText: {
    fontWeight: '500',
  },
  addWorkSection: {
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#eee',
  },
  inputRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 12,
  },
  inputContainer: {
    flex: 1,
  },
  inputLabel: {
    fontWeight: '600',
    marginBottom: 6,
    fontSize: 12,
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  trajajoItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#eee',
  },
  trajajoInfo: {
    flex: 1,
  },
  trajajoName: {
    fontWeight: '600',
    marginBottom: 4,
  },
  trajajoDetails: {
    fontWeight: '400',
    fontSize: 12,
  },
  trajajoActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  trajajoSubtotal: {
    fontWeight: 'bold',
    minWidth: 80,
    textAlign: 'right',
  },
  removeBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  removeBtnText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },
  totalSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderRadius: 8,
    padding: 16,
    marginTop: 12,
    borderWidth: 2,
  },
  totalLabel: {
    fontWeight: '600',
  },
  totalAmount: {
    fontWeight: 'bold',
    fontSize: 18,
  },
  footer: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
    borderTopWidth: 1,
  },
  cancelBtn: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
  },
  cancelBtnText: {
    fontWeight: 'bold',
  },
  saveBtn: {
    flex: 1,
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
  },
  saveBtnText: {
    color: '#fff',
    fontWeight: 'bold',
  },
});
