/**
 * Presupuesto Storage Layer
 * Manages CRUD operations for Presupuesto and TrabajoPresupuesto in SQLite
 */

import { SQLiteDatabase } from 'expo-sqlite';
import { 
  Presupuesto, 
  TrabajoPresupuesto,
  PresupuestoDetalle,
  TrabajoPresupuestoDetalle,
  CreatePresupuestoData,
  Cliente,
  TrabajoCatalogo,
  Material
} from '../types';
import { ClienteStorage } from './clienteStorage';
import { TrabajoCatalogoStorage } from './trabajoCatalogoStorage';

export class PresupuestoStorage {
  private clienteStorage: ClienteStorage;
  private trabajoCatalogoStorage: TrabajoCatalogoStorage;

  constructor(
    private db: SQLiteDatabase,
    clienteStorage: ClienteStorage,
    trabajoCatalogoStorage: TrabajoCatalogoStorage
  ) {
    this.clienteStorage = clienteStorage;
    this.trabajoCatalogoStorage = trabajoCatalogoStorage;
  }

  /**
   * Get all presupuestos (simplified list for overview)
   */
  async getAllPresupuestos(): Promise<Presupuesto[]> {
    try {
      const result = await this.db.getAllAsync<Presupuesto>(`
        SELECT * FROM presupuestos
        ORDER BY fecha DESC
      `);
      return result || [];
    } catch (error) {
      console.error('Error fetching presupuestos:', error);
      throw error;
    }
  }

  /**
   * Get presupuesto with full details (for display)
   */
  async getPresupuestoDetalle(
    presupuestoId: number
  ): Promise<PresupuestoDetalle | null> {
    try {
      // Get presupuesto
      const presupuesto = await this.db.getFirstAsync<Presupuesto>(
        'SELECT * FROM presupuestos WHERE id = ?',
        [presupuestoId]
      );

      if (!presupuesto) return null;

      // Get cliente
      const cliente = await this.clienteStorage.getClienteById(presupuesto.cliente_id);
      if (!cliente) throw new Error('Cliente not found');

      // Get trabajos with materials
      const trabajos_presupuesto = await this.db.getAllAsync<TrabajoPresupuesto>(
        'SELECT * FROM trabajos_presupuesto WHERE presupuesto_id = ? ORDER BY id ASC',
        [presupuestoId]
      );

      // Enrich each trabajo with full details
      const trabajos_detalle: TrabajoPresupuestoDetalle[] = [];
      
      for (const trabajo_p of trabajos_presupuesto) {
        const trabajo = await this.trabajoCatalogoStorage.getTrabajoById(
          trabajo_p.trabajo_catalogo_id
        );
        
        if (!trabajo) {
          console.warn(`Trabajo ${trabajo_p.trabajo_catalogo_id} not found`);
          continue;
        }

        // Get materials for this trabajo
        const materiales_result = await this.db.getAllAsync<
          Material & { cantidad_por_unidad: number }
        >(`
          SELECT m.*, tm.cantidad_por_unidad 
          FROM materiales m
          JOIN trabajo_materiales tm ON m.id = tm.material_id
          WHERE tm.trabajo_catalogo_id = ?
        `, [trabajo.id]);

        const materiales = materiales_result?.map(m => ({
          material: {
            id: m.id,
            nombre: m.nombre,
            unidad_medida: m.unidad_medida as any,
            createdAt: m.createdAt,
            updatedAt: m.updatedAt
          },
          cantidad_necesaria: trabajo_p.cantidad * m.cantidad_por_unidad
        })) || [];

        trabajos_detalle.push({
          ...trabajo_p,
          trabajo,
          materiales
        });
      }

      return {
        ...presupuesto,
        cliente,
        trabajos_detalle
      };
    } catch (error) {
      console.error('Error fetching presupuesto detalle:', error);
      throw error;
    }
  }

