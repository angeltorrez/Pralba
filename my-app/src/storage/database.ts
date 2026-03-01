/**
 * Database Initialization
 * SQLite setup and schema creation
 */

import { openDatabaseAsync, SQLiteDatabase } from 'expo-sqlite';
import { initializeStorages } from './storageFactory';

const DB_NAME = 'presuobra.db';

let dbInstance: SQLiteDatabase | null = null;

/**
 * Initialize database schema
 * Called by SQLiteProvider's onInit callback
 */
export const initializeSchema = async (db: SQLiteDatabase): Promise<void> => {
  try {
    // Enable foreign keys
    await db.execAsync('PRAGMA foreign_keys = ON;');

    // Create tables
    await db.execAsync(`
      -- ============================================
      -- CLIENTES (Customers)
      -- ============================================
      CREATE TABLE IF NOT EXISTS clientes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nombre TEXT NOT NULL UNIQUE,
        telefono TEXT,
        direccion TEXT,
        email TEXT,
        createdAt INTEGER NOT NULL,
        updatedAt INTEGER NOT NULL
      );
      CREATE INDEX IF NOT EXISTS idx_clientes_nombre ON clientes(nombre);

      -- ============================================
      -- TRABAJOS_CATALOGO (Job Price List)
      -- ============================================
      CREATE TABLE IF NOT EXISTS trabajos_catalogo (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nombre TEXT NOT NULL UNIQUE,
        unidad_medida TEXT NOT NULL CHECK(unidad_medida IN ('m2', 'm', 'ml', 'unidad', 'hora', 'día')),
        precio_unitario REAL NOT NULL CHECK(precio_unitario >= 0),
        descripcion TEXT,
        createdAt INTEGER NOT NULL,
        updatedAt INTEGER NOT NULL
      );
      CREATE INDEX IF NOT EXISTS idx_trabajos_catalogo_nombre ON trabajos_catalogo(nombre);

      -- ============================================
      -- MATERIALES (Material Catalog)
      -- ============================================
      CREATE TABLE IF NOT EXISTS materiales (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nombre TEXT NOT NULL UNIQUE,
        unidad_medida TEXT NOT NULL CHECK(unidad_medida IN ('kg', 'l', 'u', 'bolsas', 'm', 'm2', 'm3')),
        createdAt INTEGER NOT NULL,
        updatedAt INTEGER NOT NULL
      );
      CREATE INDEX IF NOT EXISTS idx_materiales_nombre ON materiales(nombre);

      -- ============================================
      -- TRABAJO_MATERIALES (Job-Material Relationships)
      -- ============================================
      CREATE TABLE IF NOT EXISTS trabajo_materiales (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        trabajo_catalogo_id INTEGER NOT NULL,
        material_id INTEGER NOT NULL,
        cantidad_por_unidad REAL NOT NULL CHECK(cantidad_por_unidad >= 0),
        createdAt INTEGER NOT NULL,
        updatedAt INTEGER NOT NULL,
        FOREIGN KEY (trabajo_catalogo_id) REFERENCES trabajos_catalogo(id) ON DELETE CASCADE,
        FOREIGN KEY (material_id) REFERENCES materiales(id) ON DELETE CASCADE,
        UNIQUE(trabajo_catalogo_id, material_id)
      );
      CREATE INDEX IF NOT EXISTS idx_trabajo_materiales_trabajo ON trabajo_materiales(trabajo_catalogo_id);
      CREATE INDEX IF NOT EXISTS idx_trabajo_materiales_material ON trabajo_materiales(material_id);

      -- ============================================
      -- PRESUPUESTOS (Budgets/Quotes)
      -- ============================================
      CREATE TABLE IF NOT EXISTS presupuestos (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        cliente_id INTEGER NOT NULL,
        fecha INTEGER NOT NULL,
        total_mano_obra REAL NOT NULL DEFAULT 0 CHECK(total_mano_obra >= 0),
        total_final REAL NOT NULL DEFAULT 0 CHECK(total_final >= 0),
        createdAt INTEGER NOT NULL,
        updatedAt INTEGER NOT NULL,
        synced INTEGER DEFAULT 0,
        FOREIGN KEY (cliente_id) REFERENCES clientes(id) ON DELETE CASCADE
      );
      CREATE INDEX IF NOT EXISTS idx_presupuestos_cliente ON presupuestos(cliente_id);
      CREATE INDEX IF NOT EXISTS idx_presupuestos_fecha ON presupuestos(fecha);
      CREATE INDEX IF NOT EXISTS idx_presupuestos_synced ON presupuestos(synced);

      -- ============================================
      -- TRABAJOS_PRESUPUESTO (Line Items)
      -- ============================================
      CREATE TABLE IF NOT EXISTS trabajos_presupuesto (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        presupuesto_id INTEGER NOT NULL,
        trabajo_catalogo_id INTEGER NOT NULL,
        cantidad REAL NOT NULL CHECK(cantidad >= 0),
        precio_unitario REAL NOT NULL CHECK(precio_unitario >= 0),
        subtotal REAL NOT NULL CHECK(subtotal >= 0),
        createdAt INTEGER NOT NULL,
        updatedAt INTEGER NOT NULL,
        FOREIGN KEY (presupuesto_id) REFERENCES presupuestos(id) ON DELETE CASCADE,
        FOREIGN KEY (trabajo_catalogo_id) REFERENCES trabajos_catalogo(id) ON DELETE CASCADE
      );
      CREATE INDEX IF NOT EXISTS idx_trabajos_presupuesto_presupuesto ON trabajos_presupuesto(presupuesto_id);
      CREATE INDEX IF NOT EXISTS idx_trabajos_presupuesto_trabajo ON trabajos_presupuesto(trabajo_catalogo_id);

      -- ============================================
      -- SYNC_METADATA (Sync Tracking)
      -- ============================================
      CREATE TABLE IF NOT EXISTS syncMetadata (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL,
        timestamp INTEGER NOT NULL
      );
    `);

    console.log('✅ Database schema initialized successfully');
  } catch (error) {
    console.error('❌ Error initializing schema:', error);
    throw error;
  }
};

