const ACCESS_TOKEN_KEY = "afe_access_token";

export function getAccessToken(): string | null {
  if (typeof window === "undefined") return null;
  return window.sessionStorage.getItem(ACCESS_TOKEN_KEY);
}

export function saveAccessToken(token: string): void {
  window.sessionStorage.setItem(ACCESS_TOKEN_KEY, token);
}

export function clearAccessToken(): void {
  if (typeof window === "undefined") return;
  window.sessionStorage.removeItem(ACCESS_TOKEN_KEY);
}
