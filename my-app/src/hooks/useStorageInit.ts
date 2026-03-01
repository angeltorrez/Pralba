/**
 * Hook for initializing storage and sync on app startup
 */

import { useEffect, useState } from 'react';
import { initializeDatabase } from '../storage/database';
import { hybridJobsStorage } from '../storage/hybridJobsStorage';

interface UseStorageInitResult {
  isInitialized: boolean;
  error: Error | null;
}

export const useStorageInit = (): UseStorageInitResult => {
  const [isInitialized, setIsInitialized] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const initializeStorage = async () => {
      try {
        // Initialize SQLite database with relational schema
        await initializeDatabase();
        console.log('✅ SQLite database initialized');

        // Try to sync catalog data from backend on startup
        console.log('Attempting to sync catalog data from backend...');
        const syncResult = await hybridJobsStorage.syncFromBackend();
        
        if (syncResult.success) {
          console.log(
            `✅ Synced: ${syncResult.clientes} clientes, ${syncResult.trabajos} trabajos, ${syncResult.materiales} materiales`
          );
        } else {
          console.log('⚠️ Could not sync from backend (working offline):', syncResult.message);
        }

        setIsInitialized(true);
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err));
        console.error('❌ Storage initialization failed:', error);
        setError(error);
        setIsInitialized(true); // Still mark as initialized even on error
      }
    };

    initializeStorage();
  }, []);

  return { isInitialized, error };
};
