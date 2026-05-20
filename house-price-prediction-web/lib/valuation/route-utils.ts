import { NextResponse } from "next/server";
import {
  getApiResponseStatus,
  getAuthTokenFromCookies,
  getBackendApiUrl,
  getBearerAuthHeaders,
  readBackendApiResponse,
  type ApiResponse,
} from "@/lib/auth/session";

const UNAUTHORIZED_RESPONSE: ApiResponse<null> = {
  code: 401,
  msg: "Not Authenticated",
  data: null,
};

const SERVICE_UNAVAILABLE_RESPONSE: ApiResponse<null> = {
  code: 502,
  msg: "Prediction service is unavailable.",
  data: null,
};

export async function forwardAuthenticatedBackendRequest(
  path: string,
  init: RequestInit = {},
): Promise<NextResponse> {
  const token = await getAuthTokenFromCookies();

  if (!token) {
    return NextResponse.json(UNAUTHORIZED_RESPONSE, { status: 401 });
  }

  const headers = new Headers(init.headers);
  const bearerHeaders = getBearerAuthHeaders(token);

  if (typeof bearerHeaders === "object" && bearerHeaders !== null && !Array.isArray(bearerHeaders)) {
    for (const [key, value] of Object.entries(bearerHeaders)) {
      if (typeof value === "string") {
        headers.set(key, value);
      }
    }
  }

  try {
    const backendResponse = await fetch(getBackendApiUrl(path), {
      ...init,
      headers,
      cache: "no-store",
    });
    const payload = await readBackendApiResponse(backendResponse);
    const status = getApiResponseStatus(backendResponse.status, payload);

    return NextResponse.json(payload, { status });
  } catch {
    return NextResponse.json(SERVICE_UNAVAILABLE_RESPONSE, { status: 502 });
  }
}

export async function forwardPublicBackendRequest(
  path: string,
  init: RequestInit = {},
): Promise<NextResponse> {
  try {
    const backendResponse = await fetch(getBackendApiUrl(path), {
      ...init,
      cache: "no-store",
    });
    const payload = await readBackendApiResponse(backendResponse);
    const status = getApiResponseStatus(backendResponse.status, payload);

    return NextResponse.json(payload, { status });
  } catch {
    return NextResponse.json(SERVICE_UNAVAILABLE_RESPONSE, { status: 502 });
  }
}
