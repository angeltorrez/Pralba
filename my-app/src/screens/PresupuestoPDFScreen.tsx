/**
 * Presupuesto PDF Generation Screen
 * Generate PDF reports for presupuestos
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  ScrollView,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { useTheme } from '../context/ThemeContext';
import { usePresupuesto } from '../hooks/usePresupuesto';
import { PresupuestoDetalle } from '../types';
import { groupAndAggregateMaterials, formatMaterialDisplay, formatCurrency } from '../utils/presupuestoHelpers';
import { formatDateForPDF } from '../utils/dateFormatter';

type PresupuestoPDFScreenProps = NativeStackScreenProps<any, 'PresupuestoPDF'>;

export const PresupuestoPDFScreen: React.FC<PresupuestoPDFScreenProps> = ({ route, navigation }) => {
  const { colors, fontScaling } = useTheme();
  const insets = useSafeAreaInsets();
  const [presupuesto, setPresupuesto] = useState<PresupuestoDetalle | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const { fetchPresupuestoDetail } = usePresupuesto();

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

  const generateWorksPDF = async () => {
    if (!presupuesto) return;

    setGenerating(true);
    try {
      const htmlContent = generateWorksHTML();
      const { uri } = await Print.printToFileAsync({ html: htmlContent });
      await Sharing.shareAsync(uri);
    } catch (error) {
      Alert.alert('Error', 'No se pudo generar el PDF');
    } finally {
      setGenerating(false);
    }
  };

  const generateMaterialsPDF = async () => {
    if (!presupuesto) return;

    setGenerating(true);
    try {
      const htmlContent = generateMaterialsHTML();
      const { uri } = await Print.printToFileAsync({ html: htmlContent });
      await Sharing.shareAsync(uri);
    } catch (error) {
      Alert.alert('Error', 'No se pudo generar el PDF');
    } finally {
      setGenerating(false);
    }
  };

  const generateWorksHTML = (): string => {
    if (!presupuesto) return '';

    const trabajosRows = presupuesto.trabajos_detalle
      .map(
        (trabajo) => `
      <tr>
        <td>${trabajo.trabajo.nombre}</td>
        <td>${trabajo.cantidad} ${trabajo.trabajo.unidad_medida}</td>
        <td>$${trabajo.precio_unitario.toFixed(2)}</td>
        <td>$${trabajo.subtotal.toFixed(2)}</td>
      </tr>
    `
      )
      .join('');

    return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Presupuesto - ${presupuesto.cliente.nombre}</title>
      <style>
        body { font-family: Arial, sans-serif; margin: 20px; color: #333; }
        .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #007AFF; padding-bottom: 15px; }
        .header h1 { margin: 0 0 10px 0; font-size: 24px; }
        .header p { margin: 5px 0; font-size: 14px; color: #666; }
        table { width: 100%; border-collapse: collapse; margin-top: 20px; }
        th { background-color: #007AFF; color: white; padding: 12px; text-align: left; font-weight: bold; }
        td { border: 1px solid #ddd; padding: 10px; }
        tr:nth-child(even) { background-color: #f9f9f9; }
        .total-row { background-color: #007AFF; color: white; font-weight: bold; }
        .total-row td { border: none; padding: 15px 10px; }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>Presupuesto</h1>
        <p><strong>Cliente:</strong> ${presupuesto.cliente.nombre}</p>
        <p><strong>Fecha:</strong> ${formatDateForPDF(presupuesto.fecha)}</p>
      </div>
      <table>
        <thead>
          <tr>
            <th>Trabajo</th>
            <th>Cantidad</th>
            <th>Precio Unit.</th>
            <th>Subtotal</th>
          </tr>
        </thead>
        <tbody>
          ${trabajosRows}
          <tr class="total-row">
            <td colspan="3" style="text-align: right;">TOTAL MANO DE OBRA:</td>
            <td>$${presupuesto.total_mano_obra.toFixed(2)}</td>
          </tr>
        </tbody>
      </table>
    </body>
    </html>
    `;
  };

  const generateMaterialsHTML = (): string => {
    if (!presupuesto) return '';

    const allMateriales = presupuesto.trabajos_detalle.flatMap((t) => t.materiales || []);
    const aggregated = groupAndAggregateMaterials(allMateriales);

    const materialsRows = aggregated
      .map(
        (material) => `
      <tr>
        <td>${material.material.nombre}</td>
        <td>${formatMaterialDisplay(material)}</td>
      </tr>
    `
      )
      .join('');

    return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Materiales - ${presupuesto.cliente.nombre}</title>
      <style>
        body { font-family: Arial, sans-serif; margin: 20px; color: #333; }
        .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #007AFF; padding-bottom: 15px; }
        .header h1 { margin: 0 0 10px 0; font-size: 24px; }
        .header p { margin: 5px 0; font-size: 14px; color: #666; }
        table { width: 100%; border-collapse: collapse; margin-top: 20px; }
        th { background-color: #007AFF; color: white; padding: 12px; text-align: left; font-weight: bold; }
        td { border: 1px solid #ddd; padding: 10px; }
        tr:nth-child(even) { background-color: #f9f9f9; }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>Materiales Necesarios</h1>
        <p><strong>Cliente:</strong> ${presupuesto.cliente.nombre}</p>
        <p><strong>Fecha:</strong> ${formatDateForPDF(presupuesto.fecha)}</p>
      </div>
      <table>
        <thead>
          <tr>
            <th>Material</th>
            <th>Cantidad Total Necesaria</th>
          </tr>
        </thead>
        <tbody>
          ${materialsRows}
        </tbody>
      </table>
    </body>
    </html>
    `;
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

  const allMateriales = presupuesto.trabajos_detalle.flatMap((t) => t.materiales || []);

  return (
    <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top }]}>
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Header Info */}
        <View style={styles.infoCard}>
          <Text style={[styles.infoTitle, { color: colors.text, fontSize: fontScaling.heading2 }]}>
            {presupuesto.cliente.nombre}
          </Text>
          <Text style={[styles.infoDate, { color: colors.textSecondary, fontSize: fontScaling.body }]}>
            {formatDateForPDF(presupuesto.fecha)}
          </Text>
        </View>

        {/* Generate Options */}
        <View style={styles.optionsContainer}>
          <TouchableOpacity
            style={[styles.optionCard, { backgroundColor: colors.surface }]}
            onPress={generateWorksPDF}
            disabled={generating}
          >
            <Text style={[styles.optionTitle, { color: colors.text, fontSize: fontScaling.heading3 }]}>
              📋 Listado de Trabajos
            </Text>
            <Text style={[styles.optionDesc, { color: colors.textSecondary, fontSize: fontScaling.body }]}>
              {presupuesto.trabajos_detalle.length} trabajos
            </Text>
            {generating && <ActivityIndicator color={colors.primary} />}
          </TouchableOpacity>

          {allMateriales.length > 0 && (
            <TouchableOpacity
              style={[styles.optionCard, { backgroundColor: colors.surface }]}
              onPress={generateMaterialsPDF}
              disabled={generating}
            >
              <Text style={[styles.optionTitle, { color: colors.text, fontSize: fontScaling.heading3 }]}>
                📦 Lista de Materiales
              </Text>
              <Text style={[styles.optionDesc, { color: colors.textSecondary, fontSize: fontScaling.body }]}>
                {groupAndAggregateMaterials(allMateriales).length} materiales únicos
              </Text>
              {generating && <ActivityIndicator color={colors.primary} />}
            </TouchableOpacity>
          )}
        </View>

        {/* Summary */}
        <View style={[styles.summaryCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.summaryTitle, { color: colors.text, fontSize: fontScaling.heading3 }]}>
            Resumen
          </Text>
          <View style={styles.summaryRow}>
            <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>Total Mano de Obra:</Text>
            <Text style={[styles.summaryValue, { color: colors.primary }]}>
              {formatCurrency(presupuesto.total_mano_obra)}
            </Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={[styles.summaryLabel, { color: colors.text, fontWeight: 'bold' }]}>
              Total Final:
            </Text>
            <Text style={[styles.summaryValue, { color: colors.primary, fontWeight: 'bold' }]}>
              {formatCurrency(presupuesto.total_final)}
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* Footer */}
      <View style={[styles.footer, { backgroundColor: colors.surface, borderTopColor: colors.border }]}>
        <TouchableOpacity
          style={[styles.btn, { backgroundColor: colors.border }]}
          onPress={() => navigation.goBack()}
          disabled={generating}
        >
          <Text style={[styles.btnText, { color: colors.text }]}>Volver</Text>
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
  infoCard: {
    marginBottom: 24,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  infoTitle: {
    fontWeight: '600',
    marginBottom: 4,
  },
  infoDate: {
    fontWeight: '400',
  },
  optionsContainer: {
    marginBottom: 24,
  },
  optionCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#eee',
  },
  optionTitle: {
    fontWeight: '600',
    marginBottom: 4,
  },
  optionDesc: {
    fontWeight: '400',
  },
  summaryCard: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
  },
  summaryTitle: {
    fontWeight: '600',
    marginBottom: 12,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  summaryLabel: {
    fontWeight: '500',
  },
  summaryValue: {
    fontWeight: 'bold',
  },
  footer: {
    flexDirection: 'row',
    padding: 16,
    borderTopWidth: 1,
  },
  btn: {
    flex: 1,
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
  },
  btnText: {
    fontWeight: 'bold',
  },
  errorText: {
    fontSize: 16,
    textAlign: 'center',
  },
});
