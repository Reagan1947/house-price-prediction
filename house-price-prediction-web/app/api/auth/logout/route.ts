import { NextResponse } from "next/server";
import {
  clearAuthCookies,
  getApiResponseStatus,
  getAuthTokenFromCookies,
  getBackendApiUrl,
  getBearerAuthHeaders,
  readBackendApiResponse,
  type ApiResponse,
} from "@/lib/auth/session";

const TOKEN_INVALID_RESPONSE: ApiResponse<null> = {
  code: 401,
  msg: "Token 无效",
  data: null,
};

const SERVICE_UNAVAILABLE_RESPONSE: ApiResponse<null> = {
  code: 502,
  msg: "Authentication service is unavailable.",
  data: null,
};

export async function POST() {
  const token = await getAuthTokenFromCookies();

  if (!token) {
    const response = NextResponse.json(TOKEN_INVALID_RESPONSE, { status: 401 });
    clearAuthCookies(response);
    return response;
  }

  try {
    const backendResponse = await fetch(getBackendApiUrl("/auth/logout"), {
      method: "POST",
      headers: getBearerAuthHeaders(token),
      cache: "no-store",
    });
    const payload = await readBackendApiResponse<null>(backendResponse);
    const response = NextResponse.json(payload, {
      status: getApiResponseStatus(backendResponse.status, payload),
    });
    clearAuthCookies(response);
    return response;
  } catch {
    const response = NextResponse.json(SERVICE_UNAVAILABLE_RESPONSE, { status: 502 });
    clearAuthCookies(response);
    return response;
  }
}
