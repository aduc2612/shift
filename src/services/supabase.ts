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
    try {
      const meta = await SecureStore.getItemAsync(key);
      if (!meta) return meta;

      if (meta.startsWith(CHUNK_PREFIX)) {
        const count = parseInt(meta.slice(CHUNK_PREFIX.length), 10);
        if (isNaN(count)) return null;
        const chunks: string[] = [];
        for (let i = 0; i < count; i++) {
          const chunk = await SecureStore.getItemAsync(`${key}_${i}`);
          if (chunk === null) return null;
          chunks.push(chunk);
        }
        return chunks.join('');
      }

      return meta;
    } catch (e) {
      console.error('[SecureStore] getItem failed:', key, e);
      return null;
    }
  },

  setItem: async (key: string, value: string) => {
    try {
      const existing = await SecureStore.getItemAsync(key);
      if (existing?.startsWith(CHUNK_PREFIX)) {
        const oldCount = parseInt(existing.slice(CHUNK_PREFIX.length), 10);
        if (!isNaN(oldCount)) {
          for (let i = 0; i < oldCount; i++) {
            await SecureStore.deleteItemAsync(`${key}_${i}`);
          }
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
    } catch (e) {
      console.error('[SecureStore] setItem failed:', key, e);
    }
  },

  removeItem: async (key: string) => {
    try {
      const meta = await SecureStore.getItemAsync(key);
      if (meta?.startsWith(CHUNK_PREFIX)) {
        const count = parseInt(meta.slice(CHUNK_PREFIX.length), 10);
        if (!isNaN(count)) {
          for (let i = 0; i < count; i++) {
            await SecureStore.deleteItemAsync(`${key}_${i}`);
          }
        }
      }
      await SecureStore.deleteItemAsync(key);
    } catch (e) {
      console.error('[SecureStore] removeItem failed:', key, e);
    }
  },
};

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    `Missing Supabase env vars: ${[
      !supabaseUrl && 'EXPO_PUBLIC_SUPABASE_URL',
      !supabaseAnonKey && 'EXPO_PUBLIC_SUPABASE_ANON_KEY',
    ]
      .filter(Boolean)
      .join(', ')}`
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: secureStorageAdapter,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
