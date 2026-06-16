import { useMemo, useCallback } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "@/providers/theme-provider";
import { useOnboardingStore } from "@/features/onboarding/state";
import { getPersonaReviews } from "@/features/onboarding/utils";
import { PERSONA_OPTIONS } from "@/types/onboarding";
import { withOpacity } from "@/utils/color";
import ProgressBar from "@/features/onboarding/components/ProgressBar";
import type { Theme } from "@/constants/theme";
import type { PersonaReview } from "@/constants/onboarding-reviews";

const TOTAL = 13;

function personaLabel(persona: string | null): string {
  if (!persona) return "people";
  return PERSONA_OPTIONS.find((p) => p.value === persona)?.label ?? "people";
}

function ReviewCard({
  review,
  personaTag,
}: {
  review: PersonaReview;
  personaTag: string;
}) {
  const theme = useTheme();
  const styles = useMemo(
    () => createStyles(theme, { top: 0, bottom: 0 }),
    [theme],
  );

  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{review.avatarInitials}</Text>
        </View>
        <View style={styles.headerText}>
          <Text style={styles.name}>{review.name}</Text>
          <View style={styles.tagRow}>
            {/* <View style={styles.tag}>
              <Text style={styles.tagText}>{personaTag}</Text>
            </View> */}
            <Ionicons name="star" size={12} color={theme.colors.primary} />
            <Text style={styles.rating}> {review.rating}.0</Text>
          </View>
        </View>
      </View>
      <Text style={styles.quote}>{review.quote}</Text>
    </View>
  );
}

function createStyles(theme: Theme, insets: { top: number; bottom: number }) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
      paddingTop: insets.top + theme.spacing.lg,
      paddingBottom: insets.bottom + theme.spacing.xl,
      paddingHorizontal: theme.spacing.xl,
    },
    progressContainer: { paddingBottom: theme.spacing.xxl },
    subtitle: {
      ...theme.typography.bodyLarge,
      color: theme.colors.onSurfaceVariant,
      marginBottom: theme.spacing.xxl,
      textAlign: "center",
    },
    cards: {
      gap: theme.spacing.md,
    },
    card: {
      backgroundColor: theme.colors.surfaceVariant,
      borderRadius: theme.spacing.md,
      padding: theme.spacing.lg,
      overflow: "visible",
    },
    cardHeader: {
      flexDirection: "row",
      alignItems: "center",
      marginBottom: theme.spacing.md,
    },
    avatar: {
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: theme.colors.primaryContainer,
      alignItems: "center",
      justifyContent: "center",
      marginRight: theme.spacing.md,
    },
    avatarText: {
      ...theme.typography.titleSmall,
      color: theme.colors.onPrimaryContainer,
    },
    headerText: { flex: 1 },
    name: {
      ...theme.typography.titleSmall,
      color: theme.colors.onSurface,
      marginBottom: theme.spacing.xs,
    },
    tagRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: theme.spacing.sm,
    },
    tag: {
      backgroundColor: withOpacity(theme.colors.primary, 0.12),
      borderRadius: theme.borderRadius.sm,
      paddingHorizontal: theme.spacing.sm,
      paddingVertical: 2,
    },
    tagText: {
      ...theme.typography.labelSmall,
      color: theme.colors.primary,
      fontWeight: "600",
    },
    rating: {
      ...theme.typography.labelSmall,
      color: theme.colors.onSurfaceVariant,
    },
    quote: {
      ...theme.typography.bodyMedium,
      color: theme.colors.onSurface,
      fontStyle: "italic",
      lineHeight: 22,
    },
    continueButton: {
      ...theme.componentStyles.button,
      backgroundColor: theme.colors.primary,
      alignItems: "center",
      minHeight: 48,
      marginTop: theme.spacing.xl,
    },
    continueText: {
      ...theme.typography.labelLarge,
      color: theme.colors.onPrimary,
    },
  });
}

export default function PersonaReviewScreen() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const styles = useMemo(() => createStyles(theme, insets), [theme, insets]);
  const data = useOnboardingStore((s) => s.data);
  const reviews = getPersonaReviews(data.persona);
  const tag = personaLabel(data.persona);

  const handleContinue = useCallback(() => {
    router.push("/(onboarding)/progress-graph");
  }, []);

  return (
    <View style={styles.container}>
      <View style={styles.progressContainer}>
        <ProgressBar current={8} total={TOTAL} />
      </View>

      <Text style={styles.subtitle}>
        Here's what {tag.toLowerCase()}s are saying about Shift AI.
      </Text>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={styles.cards}
        showsVerticalScrollIndicator={false}
      >
        {reviews.map((review, i) => (
          <ReviewCard key={i} review={review} personaTag={tag} />
        ))}
      </ScrollView>

      <Pressable
        style={({ pressed }) => [
          styles.continueButton,
          pressed && { opacity: theme.interaction.pressedOpacity },
        ]}
        onPress={handleContinue}
        accessibilityRole="button"
        accessibilityLabel="Continue"
      >
        <Text style={styles.continueText}>Continue</Text>
      </Pressable>
    </View>
  );
}
