# Phase 3 — Sentry Setup: Summary

## Status: COMPLETE

## Changes Made

### Installed
- `@sentry/react-native` (SDK 56.0.0 compatible)
- `@sentry/cli` and `@sentry/cli-win32-x64` (transitive deps for source map uploads)

### Created
- `metro.config.js` — uses `getSentryExpoConfig` for source map generation

### Modified
- `app.json` — added `@sentry/react-native/expo` plugin (first in plugins array)
- `src/app/_layout.tsx` — added `Sentry.init()` with error monitoring, tracing, session replay, profiling, logging; wrapped `RootLayout` with `Sentry.wrap()`
- `src/services/supabase.ts` — migrated from `@env` imports to `process.env.EXPO_PUBLIC_*`
- `babel.config.js` — removed `react-native-dotenv` plugin
- `.env` — renamed vars to `EXPO_PUBLIC_*` prefix, added `EXPO_PUBLIC_SENTRY_DSN` and `SENTRY_AUTH_TOKEN`

### Removed
- `react-native-dotenv` package (no longer needed)

## Verification
- [x] Type check passes (`npx tsc --noEmit`)
- [x] No `@env` imports remaining in codebase
- [x] All env vars use `process.env.EXPO_PUBLIC_*` convention

## Manual Steps (User)
1. Go to [sentry.io](https://sentry.io/) → create project → select React Native
2. Copy DSN → add to `.env` as `EXPO_PUBLIC_SENTRY_DSN`
3. Go to Settings → Auth Tokens → create token with `org:read`, `project:releases`, `event:write` scopes
4. Add token to `.env` as `SENTRY_AUTH_TOKEN`
5. For EAS builds: `eas secret:create --scope project --name SENTRY_AUTH_TOKEN --value <token>`

## Notes
- `SENTRY_AUTH_TOKEN` in `.env` is build-time only, not bundled in client
- `sendDefaultPii: true` sends IP/user IDs to Sentry — ensure privacy policy alignment
- Production sampling: traces 20%, profiling 10%, replay 10% — tune after launch
