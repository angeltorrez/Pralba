/**
 * Sync Service - Handles synchronization between local SQLite and MongoDB backend
 * 
 * Architecture:
 * - Offline first: App works completely offline with local SQLite
 * - When internet available: Syncs catalog data with MongoDB backend
 * - presupuestos synced via hybridJobsStorage
 */

import { getDatabase } from './database';
import { hybridJobsStorage } from './hybridJobsStorage';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000/api';

export interface SyncConfig {
  apiUrl?: string;
  authToken?: string;
}

interface SyncResult {
  success: boolean;
  synced: {
    clientes: number;
    trabajos: number;
    materiales: number;
  };
  errors?: string[];
  timestamp: string;
}

class SyncService {
  private apiUrl: string;
  private lastSyncTime: number | null = null;

  constructor(config: SyncConfig = {}) {
    this.apiUrl = config.apiUrl || API_BASE_URL;
  }

  /**
   * Perform full sync (download catalog from backend)
   */
  async sync(): Promise<SyncResult> {
    try {
      console.log('🔄 Starting sync...');
      
      const syncResult = await hybridJobsStorage.syncFromBackend();

      if (syncResult.success) {
        this.lastSyncTime = Date.now();
        this.updateSyncMetadata();
        
        return {
          success: true,
          synced: {
            clientes: syncResult.clientes || 0,
            trabajos: syncResult.trabajos || 0,
            materiales: syncResult.materiales || 0,
          },
          timestamp: new Date().toISOString(),
        };
      } else {
        return {
          success: false,
          synced: { clientes: 0, trabajos: 0, materiales: 0 },
          errors: [syncResult.message],
          timestamp: new Date().toISOString(),
        };
      }
    } catch (error) {
      console.error('❌ Sync failed:', error);
      return {
        success: false,
        synced: { clientes: 0, trabajos: 0, materiales: 0 },
        errors: [error instanceof Error ? error.message : 'Unknown error'],
        timestamp: new Date().toISOString(),
      };
    }
  }

  /**
   * Get last sync timestamp
   */
  async getLastSyncTime(): Promise<number | null> {
    try {
      if (this.lastSyncTime) return this.lastSyncTime;

      const db = await getDatabase();
      const result = await db.getFirstAsync<{ value: string }>(
        'SELECT value FROM syncMetadata WHERE key = ?',
        ['lastSync']
      );

      if (result?.value) {
        this.lastSyncTime = parseInt(result.value);
        return this.lastSyncTime;
      }

      return null;
    } catch (error) {
      console.error('Error getting last sync time:', error);
      return null;
    }
  }

  /**
   * Check if we should sync based on time elapsed
   */
  async shouldSync(): Promise<boolean> {
    try {
      const lastSync = await this.getLastSyncTime();
      if (!lastSync) return true; // Never synced before

      const now = Date.now();
      const oneHour = 60 * 60 * 1000;

      // Sync if 1 hour has passed
      return now - lastSync > oneHour;
    } catch (error) {
      return false;
    }
  }

  /**
   * Update sync metadata in database
   */
  private async updateSyncMetadata(): Promise<void> {
    try {
      const db = await getDatabase();
      await db.runAsync(
        `INSERT OR REPLACE INTO syncMetadata (key, value, timestamp)
         VALUES (?, ?, ?)`,
        ['lastSync', String(Date.now()), String(Date.now())]
      );
    } catch (error) {
      console.warn('Failed to update sync metadata:', error);
    }
  }

  /**
   * Health check - test connection to backend
   */
  async checkBackendHealth(): Promise<boolean> {
    try {
      const response = await fetch(`${this.apiUrl}/health`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });
      return response.ok;
    } catch (error) {
      console.warn('Backend health check failed:', error);
      return false;
    }
  }
}

// Singleton instance
let syncServiceInstance: SyncService | null = null;

export const initSyncService = (config?: SyncConfig): SyncService => {
  if (!syncServiceInstance) {
    syncServiceInstance = new SyncService(config);
  }
  return syncServiceInstance;
};

export const getSyncService = (): SyncService => {
  if (!syncServiceInstance) {
    syncServiceInstance = new SyncService();
  }
  return syncServiceInstance;
};
