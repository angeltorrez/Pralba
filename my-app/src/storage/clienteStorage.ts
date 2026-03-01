/**
 * Cliente Storage Layer
 * Manages CRUD operations for Cliente in SQLite
 */

import { Database } from 'expo-sqlite';
import { Cliente } from '../types';

export class ClienteStorage {
  constructor(private db: Database) {}

  /**
   * Get all clientes
   */
  async getAllClientes(): Promise<Cliente[]> {
    try {
      const result = await this.db.getAllAsync<Cliente>(`
        SELECT * FROM clientes
        ORDER BY nombre ASC
      `);
      return result || [];
    } catch (error) {
      console.error('Error fetching clientes:', error);
      throw error;
    }
  }

  /**
   * Get specific cliente by ID
   */
  async getClienteById(id: number): Promise<Cliente | null> {
    try {
      const result = await this.db.getFirstAsync<Cliente>(`
        SELECT * FROM clientes WHERE id = ?
      `, [id]);
      return result || null;
    } catch (error) {
      console.error('Error fetching cliente:', error);
      throw error;
    }
  }

  /**
   * Save/Create new cliente
   */
  async saveCliente(cliente: Omit<Cliente, 'id' | 'createdAt' | 'updatedAt'>): Promise<Cliente> {
    try {
      const now = Date.now();
      const result = await this.db.runAsync(
        `INSERT INTO clientes (nombre, telefono, direccion, email, createdAt, updatedAt)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [
          cliente.nombre,
          cliente.telefono || null,
          cliente.direccion || null,
          cliente.email || null,
          now,
          now
        ]
      );

      if (result.lastInsertRowId) {
        return await this.getClienteById(Number(result.lastInsertRowId)) as Cliente;
      }

      throw new Error('Failed to create cliente');
    } catch (error) {
      console.error('Error saving cliente:', error);
      throw error;
    }
  }

  /**
   * Update existing cliente
   */
  async updateCliente(id: number, updates: Partial<Cliente>): Promise<Cliente> {
    try {
      const now = Date.now();
      const updateFields = [
        ...(updates.nombre !== undefined ? ['nombre = ?'] : []),
        ...(updates.telefono !== undefined ? ['telefono = ?'] : []),
        ...(updates.direccion !== undefined ? ['direccion = ?'] : []),
        ...(updates.email !== undefined ? ['email = ?'] : []),
        'updatedAt = ?'
      ];

      const values = [
        ...(updates.nombre !== undefined ? [updates.nombre] : []),
        ...(updates.telefono !== undefined ? [updates.telefono] : []),
        ...(updates.direccion !== undefined ? [updates.direccion] : []),
        ...(updates.email !== undefined ? [updates.email] : []),
        now,
        id
      ];

      await this.db.runAsync(
        `UPDATE clientes SET ${updateFields.join(', ')} WHERE id = ?`,
        values
      );

      return await this.getClienteById(id) as Cliente;
    } catch (error) {
      console.error('Error updating cliente:', error);
      throw error;
    }
  }

  /**
   * Delete cliente
   */
  async deleteCliente(id: number): Promise<boolean> {
    try {
      const result = await this.db.runAsync(
        'DELETE FROM clientes WHERE id = ?',
        [id]
      );
      return result.changes > 0;
    } catch (error) {
      console.error('Error deleting cliente:', error);
      throw error;
    }
  }

  /**
   * Delete all clientes (for sync reset)
   */
  async deleteAllClientes(): Promise<void> {
    try {
      await this.db.runAsync('DELETE FROM clientes');
    } catch (error) {
      console.error('Error deleting all clientes:', error);
      throw error;
    }
  }

  /**
   * Batch insert clientes
   */
  async batchInsertClientes(clientes: Cliente[]): Promise<void> {
    try {
      const now = Date.now();
      for (const cliente of clientes) {
        await this.db.runAsync(
          `INSERT OR REPLACE INTO clientes 
           (id, nombre, telefono, direccion, email, createdAt, updatedAt)
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [
            cliente.id,
            cliente.nombre,
            cliente.telefono || null,
            cliente.direccion || null,
            cliente.email || null,
            cliente.createdAt || now,
            cliente.updatedAt || now
          ]
        );
      }
    } catch (error) {
      console.error('Error batch inserting clientes:', error);
      throw error;
    }
  }

  /**
   * Get count of clientes
   */
  async getClienteCount(): Promise<number> {
    try {
      const result = await this.db.getFirstAsync<{ count: number }>(
        'SELECT COUNT(*) as count FROM clientes'
      );
      return result?.count || 0;
    } catch (error) {
      console.error('Error counting clientes:', error);
      throw error;
    }
  }
}
