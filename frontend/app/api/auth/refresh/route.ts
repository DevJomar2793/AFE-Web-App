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
  const refreshToken = request.cookies.get(REFRESH_COOKIE_NAME)?.value;
  if (!refreshToken) {
    return NextResponse.json(
      { detail: "No remembered session is available" },
      { status: 401 },
    );
  }

  const backendResponse = await sendBackendAuthRequest(
    "/api/v1/auth/refresh",
    { refresh_token: refreshToken },
  );
  const responseBody: unknown = await backendResponse.json().catch(() => null);

  if (
    !backendResponse.ok ||
    !isRecord(responseBody) ||
    typeof responseBody.access_token !== "string" ||
    typeof responseBody.refresh_token !== "string" ||
    typeof responseBody.refresh_token_expires_at !== "string"
  ) {
    const response = NextResponse.json(
      backendResponse.ok
        ? { detail: "The refresh API returned an invalid response" }
        : responseBody,
      { status: backendResponse.ok ? 502 : backendResponse.status },
    );
    clearRefreshCookie(response);
    return response;
  }

  const response = NextResponse.json({
    access_token: responseBody.access_token,
    token_type: "bearer",
  });
  setRefreshCookie(
    response,
    responseBody.refresh_token,
    responseBody.refresh_token_expires_at,
  );
  return response;
}
