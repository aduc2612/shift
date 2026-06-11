---
name: supabase-google-auth
description: "Set up Supabase Google Sign-In with Expo React Native using web-based OAuth, expo-secure-store for session persistence, and route guards."
metadata:
  author: shift
  version: "1.0.0"
---

# Supabase Google Sign-In for Expo React Native

Complete setup for Google authentication via Supabase web-based OAuth.

## Prerequisites

Before running this skill, confirm:
- Expo project initialized with TypeScript
- Supabase project created
- Google provider enabled in Supabase dashboard (Authentication → Providers → Google) with Client ID and Client Secret
- Deep link scheme configured in `app.json`

## Dependencies

Install required packages:

```bash
npx expo install expo-secure-store expo-auth-session expo-web-browser
```

## Files to Create/Modify

### 1. `.env` — Environment variables

```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
```

### 2. `eslint.config.js` — ESLint configuration

Add `@env` to import resolver ignore list:

```js
const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');

module.exports = defineConfig([
  expoConfig,
  {
    ignores: ['dist/*'],
  },
  {
    rules: {
      'import/no-unresolved': ['error', { ignore: ['@env'] }],
    },
  },
]);
```

### 3. `src/services/supabase.ts` — Supabase client with chunked SecureStore

```ts
import { createClient, type SupportedStorage } from '@supabase/supabase-js';
import { SUPABASE_URL, SUPABASE_ANON_KEY } from '@env';
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

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: secureStorageAdapter,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
```

### 4. `src/utils/auth.ts` — URL token extraction utility

```ts
/**
 * Extract access_token and refresh_token from an OAuth callback URL hash.
 */
export function extractAuthTokensFromUrl(url: string): {
  accessToken: string | null;
  refreshToken: string | null;
} {
  const hashIndex = url.indexOf('#');
  const hash = hashIndex !== -1 ? url.substring(hashIndex + 1) : '';
  const params = new Map<string, string>();

  for (const pair of hash.split('&')) {
    const [key, ...rest] = pair.split('=');
    if (key) {
      params.set(decodeURIComponent(key), decodeURIComponent(rest.join('=')));
    }
  }

  return {
    accessToken: params.get('access_token') ?? null,
    refreshToken: params.get('refresh_token') ?? null,
  };
}
```

### 5. `src/features/auth/hooks/useAuth.ts` — Auth state hook

```ts
import { useEffect, useState } from 'react';
import { supabase } from '@/services/supabase';
import type { Session } from '@supabase/supabase-js';

export function useAuth() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session: s } }) => {
      setSession(s);
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s);
    });

    return () => subscription.unsubscribe();
  }, []);

  return {
    session,
    user: session?.user ?? null,
    isAuthenticated: !!session,
    loading,
  };
}
```

### 6. `src/features/auth/hooks/useGoogleSignIn.ts` — Google OAuth hook

```ts
import { useState } from 'react';
import * as AuthSession from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';
import { supabase } from '@/services/supabase';
import { extractAuthTokensFromUrl } from '@/utils/auth';

const redirectUri = AuthSession.makeRedirectUri({
  scheme: 'YOUR_SCHEME', // Replace with your app scheme from app.json
  path: '(tabs)',
});

export function useGoogleSignIn() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function signIn() {
    setLoading(true);
    setError(null);

    try {
      const { data, error: oauthError } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: redirectUri,
          queryParams: { prompt: 'consent' },
          skipBrowserRedirect: true,
        },
      });

      if (oauthError) throw oauthError;
      if (!data.url) throw new Error('No OAuth URL returned');

      const result = await WebBrowser.openAuthSessionAsync(
        data.url,
        redirectUri,
        { showInRecents: true },
      );

      if (result.type === 'success') {
        const { accessToken, refreshToken } = extractAuthTokensFromUrl(result.url);

        if (accessToken && refreshToken) {
          const { error: sessionError } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });
          if (sessionError) throw sessionError;
        } else {
          throw new Error('Missing tokens in callback URL');
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sign in failed. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return { signIn, loading, error };
}
```

### 7. `src/features/auth/api.ts` — Sign out function

```ts
import { supabase } from '@/services/supabase';

export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}
```

### 8. `src/app/(auth)/index.tsx` — Login screen

