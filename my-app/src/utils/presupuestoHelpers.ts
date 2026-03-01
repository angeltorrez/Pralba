/**
 * Presupuesto Business Logic Helpers
 * Senior-level utilities for presupuesto operations
 */

import { TrabajoPresupuestoDetalle, CalculatedMaterial } from '../types';
import { getPresupuestoStorage, getTrabajoCatalogoStorage, getMaterialStorage } from '../storage/storageFactory';

/**
 * Calculate subtotal for a trabajo presupuesto
 */
export const calculateSubtotal = (cantidad: number, precio_unitario: number): number => {
  return cantidad * precio_unitario;
};

/**
 * Calculate total from all trabajos
 */
export const calculateTotal = (trabajos: TrabajoPresupuestoDetalle[]): number => {
  return trabajos.reduce((sum, trabajo) => sum + trabajo.subtotal, 0);
};

/**
 * Get materials calculated for a single trabajo
 */
export const getMaterialsForTrabajo = (
  trabajo: TrabajoPresupuestoDetalle
): CalculatedMaterial[] => {
  return trabajo.materiales || [];
};

/**
 * Group materials by name (for PDF/summary)
 */
export const groupAndAggregateMaterials = (
  allMateriales: CalculatedMaterial[]
): CalculatedMaterial[] => {
  const grouped: { [key: string]: CalculatedMaterial } = {};

  allMateriales.forEach((item) => {
    const key = `${item.material.nombre}|${item.material.unidad_medida}`;
    if (grouped[key]) {
      grouped[key].cantidad_necesaria += item.cantidad_necesaria;
    } else {
      grouped[key] = { ...item };
    }
  });

  return Object.values(grouped);
};

/**
 * Format material for display
 * Example: "5 m3 de Arena" or "2 bolsas de Cemento"
 */
export const formatMaterialDisplay = (material: CalculatedMaterial): string => {
  const { cantidad_necesaria, material: mat } = material;

  // Handle fractions for quantities < 1
  if (cantidad_necesaria < 1 && cantidad_necesaria > 0) {
    const fractionMap: { [key: number]: string } = {
      0.25: '1/4',
      0.33: '1/3',
      0.5: '1/2',
      0.66: '2/3',
      0.75: '3/4',
    };

    const rounded = Math.round(cantidad_necesaria * 100) / 100;
    const fraction = Object.entries(fractionMap).find(
      ([key]) => Math.abs(parseFloat(key) - rounded) < 0.01
    );

    if (fraction) {
      return `${fraction[1]} ${mat.unidad_medida} de ${mat.nombre}`;
    }
  }

  const displayQty = cantidad_necesaria % 1 === 0 
    ? cantidad_necesaria.toString() 
    : cantidad_necesaria.toFixed(2);

  return `${displayQty} ${mat.unidad_medida} de ${mat.nombre}`;
};

/**
 * Validate presupuesto data before saving
 */
export const validatePresupuesto = (
  cliente_id: number,
  trabajos: Array<{ trabajo_catalogo_id: number; cantidad: number; precio_unitario: number }>
): string | null => {
  if (!cliente_id) {
    return 'Cliente is required';
  }

  if (!trabajos || trabajos.length === 0) {
    return 'At least one trabajo is required';
  }

  for (const trabajo of trabajos) {
    if (trabajo.cantidad <= 0) {
      return 'Cantidad must be greater than 0';
    }
    if (trabajo.precio_unitario < 0) {
      return 'Precio unitario cannot be negative';
    }
  }

  return null;
};

/**
 * Format currency
 */
export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency: 'USD',
  }).format(amount);
};
