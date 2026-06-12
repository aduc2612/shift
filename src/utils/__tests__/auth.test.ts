import { extractAuthTokensFromUrl } from "@/utils/auth";

describe("extractAuthTokensFromUrl", () => {
  it("extracts both tokens from a full URL with hash", () => {
    const result = extractAuthTokensFromUrl(
      "https://example.com/callback#access_token=abc123&refresh_token=def456",
    );
    expect(result).toEqual({
      accessToken: "abc123",
      refreshToken: "def456",
    });
  });

  it("returns null tokens when URL has no hash", () => {
    const result = extractAuthTokensFromUrl(
      "https://example.com/callback",
    );
    expect(result).toEqual({
      accessToken: null,
      refreshToken: null,
    });
  });

  it("returns only access_token when refresh_token is absent", () => {
    const result = extractAuthTokensFromUrl(
      "https://example.com/callback#access_token=abc123",
    );
    expect(result).toEqual({
      accessToken: "abc123",
      refreshToken: null,
    });
  });

  it("ignores extra parameters beyond access_token and refresh_token", () => {
    const result = extractAuthTokensFromUrl(
      "https://example.com/callback#access_token=abc&refresh_token=def&expires_in=3600&token_type=Bearer",
    );
    expect(result).toEqual({
      accessToken: "abc",
      refreshToken: "def",
    });
  });

  it("skips malformed percent-encoded pairs gracefully", () => {
    const result = extractAuthTokensFromUrl(
      "https://example.com/callback#access_token=abc%GG&refresh_token=def",
    );
    expect(result).toEqual({
      accessToken: null,
      refreshToken: "def",
    });
  });

  it("returns null tokens for an empty hash", () => {
    const result = extractAuthTokensFromUrl(
      "https://example.com/callback#",
    );
    expect(result).toEqual({
      accessToken: null,
      refreshToken: null,
    });
  });

  it("handles '=' character inside token value correctly", () => {
    const result = extractAuthTokensFromUrl(
      "https://example.com/callback#access_token=abc=def&refresh_token=ghi",
    );
    expect(result).toEqual({
      accessToken: "abc=def",
      refreshToken: "ghi",
    });
  });

  it("uses the first '#' when multiple are present in the URL", () => {
    const result = extractAuthTokensFromUrl(
      "https://example.com/callback#access_token=abc#extra&refresh_token=def",
    );
    // Hash fragment starts at first #: "access_token=abc#extra&refresh_token=def"
    // access_token=abc#extra → key "access_token", value "abc#extra"
    // refresh_token=def → key "refresh_token", value "def"
    expect(result).toEqual({
      accessToken: "abc#extra",
      refreshToken: "def",
    });
  });
});
