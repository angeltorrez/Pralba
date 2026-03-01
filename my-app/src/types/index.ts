/**
 * TypeScript Interfaces for PresuObra
 * Relational Database Model
 */

// ============================================
// CLIENTE - Customer/Client
// ============================================

export interface Cliente {
  id: number;
  nombre: string;
  telefono?: string;
  direccion?: string;
  email?: string;
  createdAt?: number;
  updatedAt?: number;
}

// ============================================
// TRABAJO CATÁLOGO - Job Template/Price List
// ============================================

export type UnidadMedida = 'm2' | 'm' | 'ml' | 'unidad' | 'hora' | 'día';
export type UnidadMaterial = 'kg' | 'l' | 'u' | 'bolsas' | 'm' | 'm2' | 'm3';

export interface TrabajoCatalogo {
  id: number;
  nombre: string;
  unidad_medida: UnidadMedida;
  precio_unitario: number;
  descripcion?: string;
  createdAt?: number;
  updatedAt?: number;
}

// ============================================
// MATERIAL - Material Catalog
// ============================================

export interface Material {
  id: number;
  nombre: string;
  unidad_medida: UnidadMaterial;
  createdAt?: number;
  updatedAt?: number;
}

// ============================================
// TRABAJO-MATERIAL - Material Requirements
// ============================================

export interface MaterialFormula {
  id: number;
  trabajo_catalogo_id: number;
  material_id: number;
  cantidad_por_unidad: number;
  createdAt?: number;
  updatedAt?: number;
}

// Alias for compatibility
export type TrabajoMaterial = MaterialFormula;

// ============================================
// TRABAJO EN PRESUPUESTO - Line Item
// ============================================

/**
 * This represents a work item added to a presupuesto
 * The precio_unitario is COPIED from the catalog at creation time
 * so changes to catalog prices don't affect existing presupuestos
 */
export interface TrabajoPresupuesto {
  id: number;
  presupuesto_id: number;
  trabajo_catalogo_id: number;
  cantidad: number;
  precio_unitario: number;
  subtotal: number;
  createdAt?: number;
  updatedAt?: number;
}

// ============================================
// PRESUPUESTO - Budget/Quote
// ============================================

/**
 * Main budget/quote entity
 * Contains all line items (trabajos) and metadata
 * total_mano_obra = sum of all subtotals
 * total_final = total_mano_obra (materials don't add to total)
 */
export interface Presupuesto {
  id: number;
  cliente_id: number;
  fecha: number;
  total_mano_obra: number;
  total_final: number;
  trabajos: TrabajoPresupuesto[];
  createdAt?: number;
  updatedAt?: number;
  synced?: boolean;
}

// ============================================
// EXPANDED VIEWS - For UI Display
// ============================================

export interface PresupuestoDetalle extends Presupuesto {
  cliente: Cliente;
  trabajos_detalle: TrabajoPresupuestoDetalle[];
}

export interface TrabajoPresupuestoDetalle extends TrabajoPresupuesto {
  trabajo: TrabajoCatalogo;
  materiales: CalculatedMaterial[];
}

export interface CalculatedMaterial {
  material: Material;
  cantidad_necesaria: number;
}

// ============================================
// SYNC & STORAGE TYPES
// ============================================

export interface SyncMetadata {
  key: string;
  value: any;
  timestamp: number;
}

export interface CreatePresupuestoData {
  cliente_id: number;
  fecha: number;
  trabajos: Array<{
    trabajo_catalogo_id: number;
    cantidad: number;
    precio_unitario: number;
  }>;
}
