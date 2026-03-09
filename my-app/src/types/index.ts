// ============================================
// CLIENTE - Customer/Client
// ============================================

export interface Cliente {
  id: number;
  nombre: string;
  telefono?: string;
  direccion?: string;
  email?: string;
  createdAt?: string;
  updatedAt?: string;
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
  createdAt?: string;
  updatedAt?: string;
}

// ============================================
// MATERIAL - Material Catalog
// ============================================

export interface Material {
  id: number;
  nombre: string;
  unidad_medida: UnidadMaterial;
  createdAt?: string;
  updatedAt?: string;
}

// ============================================
// TRABAJO-MATERIAL - Material Requirements
// ============================================

export interface TrabajoMaterial {
  id: number;
  trabajo_catalogo_id: number;
  material_id: number;
  cantidad_por_unidad: number;
  createdAt?: string;
  updatedAt?: string;
}


// ============================================
// TRABAJO EN PRESUPUESTO - Line Item
// ============================================

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
// PRESUPUESTO
// ============================================

export interface Presupuesto {
  id: number;
  cliente_id: number;
  fecha: string;
  total_mano_obra: number;
  total_final: number;
  trabajos: TrabajoPresupuesto[];
  createdAt?: string;
  updatedAt?: string;
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
  fecha: string;
  trabajos: Array<{
    trabajo_catalogo_id: number;
    cantidad: number;
    precio_unitario: number;
  }>;
}

// ============================================
// ALIASES FOR TYPESCRIPT NAMING CONSISTENCY
// ============================================
// English aliases for existing Spanish types
export type JobWork = TrabajoPresupuesto;
export type Job = TrabajoCatalogo;
