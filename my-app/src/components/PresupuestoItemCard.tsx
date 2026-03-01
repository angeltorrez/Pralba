/**
 * PresupuestoItemCard Component
 * Reusable card for displaying trabajo presupuesto with materials
 */

import React from 'react';
import { View, Text, FlatList, StyleSheet } from 'react-native';
import { TrabajoPresupuestoDetalle } from '../types';
import { formatMaterialDisplay } from '../utils/presupuestoHelpers';
import { useTheme } from '../context/ThemeContext';

interface PresupuestoItemCardProps {
  item: TrabajoPresupuestoDetalle;
  showMaterials?: boolean;
}

export const PresupuestoItemCard: React.FC<PresupuestoItemCardProps> = ({
  item,
  showMaterials = true,
}) => {
  const { colors, fontScaling } = useTheme();

  return (
    <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      {/* Header: Trabajo name and subtotal */}
      <View style={styles.header}>
        <View style={styles.titleSection}>
          <Text style={[styles.title, { color: colors.text, fontSize: fontScaling.heading3 }]}>
            {item.trabajo.nombre}
          </Text>
          <Text style={[styles.quantity, { color: colors.textSecondary, fontSize: fontScaling.body }]}>
            {item.cantidad} {item.trabajo.unidad_medida} × ${item.precio_unitario.toFixed(2)}
          </Text>
        </View>
        <Text style={[styles.subtotal, { color: colors.primary, fontSize: fontScaling.heading2 }]}>
          ${item.subtotal.toFixed(2)}
        </Text>
      </View>

      {/* Materials section */}
      {showMaterials && item.materiales && item.materiales.length > 0 && (
        <View style={[styles.materialsSection, { backgroundColor: colors.background, borderColor: colors.border }]}>
          <Text style={[styles.materialsTitle, { color: colors.text, fontSize: fontScaling.small }]}>
            Materiales necesarios
          </Text>
          <FlatList
            data={item.materiales}
            renderItem={({ item: material }) => (
              <Text style={[styles.material, { color: colors.textSecondary, fontSize: fontScaling.small }]}>
                • {formatMaterialDisplay(material)}
              </Text>
            )}
            keyExtractor={(_, idx) => idx.toString()}
            scrollEnabled={false}
          />
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  titleSection: {
    flex: 1,
  },
  title: {
    fontWeight: '600',
    marginBottom: 4,
  },
  quantity: {
    fontWeight: '500',
  },
  subtotal: {
    fontWeight: 'bold',
    marginLeft: 12,
    textAlign: 'right',
  },
  materialsSection: {
    marginTop: 12,
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
  },
  materialsTitle: {
    fontWeight: '600',
    marginBottom: 8,
  },
  material: {
    fontWeight: '400',
    marginBottom: 4,
  },
});
