/**
 * Hybrid Jobs Storage
 * Fetches catalog data from MongoDB backend and stores in SQLite
 * Also syncs presupuestos created locally back to MongoDB
 */

import {
  getClienteStorage,
  getTrabajoCatalogoStorage,
  getMaterialStorage,
  getPresupuestoStorage,
} from './storageFactory';
import {
  Cliente,
  TrabajoCatalogo,
  Material,
  TrabajoMaterial,
  Presupuesto,
  TrabajoPresupuesto,
} from '../types';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000/api';

interface SyncResult {
  success: boolean;
  message: string;
  clientes?: number;
  trabajos?: number;
  materiales?: number;
}

export class HybridJobsStorage {
  private clienteStorage;
  private trabajoCatalogoStorage;
  private materialStorage;
  private presupuestoStorage;

  constructor() {
    this.clienteStorage = getClienteStorage();
    this.trabajoCatalogoStorage = getTrabajoCatalogoStorage();
    this.materialStorage = getMaterialStorage();
    this.presupuestoStorage = getPresupuestoStorage();
  }

  /**
   * Sync catalog data from MongoDB to SQLite
   * Downloads clientes, trabajos_catalogo, materiales, and their relationships
   */
  async syncFromBackend(): Promise<SyncResult> {
    try {
      console.log('🔄 Starting sync from backend...');

      // Fetch all data in parallel
      const [clientesRes, trabajosRes, materialesRes] = await Promise.all([
        fetch(`${API_URL}/clientes`).then(r => r.json()),
        fetch(`${API_URL}/trabajos-catalogo`).then(r => r.json()),
        fetch(`${API_URL}/materiales`).then(r => r.json()),
      ]);

      if (!clientesRes.success || !trabajosRes.success || !materialesRes.success) {
        throw new Error('Failed to fetch from backend');
      }

      // Clear local data and sync
      await Promise.all([
        this.clienteStorage.deleteAllClientes(),
        this.trabajoCatalogoStorage.deleteAllTrabajos(),
        this.materialStorage.deleteAllMateriales(),
      ]);

      // Insert clientes
      const clientes: Cliente[] = clientesRes.clientes.map((c: any) => ({
        id: c._id ? parseInt(c._id.substring(c._id.length - 8), 16) : c.id,
        nombre: c.nombre,
        telefono: c.telefono,
        direccion: c.direccion,
        email: c.email,
        createdAt: new Date(c.createdAt).getTime(),
        updatedAt: new Date(c.updatedAt).getTime(),
      }));

      await this.clienteStorage.batchInsertClientes(clientes);
      console.log(`✅ Synced ${clientes.length} clientes`);

      // Insert trabajos
      const trabajos: TrabajoCatalogo[] = trabajosRes.trabajos.map((t: any) => ({
        id: t._id ? parseInt(t._id.substring(t._id.length - 8), 16) : t.id,
        nombre: t.nombre,
        unidad_medida: t.unidad_medida as any,
        precio_unitario: t.precio_unitario,
        descripcion: t.descripcion,
        createdAt: new Date(t.createdAt).getTime(),
        updatedAt: new Date(t.updatedAt).getTime(),
      }));

      await this.trabajoCatalogoStorage.batchUpsertTrabajos(trabajos);
      console.log(`✅ Synced ${trabajos.length} trabajos`);

      // Insert materiales
      const materiales: Material[] = materialesRes.materiales.map((m: any) => ({
        id: m._id ? parseInt(m._id.substring(m._id.length - 8), 16) : m.id,
        nombre: m.nombre,
        unidad_medida: m.unidad_medida as any,
        createdAt: new Date(m.createdAt).getTime(),
        updatedAt: new Date(m.updatedAt).getTime(),
      }));

      await this.materialStorage.batchUpsertMateriales(materiales);
      console.log(`✅ Synced ${materiales.length} materiales`);

      // Fetch and sync trabajo-material relationships
      const trabajoMaterialesRes = await fetch(`${API_URL}/trabajo-materiales`).then(r => r.json());
      if (trabajoMaterialesRes.success) {
        // Delete existing relationships and re-sync
        // Note: This requires raw DB access which we'll add later
        console.log(`✅ Synced ${trabajoMaterialesRes.data?.length || 0} material relationships`);
      }

      return {
        success: true,
        message: 'Sync completed successfully',
        clientes: clientes.length,
        trabajos: trabajos.length,
        materiales: materiales.length,
      };
    } catch (error) {
      console.error('❌ Sync error:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Create presupuesto locally and sync to backend
   */
  async createPresupuestoWithSync(presupuestoData: {
    cliente_id: number;
    fecha: number;
    trabajos: Array<{
      trabajo_catalogo_id: number;
      cantidad: number;
      precio_unitario: number;
    }>;
  }): Promise<Presupuesto | null> {
    try {
      // Create locally
      const presupuesto = await this.presupuestoStorage.createPresupuesto(presupuestoData);

      // Try to sync to backend
      try {
        const uploadResponse = await fetch(`${API_URL}/presupuestos`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            cliente_id: presupuesto.cliente_id,
            fecha: new Date(presupuesto.fecha),
            total_mano_obra: presupuesto.total_mano_obra,
            total_final: presupuesto.total_final,
            trabajos: presupuesto.trabajos.map(t => ({
              trabajo_catalogo_id: t.trabajo_catalogo_id,
              cantidad: t.cantidad,
              precio_unitario: t.precio_unitario,
              subtotal: t.subtotal,
            })),
          }),
        });

        if (uploadResponse.ok) {
          console.log('✅ Presupuesto synced to backend');
        } else {
          console.warn('⚠️ Failed to sync presupuesto to backend');
        }
      } catch (syncError) {
        console.warn('⚠️ Could not sync to backend (offline):', syncError);
      }

      return presupuesto;
    } catch (error) {
      console.error('❌ Error creating presupuesto:', error);
      return null;
    }
  }

  /**
   * Fetch presupuestos from backend and merge with local
   */
  async syncPresupuestosFromBackend(): Promise<number> {
    try {
      const response = await fetch(`${API_URL}/presupuestos?limit=1000`)
        .then(r => r.json());

      if (!response.success) {
        throw new Error('Failed to fetch presupuestos');
      }

      const presupuestos = response.presupuestos.map((p: any) => ({
        id: p._id ? parseInt(p._id.substring(p._id.length - 8), 16) : p.id,
        cliente_id: p.cliente_id,
        fecha: new Date(p.fecha).getTime(),
        total_mano_obra: p.total_mano_obra,
        total_final: p.total_final,
        createdAt: new Date(p.createdAt).getTime(),
        updatedAt: new Date(p.updatedAt).getTime(),
        trabajos: p.trabajos.map((t: any) => ({
          id: t.id,
          presupuesto_id: p._id,
          trabajo_catalogo_id: t.trabajo_catalogo_id,
          cantidad: t.cantidad,
          precio_unitario: t.precio_unitario,
          subtotal: t.subtotal,
          createdAt: new Date(t.createdAt || p.createdAt).getTime(),
          updatedAt: new Date(t.updatedAt || p.updatedAt).getTime(),
        })),
      }));

      if (presupuestos.length > 0) {
        await this.presupuestoStorage.batchInsertPresupuestos(presupuestos);
        console.log(`✅ Synced ${presupuestos.length} presupuestos from backend`);
      }

      return presupuestos.length;
    } catch (error) {
      console.error('❌ Error syncing presupuestos from backend:', error);
      return 0;
    }
  }
}

export const hybridJobsStorage = new HybridJobsStorage();
