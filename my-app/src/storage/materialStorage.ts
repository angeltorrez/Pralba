/**
 * Material Storage Layer
 * Manages CRUD operations for Material in SQLite
 */

import { SQLiteDatabase } from 'expo-sqlite';
import { Material } from '../types';

export class MaterialStorage {
  constructor(private db: SQLiteDatabase) {}

  /**
   * Get all materiales
   */
  async getAllMateriales(): Promise<Material[]> {
    try {
      const result = await this.db.getAllAsync<Material>(`
        SELECT * FROM materiales
        ORDER BY nombre ASC
      `);
      return result || [];
    } catch (error) {
      console.error('Error fetching materiales:', error);
      throw error;
    }
  }

  /**
   * Get specific material by ID
   */
  async getMaterialById(id: number): Promise<Material | null> {
    try {
      const result = await this.db.getFirstAsync<Material>(`
        SELECT * FROM materiales WHERE id = ?
      `, [id]);
      return result || null;
    } catch (error) {
      console.error('Error fetching material:', error);
      throw error;
    }
  }

  /**
   * Get materiales required for a specific trabajo
   */
  async getMaterialesByTrabajoId(trabajoId: number): Promise<
    Array<Material & { cantidad_por_unidad: number }>
  > {
    try {
      const result = await this.db.getAllAsync<Material & { cantidad_por_unidad: number }>(
        `SELECT m.*, tm.cantidad_por_unidad 
         FROM materiales m
         JOIN trabajo_materiales tm ON m.id = tm.material_id
         WHERE tm.trabajo_catalogo_id = ?
         ORDER BY m.nombre ASC`,
        [trabajoId]
      );
      return result || [];
    } catch (error) {
      console.error('Error fetching materiales by trabajo:', error);
      throw error;
    }
  }

  /**
   * Create new material
   */
  async saveMaterial(
    material: Omit<Material, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<Material> {
    try {
      const now = Date.now();
      const result = await this.db.runAsync(
        `INSERT INTO materiales (nombre, unidad_medida, createdAt, updatedAt)
         VALUES (?, ?, ?, ?)`,
        [
          material.nombre,
          material.unidad_medida,
          now,
          now
        ]
      );

      if (result.lastInsertRowId) {
        return await this.getMaterialById(Number(result.lastInsertRowId)) as Material;
      }

      throw new Error('Failed to create material');
    } catch (error) {
      console.error('Error saving material:', error);
      throw error;
    }
  }

  /**
   * Update material
   */
  async updateMaterial(
    id: number,
    updates: Partial<Material>
  ): Promise<Material> {
    try {
      const now = Date.now();
      const updateFields = [
        ...(updates.nombre !== undefined ? ['nombre = ?'] : []),
        ...(updates.unidad_medida !== undefined ? ['unidad_medida = ?'] : []),
        'updatedAt = ?'
      ];

      const values = [
        ...(updates.nombre !== undefined ? [updates.nombre] : []),
        ...(updates.unidad_medida !== undefined ? [updates.unidad_medida] : []),
        now,
        id
      ];

      await this.db.runAsync(
        `UPDATE materiales SET ${updateFields.join(', ')} WHERE id = ?`,
        values
      );

      return await this.getMaterialById(id) as Material;
    } catch (error) {
      console.error('Error updating material:', error);
      throw error;
    }
  }

  /**
   * Delete material
   */
  async deleteMaterial(id: number): Promise<boolean> {
    try {
      const result = await this.db.runAsync(
        'DELETE FROM materiales WHERE id = ?',
        [id]
      );
      return result.changes > 0;
    } catch (error) {
      console.error('Error deleting material:', error);
      throw error;
    }
  }

  /**
   * Batch insert or update materials (for sync)
   */
  async batchUpsertMateriales(materiales: Material[]): Promise<void> {
    try {
      const now = Date.now();
      for (const material of materiales) {
        await this.db.runAsync(
          `INSERT OR REPLACE INTO materiales 
           (id, nombre, unidad_medida, createdAt, updatedAt)
           VALUES (?, ?, ?, ?, ?)`,
          [
            material.id,
            material.nombre,
            material.unidad_medida,
            material.createdAt || now,
            material.updatedAt || now
          ]
        );
      }
    } catch (error) {
      console.error('Error batch upserting materiales:', error);
      throw error;
    }
  }

  /**
   * Delete all materiales (for sync reset)
   */
  async deleteAllMateriales(): Promise<void> {
    try {
      await this.db.runAsync('DELETE FROM materiales');
    } catch (error) {
      console.error('Error deleting all materiales:', error);
      throw error;
    }
  }

  /**
   * Get material count
   */
  async getMaterialCount(): Promise<number> {
    try {
      const result = await this.db.getFirstAsync<{ count: number }>(
        'SELECT COUNT(*) as count FROM materiales'
      );
      return result?.count || 0;
    } catch (error) {
      console.error('Error counting materiales:', error);
      throw error;
    }
  }
}
