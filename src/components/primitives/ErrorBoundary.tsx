import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import * as Sentry from '@sentry/react-native';
import { Theme } from '@/constants/theme';
import { useTheme } from '@/providers/theme-provider';

type Props = { children: React.ReactNode };

type State = { hasError: boolean };

class ErrorBoundaryInner extends React.Component<
  Props & { theme: Theme },
  State
> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    Sentry.captureException(error, { extra: { componentStack: info.componentStack } });
  }

  handleRetry = () => {
    this.setState({ hasError: false });
  };

  render() {
    if (this.state.hasError) {
      const { theme } = this.props;
      return (
        <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
          <Text style={[styles.title, { color: theme.colors.onBackground }]}>
            Something went wrong
          </Text>
          <Text style={[styles.subtitle, { color: theme.colors.onSurfaceVariant }]}>
            An unexpected error occurred.
          </Text>
          <Pressable
            onPress={this.handleRetry}
            hitSlop={14}
            style={({ pressed }) => [
              styles.button,
              { backgroundColor: theme.colors.primary, opacity: pressed ? theme.interaction.pressedOpacity : 1 },
            ]}
          >
            <Text style={[styles.buttonText, { color: theme.colors.onPrimary }]}>
              Try again
            </Text>
          </Pressable>
        </View>
      );
    }
    return this.props.children;
  }
}

export default function ErrorBoundary({ children }: Props) {
  const theme = useTheme();
  return (
    <ErrorBoundaryInner theme={theme}>{children}</ErrorBoundaryInner>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    marginBottom: 24,
    textAlign: 'center',
  },
  button: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});
