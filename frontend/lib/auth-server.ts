import type { NextResponse } from "next/server";

export const REFRESH_COOKIE_NAME = "afe_refresh_token";

const DEFAULT_API_BASE_URL =
  process.env.NODE_ENV === "production"
    ? "https://atbackend-web-app-afe.onrender.com"
    : "http://127.0.0.1:8000";

const API_BASE_URL = (process.env.NEXT_API_URL ?? DEFAULT_API_BASE_URL).replace(
  /\/+$/,
  "",
);

export async function sendBackendAuthRequest(
  path: string,
  body: unknown,
): Promise<Response> {
  return fetch(`${API_BASE_URL}${path}`, {
    method: "POST",
    cache: "no-store",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
}

export function setRefreshCookie(
  response: NextResponse,
  refreshToken: string,
  expiresAt: string,
) {
  response.cookies.set(REFRESH_COOKIE_NAME, refreshToken, {
    expires: new Date(expiresAt),
    httpOnly: true,
    path: "/api/auth",
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
  });
}

export function clearRefreshCookie(response: NextResponse) {
  response.cookies.set(REFRESH_COOKIE_NAME, "", {
    expires: new Date(0),
    httpOnly: true,
    path: "/api/auth",
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
  });
}

export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}
