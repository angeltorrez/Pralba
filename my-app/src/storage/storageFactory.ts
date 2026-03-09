/**
 * Storage Factory
 * Centralizes initialization of all storage layers
 */

import { SQLiteDatabase } from 'expo-sqlite';
import { ClienteStorage } from './clienteStorage';
import { TrabajoCatalogoStorage } from './trabajoCatalogoStorage';
import { MaterialStorage } from './materialStorage';
import { PresupuestoStorage } from './presupuestoStorage';

let clienteStorageInstance: ClienteStorage | null = null;
let trabajoCatalogoStorageInstance: TrabajoCatalogoStorage | null = null;
let materialStorageInstance: MaterialStorage | null = null;
let presupuestoStorageInstance: PresupuestoStorage | null = null;

export const initializeStorages = (db: SQLiteDatabase) => {
  clienteStorageInstance = new ClienteStorage(db);
  trabajoCatalogoStorageInstance = new TrabajoCatalogoStorage(db);
  materialStorageInstance = new MaterialStorage(db);
  presupuestoStorageInstance = new PresupuestoStorage(
    db,
    clienteStorageInstance,
    trabajoCatalogoStorageInstance
  );
};

export const getClienteStorage = (): ClienteStorage => {
  if (!clienteStorageInstance) {
    throw new Error('Storage not initialized. Call initializeStorages first.');
  }
  return clienteStorageInstance;
};

export const getTrabajoCatalogoStorage = (): TrabajoCatalogoStorage => {
  if (!trabajoCatalogoStorageInstance) {
    throw new Error('Storage not initialized. Call initializeStorages first.');
  }
  return trabajoCatalogoStorageInstance;
};

export const getMaterialStorage = (): MaterialStorage => {
  if (!materialStorageInstance) {
    throw new Error('Storage not initialized. Call initializeStorages first.');
  }
  return materialStorageInstance;
};

export const getPresupuestoStorage = (): PresupuestoStorage => {
  if (!presupuestoStorageInstance) {
    throw new Error('Storage not initialized. Call initializeStorages first.');
  }
  return presupuestoStorageInstance;
};

/**
 * Convenience function to get all storage instances at once
 */
export const getAllStorages = () => {
  return {
    cliente: getClienteStorage(),
    trabajoCatalogo: getTrabajoCatalogoStorage(),
    material: getMaterialStorage(),
    presupuesto: getPresupuestoStorage()
  };
};