```tsx
import { useEffect } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as WebBrowser from 'expo-web-browser';
import { useGoogleSignIn } from '@/features/auth/hooks/useGoogleSignIn';
import { useTheme } from '@/providers/theme-provider';
import type { Theme } from '@/constants/theme';

WebBrowser.maybeCompleteAuthSession();

function createStyles(theme: Theme, insets: { top: number; bottom: number }) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
      paddingTop: insets.top,
      paddingBottom: insets.bottom + theme.spacing.xl,
      paddingHorizontal: theme.spacing.xl,
      justifyContent: 'center',
      alignItems: 'center',
    },
    branding: {
      alignItems: 'center',
      marginBottom: theme.spacing.xxxxl,
    },
    title: {
      ...theme.typography.displaySmall,
      color: theme.colors.onBackground,
      marginBottom: theme.spacing.sm,
    },
    subtitle: {
      ...theme.typography.bodyLarge,
      color: theme.colors.onSurfaceVariant,
      textAlign: 'center',
    },
    buttonContainer: {
      width: '100%',
      alignItems: 'center',
    },
    button: {
      ...theme.componentStyles.button,
      width: '100%',
      minHeight: 48,
      backgroundColor: theme.colors.primary,
    },
    buttonPressed: {
      opacity: theme.interaction.pressedOpacity,
    },
    buttonDisabled: {
      opacity: 0.6,
    },
    buttonText: {
      ...theme.typography.labelLarge,
      color: theme.colors.onPrimary,
    },
    errorText: {
      ...theme.typography.bodySmall,
      color: theme.colors.error,
      textAlign: 'center',
      marginTop: theme.spacing.md,
    },
  });
}

export default function AuthScreen() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const styles = createStyles(theme, insets);
  const { signIn, loading, error } = useGoogleSignIn();

  useEffect(() => {
    WebBrowser.warmUpAsync();
    return () => {
      WebBrowser.coolDownAsync();
    };
  }, []);

  return (
    <View style={styles.container}>
      <View style={styles.branding}>
        <Text style={styles.title}>Your App Name</Text>
        <Text style={styles.subtitle}>Your app tagline here</Text>
      </View>

      <View style={styles.buttonContainer}>
        <Pressable
          style={({ pressed }) => [
            styles.button,
            pressed && styles.buttonPressed,
            loading && styles.buttonDisabled,
          ]}
          onPress={signIn}
          disabled={loading}
          accessibilityRole="button"
          accessibilityLabel="Continue with Google"
        >
          {loading ? (
            <ActivityIndicator color={theme.colors.onPrimary} />
          ) : (
            <Text style={styles.buttonText}>Continue with Google</Text>
          )}
        </Pressable>

        {error && <Text style={styles.errorText}>{error}</Text>}
      </View>
    </View>
  );
}
```

### 9. `src/app/_layout.tsx` — Root layout with route guards

```tsx
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ThemeProvider, useTheme } from '@/providers/theme-provider';
import { useAuth } from '@/features/auth/hooks/useAuth';

function RootNavigator() {
  const theme = useTheme();
  const { isAuthenticated } = useAuth();

  return (
    <>
      <StatusBar style={theme.isDark ? 'light' : 'dark'} />
      <Stack
        screenOptions={{
          animation: 'fade',
          animationDuration: 200,
          headerShown: false,
          contentStyle: { backgroundColor: theme.colors.background },
        }}
      >
        <Stack.Protected guard={isAuthenticated}>
          <Stack.Screen name="(tabs)" />
        </Stack.Protected>
        <Stack.Protected guard={!isAuthenticated}>
          <Stack.Screen name="(auth)" />
        </Stack.Protected>
      </Stack>
    </>
  );
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <RootNavigator />
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
```

### 10. Sign Out Button (reusable component or inline in Settings)

```tsx
import { useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text } from 'react-native';
import { signOut } from '@/features/auth/api';
import { useTheme } from '@/providers/theme-provider';
import type { Theme } from '@/constants/theme';

function createStyles(theme: Theme) {
  return StyleSheet.create({
    button: {
      backgroundColor: theme.colors.error,
      borderRadius: theme.borderRadius.xl,
      paddingVertical: theme.spacing.md,
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: 48,
    },
    buttonDisabled: {
      opacity: theme.interaction.pressedOpacity,
    },
    buttonText: {
      ...theme.typography.labelLarge,
      color: theme.colors.onError,
    },
    errorText: {
      ...theme.typography.bodySmall,
      color: theme.colors.error,
      textAlign: 'center',
      marginTop: theme.spacing.sm,
    },
  });
}

export function SignOutButton() {
  const theme = useTheme();
  const styles = createStyles(theme);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSignOut() {
    setLoading(true);
    setError(null);
    try {
      await signOut();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to sign out');
      setLoading(false);
    }
  }

  return (
    <>
      <Pressable
        onPress={handleSignOut}
        disabled={loading}
        style={({ pressed }) => [
          styles.button,
          loading && styles.buttonDisabled,
          pressed && !loading && { opacity: theme.interaction.pressedOpacity },
        ]}
        hitSlop={8}
      >
        {loading ? (
          <ActivityIndicator color={theme.colors.onError} />
        ) : (
          <Text style={styles.buttonText}>Sign Out</Text>
        )}
      </Pressable>
      {error && <Text style={styles.errorText}>{error}</Text>}
    </>
  );
}
```

## Folder Structure

After setup, your auth-related files should be:

```
src/
  features/
    auth/
      api.ts                      # signOut()
      hooks/
        useAuth.ts                # Auth state (session, isAuthenticated, loading)
        useGoogleSignIn.ts        # OAuth flow (signIn, loading, error)
  utils/
    auth.ts                       # extractAuthTokensFromUrl()
  services/
    supabase.ts                   # Supabase client with SecureStore adapter
  app/
    _layout.tsx                   # Root layout with Stack.Protected
    (auth)/
      index.tsx                   # Login screen
    (tabs)/
      settings.tsx                # Includes SignOutButton
```

## Key Design Decisions

1. **Chunked SecureStore adapter** — Handles Android's 2KB per-key limit by splitting large session values across multiple keys
2. **`Stack.Protected`** — Expo Router's built-in route protection instead of `useEffect` + `router.replace()`
3. **`WebBrowser.warmUpAsync()` / `coolDownAsync()`** — Pre-warms browser for faster OAuth popup
4. **`maybeCompleteAuthSession()`** — Required for `expo-auth-session` to work properly
5. **`onAuthStateChange` as source of truth** — No Zustand needed for auth state

## Manual Setup Checklist

- [ ] Enable Google provider in Supabase dashboard with Client ID + Secret
- [ ] Add redirect URI to Google Cloud Console Authorized redirect URIs
- [ ] Configure deep link scheme in `app.json` (`"scheme": "your-scheme"`)
- [ ] Update `YOUR_SCHEME` in `useGoogleSignIn.ts` with your actual scheme
- [ ] Update app name/tagline in login screen
