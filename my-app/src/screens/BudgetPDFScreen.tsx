import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
  Alert,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { useTheme } from '../context/ThemeContext';
import { Budget } from '../types';
import { budgetStorage } from '../storage/budgetStorage';
import { jobsStorage } from '../storage/jobsStorage';
import { formatDateForPDF } from '../utils/dateFormatter';
import { formatMaterial, groupMaterialsByName } from '../utils/calculateMaterials';

type RootStackParamList = {
  BudgetPDF: { budgetId: string };
};

type BudgetPDFScreenProps = NativeStackScreenProps<RootStackParamList, 'BudgetPDF'>;

export const BudgetPDFScreen: React.FC<BudgetPDFScreenProps> = ({ route, navigation }) => {
  const { colors, fontScaling } = useTheme();
  const insets = useSafeAreaInsets();
  const [budget, setBudget] = useState<Budget | null>(null);
  const [jobsData, setJobsData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadBudgetData();
  }, []);

  const loadBudgetData = async () => {
    try {
      const budgetData = await budgetStorage.getBudgetById(route.params.budgetId);
      setBudget(budgetData);

      const jobs = await jobsStorage.getAllJobs();
      setJobsData(jobs);
    } catch (error) {
      console.error('Error loading budget:', error);
      Alert.alert('Error', 'No se pudo cargar el presupuesto');
    } finally {
      setLoading(false);
    }
  };

  const generateWorksPDF = async () => {
    if (!budget) return;

    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Presupuesto - Trabajos</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              margin: 20px;
              color: #333;
            }
            .header {
              text-align: center;
              margin-bottom: 30px;
              border-bottom: 2px solid #007AFF;
              padding-bottom: 15px;
            }
            .header h1 {
              margin: 0 0 10px 0;
              font-size: 24px;
            }
            .header p {
              margin: 5px 0;
              font-size: 14px;
              color: #666;
            }
            .works-table {
              width: 100%;
              border-collapse: collapse;
              margin-top: 20px;
            }
            .works-table th {
              background-color: #007AFF;
              color: white;
              padding: 12px;
              text-align: left;
              font-weight: bold;
            }
            .works-table td {
              border: 1px solid #ddd;
              padding: 10px;
            }
            .works-table tr:nth-child(even) {
              background-color: #f9f9f9;
            }
            .total-section {
              margin-top: 30px;
              padding: 20px;
              background-color: #f0f0f0;
              border-radius: 5px;
              text-align: right;
            }
            .total-section h3 {
              margin: 0;
              font-size: 18px;
              color: #007AFF;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Presupuesto de Trabajos</h1>
            <p><strong>Cliente/Obra:</strong> ${budget.clientOrProject}</p>
            <p><strong>Fecha:</strong> ${formatDateForPDF(budget.createdAt)}</p>
          </div>

          <table class="works-table">
            <thead>
              <tr>
                <th>Trabajo</th>
                <th>Cantidad</th>
                <th>Precio Unit.</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              ${budget.works
                .map(
                  (work) => `
                <tr>
                  <td>${work.jobName}</td>
                  <td>${work.quantity}</td>
                  <td>$${work.unitPrice.toFixed(2)}</td>
                  <td>$${work.total.toFixed(2)}</td>
                </tr>
              `
                )
                .join('')}
            </tbody>
          </table>

          <div class="total-section">
            <h3>Total del Presupuesto: $${budget.totalAmount.toFixed(2)}</h3>
          </div>
        </body>
      </html>
    `;

    try {
      const { uri } = await Print.printToFileAsync({
        html: htmlContent,
      });

      await Sharing.shareAsync(uri, {
        mimeType: 'application/pdf',
        dialogTitle: 'Compartir Presupuesto de Trabajos',
        UTI: 'com.adobe.pdf',
      });
    } catch (error) {
      Alert.alert('Error', 'No se pudo generar el PDF de trabajos');
    }
  };

  const generateMaterialsPDF = async () => {
    if (!budget) return;

    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Presupuesto - Materiales</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              margin: 20px;
              color: #333;
            }
            .header {
              text-align: center;
              margin-bottom: 30px;
              border-bottom: 2px solid #34C759;
              padding-bottom: 15px;
            }
            .header h1 {
              margin: 0 0 10px 0;
              font-size: 24px;
            }
            .header p {
              margin: 5px 0;
              font-size: 14px;
              color: #666;
            }
            .work-section {
              margin-top: 25px;
              padding: 15px;
              border: 1px solid #ddd;
              border-radius: 8px;
              background-color: #f9f9f9;
            }
            .work-title {
              font-size: 16px;
              font-weight: bold;
              color: #333;
              margin: 0 0 10px 0;
              padding-bottom: 8px;
              border-bottom: 2px solid #34C759;
            }
            .work-details {
              font-size: 12px;
              color: #666;
              margin: 8px 0;
            }
            .materials-list {
              margin-top: 10px;
              margin-left: 15px;
            }
            .material-item {
              font-size: 12px;
              color: #333;
              padding: 5px 0;
              list-style: disc;
              font-weight: 500;
            }
            .no-materials {
              font-size: 12px;
              color: #999;
              font-style: italic;
              margin-top: 8px;
            }
            .summary-section {
              margin-top: 30px;
              padding: 20px;
              border: 2px solid #34C759;
              border-radius: 8px;
              background-color: #f0fdf4;
            }
            .summary-title {
              font-size: 18px;
              font-weight: bold;
              color: #34C759;
              margin: 0 0 15px 0;
            }
            .summary-item {
              font-size: 12px;
              color: #333;
              padding: 8px 0;
              border-bottom: 1px solid #e5e7eb;
            }
            .summary-item:last-child {
              border-bottom: none;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Presupuesto - Materiales Estimados</h1>
            <p><strong>Cliente/Obra:</strong> ${budget.clientOrProject}</p>
            <p><strong>Fecha:</strong> ${formatDateForPDF(budget.createdAt)}</p>
          </div>

          ${budget.works
            .map(
              (work) => {
                const hasMaterials = work.calculatedMaterials && work.calculatedMaterials.length > 0;
                return `
            <div class="work-section">
              <p class="work-title">${work.jobName}</p>
              <div class="work-details">
                <strong>Cantidad:</strong> ${work.quantity} ${work.unit} | 
                <strong>Precio Unit.:</strong> $${work.unitPrice.toFixed(2)} | 
                <strong>Total:</strong> $${work.total.toFixed(2)}
              </div>
              ${
                hasMaterials
                  ? `
                <div class="materials-list">
                  <strong>Materiales Calculados:</strong>
                  <ul style="margin: 8px 0; padding-left: 20px;">
                    ${work.calculatedMaterials
                      .map(
                        (material) =>
                          `<li class="material-item">${formatMaterial(material)}</li>`
                      )
                      .join('')}
                  </ul>
                </div>
              `
                  : work.estimatedMaterials && work.estimatedMaterials.length > 0
                  ? `
                <div class="materials-list">
                  <strong>Materiales Estimados:</strong>
                  <ul style="margin: 8px 0; padding-left: 20px;">
                    ${work.estimatedMaterials
                      .map((material) => `<li class="material-item">${material}</li>`)
                      .join('')}
                  </ul>
                </div>
              `
                  : '<p class="no-materials">Sin materiales definidos</p>'
              }
            </div>
          `;
              }
            )
            .join('')}

          ${
            budget.works.some((w) => w.calculatedMaterials && w.calculatedMaterials.length > 0)
              ? `
          <div class="summary-section">
            <div class="summary-title">📊 Resumen Total de Materiales</div>
            ${groupMaterialsByName(
              budget.works.reduce(
                (acc, work) => [...acc, ...(work.calculatedMaterials || [])],
                [] as any[]
              )
            )
              .map((material) => `<div class="summary-item">${formatMaterial(material)}</div>`)
              .join('')}
          </div>
        `
              : ''
          }
        </body>
      </html>
    `;

    try {
      const { uri } = await Print.printToFileAsync({
        html: htmlContent,
      });

      await Sharing.shareAsync(uri, {
        mimeType: 'application/pdf',
        dialogTitle: 'Compartir Presupuesto con Materiales',
        UTI: 'com.adobe.pdf',
      });
    } catch (error) {
      Alert.alert('Error', 'No se pudo generar el PDF de materiales');
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top }]}>
        <ActivityIndicator size="large" color={colors.primary} style={styles.loader} />
      </View>
    );
  }

  if (!budget) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top }]}>
        <View style={styles.errorContainer}>
          <Text style={[styles.errorText, { color: colors.text }]}>
            No se pudo cargar el presupuesto
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top }]}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={[styles.backButton, { color: colors.primary }]}>← Volver</Text>
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text, fontSize: fontScaling.heading2 }]}>
          Generar PDFs
        </Text>
        <TouchableOpacity
          onPress={() => navigation.navigate('Home' as any)}
          style={[styles.cancelButton, { backgroundColor: colors.danger }]}
        >
          <Text style={[styles.cancelButtonText, { fontSize: fontScaling.body }]}>Cancelar</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={[styles.fileName, { color: colors.text, fontSize: fontScaling.body }]}>
          Presupuesto: <Text style={{ fontWeight: 'bold' }}>{budget.clientOrProject}</Text>
        </Text>

        <View style={[styles.pdfCard, { backgroundColor: colors.surface, borderColor: colors.primary }]}>
          <View style={styles.pdfCardHeader}>
            <Text style={[styles.pdfTitle, { color: colors.text, fontSize: fontScaling.heading3 }]}>
              📋 Trabajos
            </Text>
            <Text style={[styles.pdfDescription, { color: colors.textSecondary, fontSize: fontScaling.small }]}>
              Lista de trabajos con precios y cantidades
            </Text>
          </View>

          <View style={styles.pdfCardContent}>
            <Text style={[styles.itemInfo, { color: colors.textSecondary, fontSize: fontScaling.body }]}>
              {budget.works.length} trabajos agregados
            </Text>
            <Text style={[styles.totalInfo, { color: colors.success, fontSize: fontScaling.heading3 }]}>
              Total: ${budget.totalAmount.toFixed(2)}
            </Text>
          </View>

          <TouchableOpacity
            onPress={generateWorksPDF}
            style={[styles.pdfButton, { backgroundColor: colors.primary }]}
          >
            <Text style={[styles.buttonText, { fontSize: fontScaling.body }]}>
              📥 Descargar y Compartir
            </Text>
          </TouchableOpacity>
        </View>

        <View style={[styles.pdfCard, { backgroundColor: colors.surface, borderColor: colors.success }]}>
          <View style={styles.pdfCardHeader}>
            <Text style={[styles.pdfTitle, { color: colors.text, fontSize: fontScaling.heading3 }]}>
              🔧 Materiales Estimados
            </Text>
            <Text style={[styles.pdfDescription, { color: colors.textSecondary, fontSize: fontScaling.small }]}>
              Desglose de materiales por trabajo
            </Text>
          </View>

          <View style={styles.pdfCardContent}>
            <Text style={[styles.itemInfo, { color: colors.textSecondary, fontSize: fontScaling.body }]}>
              {budget.works.filter((w) => w.estimatedMaterials.length > 0).length} trabajos con materiales
            </Text>
            <Text style={[styles.materialsCount, { color: colors.success, fontSize: fontScaling.heading3 }]}>
              {budget.works.reduce((acc, w) => acc + w.estimatedMaterials.length, 0)} materiales
            </Text>
          </View>

          <TouchableOpacity
            onPress={generateMaterialsPDF}
            style={[styles.pdfButton, { backgroundColor: colors.success }]}
          >
            <Text style={[styles.buttonText, { fontSize: fontScaling.body }]}>
              📥 Descargar y Compartir
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.infoBox}>
          <Text style={[styles.infoText, { color: colors.textSecondary, fontSize: fontScaling.small }]}>
            💡 Puedes descargar y compartir los PDFs por correo, WhatsApp o guardarlos en tu dispositivo.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  backButton: {
    fontSize: 14,
    fontWeight: '600',
  },
  headerTitle: {
    fontWeight: '700',
    textAlign: 'center',
  },
  cancelButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  cancelButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  fileName: {
    marginBottom: 20,
    fontWeight: '500',
  },
  pdfCard: {
    borderWidth: 1.5,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  pdfCardHeader: {
    marginBottom: 12,
  },
  pdfTitle: {
    fontWeight: '700',
    marginBottom: 4,
  },
  pdfDescription: {
    marginBottom: 0,
  },
  pdfCardContent: {
    marginBottom: 14,
    paddingVertical: 8,
  },
  itemInfo: {
    marginBottom: 6,
  },
  totalInfo: {
    fontWeight: '700',
  },
  materialsCount: {
    fontWeight: '700',
  },
  pdfButton: {
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontWeight: '700',
  },
  infoBox: {
    backgroundColor: '#f0f0f0',
    padding: 12,
    borderRadius: 8,
    marginTop: 16,
    marginBottom: 24,
  },
  infoText: {
    textAlign: 'center',
    lineHeight: 18,
  },
  loader: {
    flex: 1,
    justifyContent: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    fontSize: 16,
  },
});
