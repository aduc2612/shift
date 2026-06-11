import { useState } from "react";
import * as AuthSession from "expo-auth-session";
import * as WebBrowser from "expo-web-browser";
import { supabase } from "@/services/supabase";
import { extractAuthTokensFromUrl } from "@/utils/auth";

const redirectUri = AuthSession.makeRedirectUri({
  scheme: "shift",
  path: "(tabs)",
});

export function useGoogleSignIn() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function signIn() {
    setLoading(true);
    setError(null);

    try {
      const { data, error: oauthError } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: redirectUri,
          queryParams: { prompt: "consent" },
          skipBrowserRedirect: true,
        },
      });

      if (oauthError) throw oauthError;
      if (!data.url) throw new Error("No OAuth URL returned");

      const result = await WebBrowser.openAuthSessionAsync(
        data.url,
        redirectUri,
        { showInRecents: true },
      );

      if (result.type === "success") {
        const { accessToken, refreshToken } = extractAuthTokensFromUrl(
          result.url,
        );

        if (accessToken && refreshToken) {
          const { error: sessionError } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });
          if (sessionError) throw sessionError;
        } else {
          throw new Error("Missing tokens in callback URL");
        }
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Sign in failed. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  }

  return { signIn, loading, error };
}
