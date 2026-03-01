/**
 * usePresupuesto Hook
 * Encapsulates all presupuesto operations
 */

import { useCallback, useState, useEffect } from 'react';
import {
  Presupuesto,
  PresupuestoDetalle,
  TrabajoCatalogo,
  Cliente,
  CreatePresupuestoData,
} from '../types';
import {
  getPresupuestoStorage,
  getClienteStorage,
  getTrabajoCatalogoStorage,
} from '../storage/storageFactory';
import { calculateSubtotal, validatePresupuesto } from '../utils/presupuestoHelpers';

interface UsePresupuestoOps {
  presupuestos: Presupuesto[];
  loading: boolean;
  error: string | null;
  clientes: Cliente[];
  trabajosCatalogo: TrabajoCatalogo[];
  
  // Fetch operations
  fetchPresupuestos: () => Promise<void>;
  fetchPresupuestoDetail: (id: number) => Promise<PresupuestoDetalle | null>;
  fetchClientes: () => Promise<void>;
  fetchTrabajoCatalogo: () => Promise<void>;
  
  // Create/Update
  createPresupuesto: (
    cliente_id: number,
    trabajos: Array<{
      trabajo_catalogo_id: number;
      cantidad: number;
      precio_unitario: number;
    }>
  ) => Promise<void>;
  
  // Delete
  deletePresupuesto: (id: number) => Promise<void>;
}

export const usePresupuesto = (): UsePresupuestoOps => {
  const [presupuestos, setPresupuestos] = useState<Presupuesto[]>([]);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [trabajosCatalogo, setTrabajoCatalogo] = useState<TrabajoCatalogo[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPresupuestos = useCallback(async () => {
    try {
      setLoading(true);
      const storage = getPresupuestoStorage();
      const data = await storage.getAllPresupuestos();
      setPresupuestos(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchPresupuestoDetail = useCallback(
    async (id: number): Promise<PresupuestoDetalle | null> => {
      try {
        const storage = getPresupuestoStorage();
        return await storage.getPresupuestoDetalle(id);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
        return null;
      }
    },
    []
  );

  const fetchClientes = useCallback(async () => {
    try {
      const storage = getClienteStorage();
      const data = await storage.getAllClientes();
      setClientes(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    }
  }, []);

  const fetchTrabajoCatalogo = useCallback(async () => {
    try {
      const storage = getTrabajoCatalogoStorage();
      const data = await storage.getAllTrabajos();
      setTrabajoCatalogo(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    }
  }, []);

  const createPresupuesto = useCallback(
    async (
      cliente_id: number,
      trabajos: Array<{
        trabajo_catalogo_id: number;
        cantidad: number;
        precio_unitario: number;
      }>
    ): Promise<void> => {
      try {
        // Validate
        const validationError = validatePresupuesto(cliente_id, trabajos);
        if (validationError) {
          throw new Error(validationError);
        }

        const storage = getPresupuestoStorage();
        const data: CreatePresupuestoData = {
          cliente_id,
          fecha: Date.now(),
          trabajos,
        };

        await storage.createPresupuesto(data);
        await fetchPresupuestos(); // Refresh list
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
        throw err;
      }
    },
    [fetchPresupuestos]
  );

  const deletePresupuesto = useCallback(
    async (id: number): Promise<void> => {
      try {
        const storage = getPresupuestoStorage();
        await storage.deletePresupuesto(id);
        await fetchPresupuestos(); // Refresh list
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
        throw err;
      }
    },
    [fetchPresupuestos]
  );

  return {
    presupuestos,
    clientes,
    trabajosCatalogo,
    loading,
    error,
    fetchPresupuestos,
    fetchPresupuestoDetail,
    fetchClientes,
    fetchTrabajoCatalogo,
    createPresupuesto,
    deletePresupuesto,
  };
};
