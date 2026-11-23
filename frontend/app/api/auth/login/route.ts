import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import {
  clearRefreshCookie,
  isRecord,
  REFRESH_COOKIE_NAME,
  sendBackendAuthRequest,
  setRefreshCookie,
} from "@/lib/auth-server";

export async function POST(request: NextRequest) {
  const requestBody: unknown = await request.json().catch(() => null);
  const backendResponse = await sendBackendAuthRequest(
    "/api/v1/auth/login",
    requestBody,
  );
  const responseBody: unknown = await backendResponse.json().catch(() => null);

  if (!backendResponse.ok) {
    return NextResponse.json(responseBody, { status: backendResponse.status });
  }

  if (
    !isRecord(responseBody) ||
    typeof responseBody.access_token !== "string"
  ) {
    return NextResponse.json(
      { detail: "The login API returned an invalid response" },
      { status: 502 },
    );
  }

  const previousRefreshToken = request.cookies.get(REFRESH_COOKIE_NAME)?.value;
  if (previousRefreshToken) {
    await sendBackendAuthRequest("/api/v1/auth/logout", {
      refresh_token: previousRefreshToken,
    }).catch(() => null);
  }

  const response = NextResponse.json({
    access_token: responseBody.access_token,
    token_type: "bearer",
  });

  if (
    typeof responseBody.refresh_token === "string" &&
    typeof responseBody.refresh_token_expires_at === "string"
  ) {
    setRefreshCookie(
      response,
      responseBody.refresh_token,
      responseBody.refresh_token_expires_at,
    );
  } else {
    clearRefreshCookie(response);
  }

  return response;
}
