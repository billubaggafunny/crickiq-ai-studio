import { StorageAdapter } from './storageAdapter';

export const localStorageAdapter: StorageAdapter = {
  load: (key: string): string | null => {
    try {
      return localStorage.getItem(key);
    } catch (e) {
      console.error('[localStorageAdapter] load error:', e);
      return null;
    }
  },
  save: (key: string, data: string): void => {
    try {
      localStorage.setItem(key, data);
    } catch (e) {
      console.error('[localStorageAdapter] save error:', e);
    }
  },
  clear: (): void => {
    try {
      localStorage.clear();
    } catch (e) {
      console.error('[localStorageAdapter] clear error:', e);
    }
  }
};
