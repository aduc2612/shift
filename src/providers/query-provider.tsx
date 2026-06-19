import { QueryCache, MutationCache, QueryClient, QueryClientProvider } from "@tanstack/react-query";
import * as Sentry from "@sentry/react-native";

export const queryClient = new QueryClient({
  queryCache: new QueryCache({
    onError: (error) => {
      Sentry.captureException(error);
    },
  }),
  mutationCache: new MutationCache({
    onError: (error) => {
      Sentry.captureException(error);
    },
  }),
  defaultOptions: {
    queries: {
      staleTime: 30_000, // 30 seconds
      retry: 2,
    },
  },
});

export function QueryProvider({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}
