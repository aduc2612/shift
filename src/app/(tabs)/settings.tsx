import { useState } from "react";
import {
  Alert,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import * as Application from "expo-application";
import * as Linking from "expo-linking";
import { useTheme, useThemePreference, type ThemePreference } from "@/providers/theme-provider";
import { useNotificationPreference } from "@/hooks/useNotificationPreference";
import { useToast } from "@/providers/toast-provider";
import { useUserProfile } from "@/features/profile/hooks/useUserProfile";
import { signOut } from "@/features/auth/api";
import SchedulingContextSheet from "@/features/profile/components/SchedulingContextSheet";
import ListSelector, { type ListSelectorOption } from "@/components/primitives/ListSelector";
import {
  buildMailtoUrl,
  feedbackTemplates,
  type FeedbackTemplate,
} from "@/constants/feedback-templates";
import type { Theme } from "@/constants/theme";

type ThemeOption = ListSelectorOption<ThemePreference>;
const THEME_OPTIONS: ThemeOption[] = [
  { value: "system", label: "System default" },
  { value: "light", label: "Light" },
  { value: "dark", label: "Dark" },
];

const THEME_LABELS: Record<ThemePreference, string> = {
  system: "System default",
  light: "Light",
  dark: "Dark",
};

const FEEDBACK_OPTIONS: ListSelectorOption<string>[] = Object.entries(
  feedbackTemplates,
).map(([key, tpl]) => ({ value: key, label: (tpl as FeedbackTemplate).label }));

function createStyles(theme: Theme) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    header: {
      paddingHorizontal: theme.spacing.lg,
      paddingTop: theme.spacing.lg,
      paddingBottom: theme.spacing.sm,
    },
    headerTitle: {
      ...theme.typography.headlineMedium,
      color: theme.colors.onBackground,
    },
    scrollContent: {
      paddingBottom: theme.spacing.xxxl,
    },
    sectionLabel: {
      ...theme.typography.labelSmall,
      color: theme.colors.onSurfaceVariant,
      letterSpacing: 0.6,
      textTransform: "uppercase",
      paddingHorizontal: theme.spacing.lg,
      paddingTop: theme.spacing.xl,
      paddingBottom: theme.spacing.sm,
    },
    card: {
      backgroundColor: theme.colors.surface,
      marginHorizontal: theme.spacing.md,
      borderRadius: theme.borderRadius.lg,
      borderWidth: 0.5,
      borderColor: theme.colors.outlineVariant,
      overflow: "hidden",
    },
    row: {
      flexDirection: "row",
      alignItems: "center",
      gap: theme.spacing.md,
      paddingVertical: theme.spacing.md,
      paddingHorizontal: theme.spacing.md,
      minHeight: 48,
      borderBottomWidth: 0.5,
      borderBottomColor: theme.colors.outlineVariant,
    },
    rowLast: {
      borderBottomWidth: 0,
    },
    rowPressed: {
      opacity: theme.interaction.pressedOpacity,
    },
    rowLabel: {
      ...theme.typography.bodyMedium,
      color: theme.colors.onSurface,
    },
    rowLabelDanger: {
      ...theme.typography.bodyMedium,
      color: theme.colors.error,
    },
    rowSubtitle: {
      ...theme.typography.bodySmall,
      color: theme.colors.onSurfaceVariant,
      marginTop: theme.spacing.xs,
    },
    rowContent: {
      flex: 1,
      minWidth: 0,
    },
    rowRight: {
      flexDirection: "row",
      alignItems: "center",
      gap: theme.spacing.sm,
    },
    avatar: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: theme.colors.primaryContainer,
      alignItems: "center",
      justifyContent: "center",
      overflow: "hidden",
    },
    avatarImage: {
      width: 36,
      height: 36,
      borderRadius: 18,
    },
    avatarText: {
      ...theme.typography.titleSmall,
      color: theme.colors.onPrimaryContainer,
    },
    badge: {
      ...theme.typography.bodySmall,
      color: theme.colors.onSurfaceVariant,
    },
  });
}

function SettingsRow({
  icon,
  label,
  subtitle,
  right,
  onPress,
  isLast = false,
  labelStyle,
}: {
  icon?: string;
  label: string;
  subtitle?: string;
  right?: React.ReactNode;
  onPress?: () => void;
  isLast?: boolean;
  labelStyle?: object;
}) {
  const theme = useTheme();
  const styles = createStyles(theme);

  const content = (
    <>
      {icon && (
        <Ionicons name={icon as any} size={20} color={theme.colors.onSurfaceVariant} />
      )}
      <View style={styles.rowContent}>
        <Text style={labelStyle || styles.rowLabel}>{label}</Text>
        {subtitle && <Text style={styles.rowSubtitle}>{subtitle}</Text>}
      </View>
      {right && <View style={styles.rowRight}>{right}</View>}
    </>
  );

  if (!onPress) {
    return (
      <View style={[styles.row, isLast && styles.rowLast]}>{content}</View>
    );
  }

  return (
    <Pressable
      onPress={onPress}
      hitSlop={8}
      style={({ pressed }) => [
        styles.row,
        isLast && styles.rowLast,
        pressed && styles.rowPressed,
      ]}
    >
      {content}
    </Pressable>
  );
}

