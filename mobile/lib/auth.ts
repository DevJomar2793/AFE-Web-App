import * as SecureStore from "expo-secure-store";
import { API_BASE_URL, APP_ENV } from "./config";

const ACCESS_TOKEN_KEY = `access_token_${APP_ENV}`;
const REFRESH_TOKEN_KEY = `refresh_token_${APP_ENV}`;

let refreshRequest: Promise<string | null> | null = null;
let sessionExpiredHandler: (() => void) | null = null;

export interface UserAccount {
  email: string;
  isActive: boolean;
  isAdmin: boolean;
}

export function setSessionExpiredHandler(handler: (() => void) | null) {
  sessionExpiredHandler = handler;
}

async function sendAuthRequest(
  path: string,
  body: Record<string, unknown>,
  fallbackMessage: string,
): Promise<unknown> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
  const responseBody: unknown = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(getErrorMessage(responseBody, fallbackMessage));
  }

  return responseBody;
}

export async function login(
  email: string,
  password: string,
  rememberMe: boolean,
) {
  await revokeRememberedSession();

  const response = await sendAuthRequest(
    "/api/v1/auth/login",
    { email, password, remember_me: rememberMe },
    "Unable to sign in. Please try again.",
  );

  if (
    !isRecord(response) ||
    typeof response.access_token !== "string" ||
    !response.access_token
  ) {
    throw new Error("The login API returned an invalid response.");
  }

  await SecureStore.setItemAsync(ACCESS_TOKEN_KEY, response.access_token);

  if (rememberMe) {
    if (
      typeof response.refresh_token !== "string" ||
      !response.refresh_token
    ) {
      await clearAccessToken();
      throw new Error("The login API did not create a remembered session.");
    }
    await SecureStore.setItemAsync(REFRESH_TOKEN_KEY, response.refresh_token);
  } else {
    await SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY);
  }
}

export async function register(email: string, password: string) {
  await sendAuthRequest(
    "/api/v1/auth/register",
    { email, password },
    "Unable to create your account. Please try again.",
  );
}

export async function getAccessToken() {
  return SecureStore.getItemAsync(ACCESS_TOKEN_KEY);
}

export async function clearAccessToken() {
  await Promise.all([
    SecureStore.deleteItemAsync(ACCESS_TOKEN_KEY),
    SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY),
  ]);
}

export async function logout() {
  try {
    await revokeRememberedSession();
  } finally {
    await clearAccessToken();
  }
}

export async function authenticatedFetch(
  path: string,
  options: RequestInit = {},
): Promise<Response> {
  let accessToken = await getAccessToken();
  let response = await fetchWithAccessToken(path, options, accessToken);

  if (response.status === 401) {
    accessToken = await refreshAccessToken();
    if (accessToken) {
      response = await fetchWithAccessToken(path, options, accessToken);
    }
  }

  if (response.status === 401) {
    await clearAccessToken();
    sessionExpiredHandler?.();
  }

  return response;
}

export async function hasValidSession() {
  return Boolean(await getCurrentUser());
}

export async function getCurrentUser(): Promise<UserAccount | null> {
  const accessToken = await getAccessToken();
  const refreshToken = await SecureStore.getItemAsync(REFRESH_TOKEN_KEY);
  if (!accessToken && !refreshToken) return null;

  try {
    const response = await authenticatedFetch("/api/v1/auth/me");
    const responseBody: unknown = await response.json().catch(() => null);

    if (
      response.ok &&
      isRecord(responseBody) &&
      typeof responseBody.email === "string" &&
      typeof responseBody.is_active === "boolean" &&
      typeof responseBody.is_admin === "boolean"
    ) {
      return {
        email: responseBody.email,
        isActive: responseBody.is_active,
        isAdmin: responseBody.is_admin,
      };
    }
  } catch {
    // Keep saved tokens after a temporary network failure.
  }

  return null;
}

async function fetchWithAccessToken(
  path: string,
  options: RequestInit,
  accessToken: string | null,
) {
  const headers = new Headers(options.headers);
  headers.set("Accept", "application/json");
  if (accessToken) headers.set("Authorization", `Bearer ${accessToken}`);

  return fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers,
  });
}

async function refreshAccessToken(): Promise<string | null> {
  if (refreshRequest) return refreshRequest;

  refreshRequest = (async () => {
    try {
      const refreshToken = await SecureStore.getItemAsync(REFRESH_TOKEN_KEY);
      if (!refreshToken) return null;

      const apiResponse = await fetch(`${API_BASE_URL}/api/v1/auth/refresh`, {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ refresh_token: refreshToken }),
      });
      const response: unknown = await apiResponse.json().catch(() => null);

      if (apiResponse.status === 401) {
        await clearAccessToken();
        return null;
      }
      if (!apiResponse.ok) {
        throw new Error(
          getErrorMessage(response, "Unable to refresh the login session."),
        );
      }
      if (
        !isRecord(response) ||
        typeof response.access_token !== "string" ||
        typeof response.refresh_token !== "string"
      ) {
        await clearAccessToken();
        return null;
      }

      await Promise.all([
        SecureStore.setItemAsync(ACCESS_TOKEN_KEY, response.access_token),
        SecureStore.setItemAsync(REFRESH_TOKEN_KEY, response.refresh_token),
      ]);
      return response.access_token;
    } finally {
      refreshRequest = null;
    }
  })();

  return refreshRequest;
}

async function revokeRememberedSession() {
  const refreshToken = await SecureStore.getItemAsync(REFRESH_TOKEN_KEY);
  if (!refreshToken) return;

  try {
    await sendAuthRequest(
      "/api/v1/auth/logout",
      { refresh_token: refreshToken },
      "Unable to revoke the remembered session.",
    );
  } catch {
    // Local token removal still prevents this device from restoring the session.
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function getErrorMessage(value: unknown, fallbackMessage: string) {
  if (
    isRecord(value) &&
    typeof value.detail === "string" &&
    value.detail.trim()
  ) {
    return value.detail;
  }

  return fallbackMessage;
}
