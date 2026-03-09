/**
 * Budget Storage (English naming wrapper)
 * Re-exports PresupuestoStorage with English type aliases
 * Maintains consistent API while using Spanish database schema
 */

import { getPresupuestoStorage } from './storageFactory';
import { Budget, JobWork } from '../types';

// Get the Spanish-named storage and use English aliases
const presupuestoStorage = getPresupuestoStorage();

/**
 * Budget Storage API - English language wrapper for Presupuesto operations
 */
export const budgetStorage = {
  /**
   * Get all budgets (presupuestos)
   */
  getAllBudgets: () => presupuestoStorage.getAllPresupuestos(),

  /**
   * Get budget by ID
   */
  async getBudgetById(budgetId: number): Promise<Budget | null> {
    const presupuesto = await presupuestoStorage.getPresupuestoDetalle(budgetId);
    return presupuesto as Budget | null;
  },

  /**
   * Save/Update budget
   */
  async saveBudget(budget: Budget): Promise<void> {
    if (budget.id) {
      // Update existing - only cliente_id and trabajos can be updated
      await presupuestoStorage.updatePresupuesto(budget.id, {
        cliente_id: budget.cliente_id,
        trabajos: budget.trabajos as any,
      });
    } else {
      // Create new - would need to implement createPresupuesto
      console.warn('Creating new budget not yet implemented in wrapper');
    }
  },

  /**
   * Delete budget
   */
  deleteBudget: (budgetId: number) => presupuestoStorage.deletePresupuesto(budgetId),
};

export type BudgetStorage = typeof budgetStorage;