/**
 * Initialize database and create schema
 * This is called by useStorageInit hook during app startup
 */
export const initializeDatabase = async (): Promise<SQLiteDatabase> => {
  if (dbInstance) return dbInstance;

  try {
    dbInstance = await openDatabaseAsync(DB_NAME);

    // Initialize schema
    await initializeSchema(dbInstance);

    // Initialize storage layers
    initializeStorages(dbInstance);

    return dbInstance;
  } catch (error) {
    console.error('❌ Error initializing database:', error);
    throw error;
  }
};

/**
 * Get database instance (must call initializeDatabase first)
 */
export const getDatabase = (): SQLiteDatabase => {
  if (!dbInstance) {
    throw new Error('Database not initialized. Call initializeDatabase first.');
  }
  return dbInstance;
};

/**
 * Close database connection
 */
export const closeDatabase = async () => {
  if (dbInstance) {
    await dbInstance.closeAsync();
    dbInstance = null;
    console.log('✅ Database closed');
  }
};

/**
 * Reset database (delete all data)
 * Use only for testing/development
 */
export const resetDatabase = async () => {
  if (!dbInstance) {
    throw new Error('Database not initialized');
  }

  try {
    await dbInstance.execAsync(`
      DELETE FROM trabajos_presupuesto;
      DELETE FROM presupuestos;
      DELETE FROM trabajo_materiales;
      DELETE FROM trabajos_catalogo;
      DELETE FROM materiales;
      DELETE FROM clientes;
      DELETE FROM syncMetadata;
    `);
    console.log('✅ Database reset');
  } catch (error) {
    console.error('❌ Error resetting database:', error);
    throw error;
  }
};
