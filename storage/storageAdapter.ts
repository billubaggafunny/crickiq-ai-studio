export interface StorageAdapter {
  load(key: string): Promise<string | null> | string | null;
  save(key: string, data: string): Promise<void> | void;
  clear(): Promise<void> | void;
}
