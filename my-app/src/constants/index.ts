/**
 * Application-wide constants
 */

export const FONT_SIZE_OPTIONS = [
  { label: 'Pequeño', value: 'small' as const },
  { label: 'Medio', value: 'medium' as const },
  { label: 'Grande', value: 'large' as const },
] as const;

export const THEME_OPTIONS = [
  { label: 'Claro', value: 'light' as const },
  { label: 'Oscuro', value: 'dark' as const },
] as const;

// AsyncStorage keys
export const ASYNC_STORAGE_KEYS = {
  BUDGETS: 'budgets',
  JOBS: 'jobs',
  SYNC_TIMESTAMP: 'sync_timestamp',
  LAST_SYNC: 'last_sync',
} as const;

// Common validation messages
export const VALIDATION_MESSAGES = {
  NAME_REQUIRED: 'Ingrese el nombre de la obra o cliente',
  WORK_REQUIRED: 'Debe agregar al menos un trabajo',
  QUANTITY_REQUIRED: 'Ingrese cantidad y precio',
  INVALID_NUMBERS: 'Ingrese valores numéricos válidos',
  INVALID_QUANTITY: 'La cantidad debe ser mayor a 0',
  INVALID_PRICE: 'El precio no debe ser negativo',
} as const;
