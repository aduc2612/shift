import { createClient, type SupportedStorage } from '@supabase/supabase-js';
import * as SecureStore from 'expo-secure-store';

const CHUNK_PREFIX = '__sc_chunk_';
const MAX_CHUNK_SIZE = 2048;

/**
 * SecureStore adapter that handles the 2KB per-key limit
 * by chunking large values across multiple keys.
 */
const secureStorageAdapter: SupportedStorage = {
  getItem: async (key: string) => {
    const meta = await SecureStore.getItemAsync(key);
    if (!meta) return meta;

    if (meta.startsWith(CHUNK_PREFIX)) {
      const count = parseInt(meta.slice(CHUNK_PREFIX.length), 10);
      const chunks: string[] = [];
      for (let i = 0; i < count; i++) {
        const chunk = await SecureStore.getItemAsync(`${key}_${i}`);
        if (chunk === null) return null;
        chunks.push(chunk);
      }
      return chunks.join('');
    }

    return meta;
  },

  setItem: async (key: string, value: string) => {
    const existing = await SecureStore.getItemAsync(key);
    if (existing?.startsWith(CHUNK_PREFIX)) {
      const oldCount = parseInt(existing.slice(CHUNK_PREFIX.length), 10);
      for (let i = 0; i < oldCount; i++) {
        await SecureStore.deleteItemAsync(`${key}_${i}`);
      }
    }

    if (value.length <= MAX_CHUNK_SIZE) {
      await SecureStore.setItemAsync(key, value);
      return;
    }

    const chunks: string[] = [];
    for (let i = 0; i < value.length; i += MAX_CHUNK_SIZE) {
      chunks.push(value.slice(i, i + MAX_CHUNK_SIZE));
    }

    for (let i = 0; i < chunks.length; i++) {
      await SecureStore.setItemAsync(`${key}_${i}`, chunks[i]);
    }

    await SecureStore.setItemAsync(key, `${CHUNK_PREFIX}${chunks.length}`);
  },

  removeItem: async (key: string) => {
    const meta = await SecureStore.getItemAsync(key);
    if (meta?.startsWith(CHUNK_PREFIX)) {
      const count = parseInt(meta.slice(CHUNK_PREFIX.length), 10);
      for (let i = 0; i < count; i++) {
        await SecureStore.deleteItemAsync(`${key}_${i}`);
      }
    }
    await SecureStore.deleteItemAsync(key);
  },
};

export const supabase = createClient(
  process.env.EXPO_PUBLIC_SUPABASE_URL!,
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!,
  {
  auth: {
    storage: secureStorageAdapter,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
