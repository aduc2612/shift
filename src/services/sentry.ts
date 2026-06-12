import { isRunningInExpoGo } from 'expo';
import * as Sentry from '@sentry/react-native';

export function initSentry() {
  Sentry.init({
    dsn: process.env.EXPO_PUBLIC_SENTRY_DSN,
    sendDefaultPii: __DEV__,
    enableLogs: __DEV__,

    // Tracing — 100% in dev, 20% in production
    tracesSampleRate: __DEV__ ? 1.0 : 0.2,

    // Profiling — lower in production
    profilesSampleRate: __DEV__ ? 1.0 : 0.1,

    // Session Replay — always on error, 10% sessions in prod
    replaysOnErrorSampleRate: 1.0,
    replaysSessionSampleRate: __DEV__ ? 1.0 : 0.1,

    // Mobile Replay integration
    integrations: [
      Sentry.mobileReplayIntegration({
        maskAllText: true,
        maskAllImages: true,
      }),
    ],

    // Disable native frames tracking in Expo Go (not supported)
    enableNativeFramesTracking: !isRunningInExpoGo(),

    environment: __DEV__ ? 'development' : 'production',
    debug: __DEV__,
  });
}
