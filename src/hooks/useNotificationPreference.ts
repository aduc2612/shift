import { useCallback, useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Notifications from "expo-notifications";
import { useToast } from "@/providers/toast-provider";

const STORAGE_KEY = "notification-enabled";

type UseNotificationPreference = {
  enabled: boolean;
  setEnabled: (next: boolean) => Promise<void>;
};

export function useNotificationPreference(): UseNotificationPreference {
  const toast = useToast();
  const [enabled, setEnabledState] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function init() {
      let osGranted = false;
      try {
        const { status } = await Notifications.getPermissionsAsync();
        osGranted = status === "granted";
      } catch (err) {
        console.error("useNotificationPreference: getPermissionsAsync failed", err);
      }

      let stored: boolean | null = null;
      try {
        const value = await AsyncStorage.getItem(STORAGE_KEY);
        if (value === "true") stored = true;
        else if (value === "false") stored = false;
      } catch (err) {
        console.error("useNotificationPreference: storage read failed", err);
      }

      if (cancelled) return;

      // OS permission always wins: if not granted, ignore stored preference
      const next = osGranted ? (stored ?? true) : false;
      setEnabledState(next);
      setHydrated(true);
    }

    init();
    return () => {
      cancelled = true;
    };
  }, []);

  const setEnabled = useCallback(
    async (next: boolean) => {
      if (next) {
        // Always request — OS decides whether to show dialog
        let status: string;
        try {
          const requested = await Notifications.requestPermissionsAsync();
          status = requested.status;
        } catch (err) {
          console.error("useNotificationPreference: permission request failed", err);
          status = "denied";
        }

        if (status !== "granted") {
          toast.show({
            message: "Notifications will not be turned on until permission is granted in Settings.",
            duration: 4000,
          });
          await AsyncStorage.setItem(STORAGE_KEY, "false").catch(() => {});
          return;
        }

        setEnabledState(true);
        await AsyncStorage.setItem(STORAGE_KEY, "true").catch(() => {});
      } else {
        setEnabledState(false);
        await AsyncStorage.setItem(STORAGE_KEY, "false").catch(() => {});
      }
    },
    [toast],
  );

  return { enabled: hydrated ? enabled : false, setEnabled };
}