export default function SettingsScreen() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const styles = createStyles(theme);
  const { preference, setThemePreference } = useThemePreference();
  const { enabled, setEnabled } = useNotificationPreference();
  const toast = useToast();
  const { profile, initials } = useUserProfile();
  const [showScheduling, setShowScheduling] = useState(false);
  const [showTheme, setShowTheme] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);
  const [signingOut, setSigningOut] = useState(false);

  async function handleSignOut() {
    Alert.alert(
      "Sign Out",
      "Are you sure you want to sign out?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Sign Out",
          style: "destructive",
          onPress: async () => {
            setSigningOut(true);
            try {
              await signOut();
            } catch (e) {
              console.error("Sign out failed", e);
              toast.show({ message: "Sign out failed. Please try again.", duration: 4000 });
              setSigningOut(false);
            }
          },
        },
      ],
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Settings</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.sectionLabel}>Account</Text>
        <View style={styles.card}>
          <View style={styles.row}>
            <View style={styles.avatar}>
              {profile?.avatarUrl ? (
                <Image source={{ uri: profile.avatarUrl }} style={styles.avatarImage} />
              ) : (
                <Text style={styles.avatarText}>{initials}</Text>
              )}
            </View>
            <View style={styles.rowContent}>
              <Text style={styles.rowLabel}>{profile?.name || profile?.email || ""}</Text>
              {profile?.email ? (
                <Text style={styles.rowSubtitle}>{profile.email}</Text>
              ) : null}
            </View>
          </View>
          <SettingsRow
            icon="log-out-outline"
            label="Sign Out"
            labelStyle={styles.rowLabelDanger}
            onPress={handleSignOut}
            isLast
          />
        </View>

        <Text style={styles.sectionLabel}>AI Preferences</Text>
        <View style={styles.card}>
          <SettingsRow
            icon="sparkles-outline"
            label="Scheduling context"
            subtitle="Let us tune your AI"
            onPress={() => setShowScheduling(true)}
            isLast
            right={<Ionicons name="chevron-forward" size={18} color={theme.colors.onSurfaceVariant} />}
          />
        </View>

        <Text style={styles.sectionLabel}>Notifications</Text>
        <View style={styles.card}>
          <View style={[styles.row, styles.rowLast]}>
            <Ionicons name="notifications-outline" size={20} color={theme.colors.onSurfaceVariant} />
            <View style={styles.rowContent}>
              <Text style={styles.rowLabel}>Enable notifications</Text>
              <Text style={styles.rowSubtitle}>Task reminders and nudges</Text>
            </View>
            <View style={styles.rowRight}>
              <Switch
                value={enabled}
                onValueChange={setEnabled}
                accessibilityLabel="Enable notifications"
              />
            </View>
          </View>
        </View>

        <Text style={styles.sectionLabel}>Preferences</Text>
        <View style={styles.card}>
          <SettingsRow
            icon="moon-outline"
            label="Theme"
            subtitle={THEME_LABELS[preference]}
            onPress={() => setShowTheme(true)}
            isLast
            right={<Ionicons name="chevron-forward" size={18} color={theme.colors.onSurfaceVariant} />}
          />
        </View>

        <Text style={styles.sectionLabel}>About</Text>
        <View style={styles.card}>
          <SettingsRow
            icon="chatbubble-outline"
            label="Send feedback"
            subtitle="Report a bug or suggest a feature"
            onPress={() => setShowFeedback(true)}
            right={<Ionicons name="chevron-forward" size={18} color={theme.colors.onSurfaceVariant} />}
          />
          <View style={styles.row}>
            <Ionicons name="information-circle-outline" size={20} color={theme.colors.onSurfaceVariant} />
            <View style={styles.rowContent}>
              <Text style={styles.rowLabel}>Version</Text>
            </View>
            <View style={styles.rowRight}>
              <Text style={styles.badge}>
                {Application.nativeApplicationVersion ?? "?.?.?"} (
                {Application.nativeBuildVersion ?? "?"})
              </Text>
            </View>
          </View>
          <SettingsRow
            icon="shield-outline"
            label="Privacy policy"
            onPress={() => {}}
            isLast
            right={<Ionicons name="chevron-forward" size={18} color={theme.colors.onSurfaceVariant} />}
          />
        </View>
      </ScrollView>

      <SchedulingContextSheet
        visible={showScheduling}
        onClose={() => setShowScheduling(false)}
      />

      <ListSelector<ThemePreference>
        visible={showTheme}
        onClose={() => setShowTheme(false)}
        title="Theme"
        options={THEME_OPTIONS}
        selectedValue={preference}
        onSelect={(value) => {
          setThemePreference(value);
          setShowTheme(false);
        }}
      />

      <ListSelector<string>
        visible={showFeedback}
        onClose={() => setShowFeedback(false)}
        title="Send feedback"
        options={FEEDBACK_OPTIONS}
        onSelect={(key) => {
          const tpl = feedbackTemplates[key as keyof typeof feedbackTemplates];
          if (tpl) {
            Linking.openURL(buildMailtoUrl(tpl)).catch((err) =>
              console.error("Failed to open mailto", err),
            );
          }
          setShowFeedback(false);
        }}
      />
    </View>
  );
}
