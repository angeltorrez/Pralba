import { CalculatedMaterial } from '../types';

/**
 * Format a calculated material for display
 * Example: "5 m3 de Arena" or "2 bolsas de Cemento"
 */
export const formatMaterial = (material: CalculatedMaterial): string => {
  // Check if quantity is a decimal that should show as fraction
  if (material.cantidad_necesaria < 1 && material.cantidad_necesaria > 0) {
    const fractionMap: { [key: number]: string } = {
      0.25: '1/4',
      0.33: '1/3',
      0.5: '1/2',
      0.66: '2/3',
      0.75: '3/4',
    };
    
    const roundedQty = Math.round(material.cantidad_necesaria * 100) / 100;
    const fraction = Object.keys(fractionMap).find(
      (key) => Math.abs(parseFloat(key) - roundedQty) < 0.01
    );
    
    if (fraction) {
      return `${fractionMap[parseInt(fraction)]} ${material.material.unidad_medida} de ${material.material.nombre}`;
    }
  }

  // Format quantity with appropriate decimals
  const displayQty = material.cantidad_necesaria % 1 === 0 
    ? material.cantidad_necesaria.toString() 
    : material.cantidad_necesaria.toFixed(2);

  return `${displayQty} ${material.material.unidad_medida} de ${material.material.nombre}`;
};

/**
 * Group materials by name for summary view
 * Useful for PDF generation to combine same materials
 */
export const groupMaterialsByName = (
  materials: CalculatedMaterial[]
): CalculatedMaterial[] => {
  const grouped: { [key: string]: CalculatedMaterial } = {};

  materials.forEach((material) => {
    const key = `${material.material.nombre}|${material.material.unidad_medida}`;
    if (grouped[key]) {
      grouped[key].cantidad_necesaria += material.cantidad_necesaria;
    } else {
      grouped[key] = { ...material };
    }
  });

  return Object.values(grouped);
};
