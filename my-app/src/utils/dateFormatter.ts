/**
 * Utility functions for date formatting
 */

const toDate = (value: string | number): Date => {
  return typeof value === 'number' ? new Date(value) : new Date(value);
};

export const formatDateShort = (date: string | number): string => {
  return toDate(date).toLocaleDateString('es-ES', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

export const formatDateLong = (date: string | number): string => {
  return toDate(date).toLocaleDateString('es-ES', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};

export const formatDateForPDF = (date: string | number): string => {
  return toDate(date).toLocaleDateString('es-ES');
};