  /**
   * Create new presupuesto with trabajos
   * 
   * Key: precio_unitario is COPIED from catalog, not referenced
   * This preserves historical accuracy even if catalog prices change
   */
  async createPresupuesto(data: CreatePresupuestoData): Promise<Presupuesto> {
    try {
      const now = Date.now();

      // Calculate totals
      const subtotals = data.trabajos.map(t => t.cantidad * t.precio_unitario);
      const total_mano_obra = subtotals.reduce((sum, st) => sum + st, 0);
      const total_final = total_mano_obra; // Materials don't affect total

      // Create presupuesto header
      const result = await this.db.runAsync(
        `INSERT INTO presupuestos 
         (cliente_id, fecha, total_mano_obra, total_final, createdAt, updatedAt)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [
          data.cliente_id,
          data.fecha,
          total_mano_obra,
          total_final,
          now,
          now
        ]
      );

      const presupuestoId = Number(result.lastInsertRowId);

      // Add trabajo items
      for (const trabajo of data.trabajos) {
        const subtotal = trabajo.cantidad * trabajo.precio_unitario;
        await this.db.runAsync(
          `INSERT INTO trabajos_presupuesto 
           (presupuesto_id, trabajo_catalogo_id, cantidad, precio_unitario, subtotal, createdAt, updatedAt)
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [
            presupuestoId,
            trabajo.trabajo_catalogo_id,
            trabajo.cantidad,
            trabajo.precio_unitario, // COPIED value, not reference
            subtotal,
            now,
            now
          ]
        );
      }

      return await this.getPresupuestoById(presupuestoId) as Presupuesto;
    } catch (error) {
      console.error('Error creating presupuesto:', error);
      throw error;
    }
  }

  /**
   * Get presupuesto by ID (simplified)
   */
  async getPresupuestoById(presupuestoId: number): Promise<Presupuesto | null> {
    try {
      const result = await this.db.getFirstAsync<Presupuesto>(
        'SELECT * FROM presupuestos WHERE id = ?',
        [presupuestoId]
      );
      return result || null;
    } catch (error) {
      console.error('Error fetching presupuesto:', error);
      throw error;
    }
  }

  /**
   * Update presupuesto
   * 
   * Note: Changing line items requires delete + re-add
   * This approach maintains audit trail and simplicity
   */
  async updatePresupuesto(
    presupuestoId: number,
    updates: {
      cliente_id?: number;
      trabajos?: CreatePresupuestoData['trabajos'];
    }
  ): Promise<Presupuesto> {
    try {
      const now = Date.now();
      const presupuesto = await this.getPresupuestoById(presupuestoId);
      if (!presupuesto) throw new Error('Presupuesto not found');

      // Update header if provided
      if (updates.cliente_id || updates.trabajos) {
        const nuevos_trabajos = updates.trabajos || [];
        const subtotals = nuevos_trabajos.map(t => t.cantidad * t.precio_unitario);
        const total_mano_obra = subtotals.reduce((sum, st) => sum + st, 0);

        await this.db.runAsync(
          `UPDATE presupuestos 
           SET cliente_id = ?, total_mano_obra = ?, total_final = ?, updatedAt = ?
           WHERE id = ?`,
          [
            updates.cliente_id || presupuesto.cliente_id,
            total_mano_obra,
            total_mano_obra, // total_final = total_mano_obra
            now,
            presupuestoId
          ]
        );

        // If trabajos updated, replace them
        if (updates.trabajos) {
          await this.db.runAsync(
            'DELETE FROM trabajos_presupuesto WHERE presupuesto_id = ?',
            [presupuestoId]
          );

          for (const trabajo of updates.trabajos) {
            const subtotal = trabajo.cantidad * trabajo.precio_unitario;
            await this.db.runAsync(
              `INSERT INTO trabajos_presupuesto 
               (presupuesto_id, trabajo_catalogo_id, cantidad, precio_unitario, subtotal, createdAt, updatedAt)
               VALUES (?, ?, ?, ?, ?, ?, ?)`,
              [
                presupuestoId,
                trabajo.trabajo_catalogo_id,
                trabajo.cantidad,
                trabajo.precio_unitario,
                subtotal,
                now,
                now
              ]
            );
          }
        }
      }

      return await this.getPresupuestoById(presupuestoId) as Presupuesto;
    } catch (error) {
      console.error('Error updating presupuesto:', error);
      throw error;
    }
  }

  /**
   * Delete presupuesto (cascade deletes trabajos)
   */
  async deletePresupuesto(presupuestoId: number): Promise<boolean> {
    try {
      const result = await this.db.runAsync(
        'DELETE FROM presupuestos WHERE id = ?',
        [presupuestoId]
      );
      return result.changes > 0;
    } catch (error) {
      console.error('Error deleting presupuesto:', error);
      throw error;
    }
  }

  /**
   * Get presupuestos by cliente
   */
  async getPresupuestosByCliente(clienteId: number): Promise<Presupuesto[]> {
    try {
      const result = await this.db.getAllAsync<Presupuesto>(
        'SELECT * FROM presupuestos WHERE cliente_id = ? ORDER BY fecha DESC',
        [clienteId]
      );
      return result || [];
    } catch (error) {
      console.error('Error fetching presupuestos by cliente:', error);
      throw error;
    }
  }

  /**
   * Delete all presupuestos (for sync reset)
   */
  async deleteAllPresupuestos(): Promise<void> {
    try {
      await this.db.runAsync('DELETE FROM presupuestos');
    } catch (error) {
      console.error('Error deleting all presupuestos:', error);
      throw error;
    }
  }

  /**
   * Batch insert presupuestos (for sync)
   */
  async batchInsertPresupuestos(
    presupuestos: Array<Presupuesto & { trabajos: TrabajoPresupuesto[] }>
  ): Promise<void> {
    try {
      const now = Date.now();
      for (const presupuesto of presupuestos) {
        // Insert presupuesto header
        await this.db.runAsync(
          `INSERT OR REPLACE INTO presupuestos 
           (id, cliente_id, fecha, total_mano_obra, total_final, createdAt, updatedAt)
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [
            presupuesto.id,
            presupuesto.cliente_id,
            presupuesto.fecha,
            presupuesto.total_mano_obra,
            presupuesto.total_final,
            presupuesto.createdAt || now,
            presupuesto.updatedAt || now
          ]
        );

        // Insert trabajos
        for (const trabajo of presupuesto.trabajos) {
          await this.db.runAsync(
            `INSERT OR REPLACE INTO trabajos_presupuesto 
             (id, presupuesto_id, trabajo_catalogo_id, cantidad, precio_unitario, subtotal, createdAt, updatedAt)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [
              trabajo.id,
              trabajo.presupuesto_id,
              trabajo.trabajo_catalogo_id,
              trabajo.cantidad,
              trabajo.precio_unitario,
              trabajo.subtotal,
              trabajo.createdAt || now,
              trabajo.updatedAt || now
            ]
          );
        }
      }
    } catch (error) {
      console.error('Error batch inserting presupuestos:', error);
      throw error;
    }
  }

  /**
   * Get presupuesto count
   */
  async getPresupuestoCount(): Promise<number> {
    try {
      const result = await this.db.getFirstAsync<{ count: number }>(
        'SELECT COUNT(*) as count FROM presupuestos'
      );
      return result?.count || 0;
    } catch (error) {
      console.error('Error counting presupuestos:', error);
      throw error;
    }
  }
}
