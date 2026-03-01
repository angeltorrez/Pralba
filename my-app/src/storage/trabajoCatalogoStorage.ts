/**
 * Trabajo Catalogo Storage Layer
 * Manages CRUD operations for TrabajoCatalogo in SQLite
 */

import { Database } from 'expo-sqlite';
import { TrabajoCatalogo, TrabajoMaterial, Material } from '../types';

export class TrabajoCatalogoStorage {
  constructor(private db: Database) {}

  /**
   * Get all trabajos from catalog
   */
  async getAllTrabajos(): Promise<TrabajoCatalogo[]> {
    try {
      const result = await this.db.getAllAsync<TrabajoCatalogo>(`
        SELECT * FROM trabajos_catalogo
        ORDER BY nombre ASC
      `);
      return result || [];
    } catch (error) {
      console.error('Error fetching trabajos catalogo:', error);
      throw error;
    }
  }

  /**
   * Get specific trabajo by ID
   */
  async getTrabajoById(id: number): Promise<TrabajoCatalogo | null> {
    try {
      const result = await this.db.getFirstAsync<TrabajoCatalogo>(`
        SELECT * FROM trabajos_catalogo WHERE id = ?
      `, [id]);
      return result || null;
    } catch (error) {
      console.error('Error fetching trabajo:', error);
      throw error;
    }
  }

  /**
   * Get trabajo with all its associated materiales
   */
  async getTrabajoWithMateriales(
    trabajoId: number
  ): Promise<{
    trabajo: TrabajoCatalogo;
    materiales: Array<{
      material: Material;
      cantidad_por_unidad: number;
    }>;
  } | null> {
    try {
      const trabajo = await this.getTrabajoById(trabajoId);
      if (!trabajo) return null;

      // Get associated materials with join
      const materiales = await this.db.getAllAsync<
        Material & { cantidad_por_unidad: number }
      >(`
        SELECT m.*, tm.cantidad_por_unidad 
        FROM materiales m
        JOIN trabajo_materiales tm ON m.id = tm.material_id
        WHERE tm.trabajo_catalogo_id = ?
        ORDER BY m.nombre ASC
      `, [trabajoId]);

      return {
        trabajo,
        materiales: materiales?.map(m => ({
          material: {
            id: m.id,
            nombre: m.nombre,
            unidad_medida: m.unidad_medida as any,
            createdAt: m.createdAt,
            updatedAt: m.updatedAt
          },
          cantidad_por_unidad: m.cantidad_por_unidad
        })) || []
      };
    } catch (error) {
      console.error('Error fetching trabajo with materiales:', error);
      throw error;
    }
  }

  /**
   * Create new trabajo in catalog
   */
  async saveTrabajo(
    trabajo: Omit<TrabajoCatalogo, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<TrabajoCatalogo> {
    try {
      const now = Date.now();
      const result = await this.db.runAsync(
        `INSERT INTO trabajos_catalogo 
         (nombre, unidad_medida, precio_unitario, descripcion, createdAt, updatedAt)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [
          trabajo.nombre,
          trabajo.unidad_medida,
          trabajo.precio_unitario,
          trabajo.descripcion || null,
          now,
          now
        ]
      );

      if (result.lastInsertRowId) {
        return await this.getTrabajoById(Number(result.lastInsertRowId)) as TrabajoCatalogo;
      }

      throw new Error('Failed to create trabajo');
    } catch (error) {
      console.error('Error saving trabajo:', error);
      throw error;
    }
  }

  /**
   * Update trabajo in catalog (price, etc.)
   */
  async updateTrabajo(
    id: number,
    updates: Partial<TrabajoCatalogo>
  ): Promise<TrabajoCatalogo> {
    try {
      const now = Date.now();
      const updateFields = [
        ...(updates.nombre !== undefined ? ['nombre = ?'] : []),
        ...(updates.precio_unitario !== undefined ? ['precio_unitario = ?'] : []),
        ...(updates.descripcion !== undefined ? ['descripcion = ?'] : []),
        'updatedAt = ?'
      ];

      const values = [
        ...(updates.nombre !== undefined ? [updates.nombre] : []),
        ...(updates.precio_unitario !== undefined ? [updates.precio_unitario] : []),
        ...(updates.descripcion !== undefined ? [updates.descripcion] : []),
        now,
        id
      ];

      await this.db.runAsync(
        `UPDATE trabajos_catalogo SET ${updateFields.join(', ')} WHERE id = ?`,
        values
      );

      return await this.getTrabajoById(id) as TrabajoCatalogo;
    } catch (error) {
      console.error('Error updating trabajo:', error);
      throw error;
    }
  }

  /**
   * Delete trabajo from catalog
   */
  async deleteTrabajo(id: number): Promise<boolean> {
    try {
      const result = await this.db.runAsync(
        'DELETE FROM trabajos_catalogo WHERE id = ?',
        [id]
      );
      return result.changes > 0;
    } catch (error) {
      console.error('Error deleting trabajo:', error);
      throw error;
    }
  }

  /**
   * Batch insert or update trabajos (for sync)
   */
  async batchUpsertTrabajos(trabajos: TrabajoCatalogo[]): Promise<void> {
    try {
      const now = Date.now();
      for (const trabajo of trabajos) {
        await this.db.runAsync(
          `INSERT OR REPLACE INTO trabajos_catalogo 
           (id, nombre, unidad_medida, precio_unitario, descripcion, createdAt, updatedAt)
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [
            trabajo.id,
            trabajo.nombre,
            trabajo.unidad_medida,
            trabajo.precio_unitario,
            trabajo.descripcion || null,
            trabajo.createdAt || now,
            trabajo.updatedAt || now
          ]
        );
      }
    } catch (error) {
      console.error('Error batch upserting trabajos:', error);
      throw error;
    }
  }

  /**
   * Delete all trabajos (for sync reset)
   */
  async deleteAllTrabajos(): Promise<void> {
    try {
      await this.db.runAsync('DELETE FROM trabajos_catalogo');
    } catch (error) {
      console.error('Error deleting all trabajos:', error);
      throw error;
    }
  }

  /**
   * Get count of trabajos
   */
  async getTrabajoCount(): Promise<number> {
    try {
      const result = await this.db.getFirstAsync<{ count: number }>(
        'SELECT COUNT(*) as count FROM trabajos_catalogo'
      );
      return result?.count || 0;
    } catch (error) {
      console.error('Error counting trabajos:', error);
      throw error;
    }
  }
}
