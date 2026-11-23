import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import {
  clearRefreshCookie,
  REFRESH_COOKIE_NAME,
  sendBackendAuthRequest,
} from "@/lib/auth-server";

export async function POST(request: NextRequest) {
  const refreshToken = request.cookies.get(REFRESH_COOKIE_NAME)?.value;
  if (refreshToken) {
    await sendBackendAuthRequest("/api/v1/auth/logout", {
      refresh_token: refreshToken,
    }).catch(() => null);
  }

  const response = new NextResponse(null, { status: 204 });
  clearRefreshCookie(response);
  return response;
}
