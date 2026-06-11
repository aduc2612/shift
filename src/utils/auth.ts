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
