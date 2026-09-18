import * as SecureStore from 'expo-secure-store';

const ACCESS_TOKEN_KEY = 'access_token';

function getApiBaseUrl() {
  const apiBaseUrl = process.env.EXPO_PUBLIC_BACKEND_API_URL?.replace(/\/+$/, '');

  if (!apiBaseUrl) {
    throw new Error(
      'The mobile API URL is not configured. Add EXPO_PUBLIC_BACKEND_API_URL to mobile/.env.',
    );
  }

  return apiBaseUrl;
}

async function sendAuthRequest(
  path: string,
  email: string,
  password: string,
  fallbackMessage: string,
): Promise<unknown> {
  const response = await fetch(`${getApiBaseUrl()}${path}`, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email, password }),
  });
  const responseBody: unknown = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(getErrorMessage(responseBody, fallbackMessage));
  }

  return responseBody;
}

export async function login(email: string, password: string) {
  const response = await sendAuthRequest(
    '/api/v1/auth/login',
    email,
    password,
    'Unable to sign in. Please try again.',
  );

  if (
    !isRecord(response) ||
    typeof response.access_token !== 'string' ||
    !response.access_token
  ) {
    throw new Error('The login API returned an invalid response.');
  }

  await SecureStore.setItemAsync(ACCESS_TOKEN_KEY, response.access_token);
}

export async function register(email: string, password: string) {
  await sendAuthRequest(
    '/api/v1/auth/register',
    email,
    password,
    'Unable to create your account. Please try again.',
  );
}

export async function getAccessToken() {
  return SecureStore.getItemAsync(ACCESS_TOKEN_KEY);
}

export async function clearAccessToken() {
  await SecureStore.deleteItemAsync(ACCESS_TOKEN_KEY);
}

export async function hasValidSession() {
  const accessToken = await getAccessToken();
  if (!accessToken) return false;

  try {
    const response = await fetch(`${getApiBaseUrl()}/api/v1/auth/me`, {
      headers: {
        Accept: 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (response.ok) return true;
  } catch {
    // A saved token cannot be used when the account profile cannot be verified.
  }

  await clearAccessToken();
  return false;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function getErrorMessage(value: unknown, fallbackMessage: string) {
  if (
    isRecord(value) &&
    typeof value.detail === 'string' &&
    value.detail.trim()
  ) {
    return value.detail;
  }

  return fallbackMessage;
}
