import { NextResponse } from "next/server";
import {
  getApiResponseStatus,
  getAuthTokenFromCookies,
  getBackendApiUrl,
  getBearerAuthHeaders,
  parseAuthUser,
  readBackendApiResponse,
  type ApiResponse,
  type AuthUser,
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

export async function GET() {
  const token = await getAuthTokenFromCookies();

  if (!token) {
    return NextResponse.json(TOKEN_INVALID_RESPONSE, { status: 401 });
  }

  try {
    const backendResponse = await fetch(getBackendApiUrl("/users/me"), {
      method: "GET",
      headers: getBearerAuthHeaders(token),
      cache: "no-store",
    });
    const payload = await readBackendApiResponse<AuthUser>(backendResponse);
    const status = getApiResponseStatus(backendResponse.status, payload);
    const currentUser = parseAuthUser(payload.data);

    if (status === 200 && currentUser) {
      return NextResponse.json(
        {
          code: payload.code,
          msg: payload.msg,
          data: currentUser,
        } satisfies ApiResponse<AuthUser>,
        { status },
      );
    }

    return NextResponse.json(
      {
        code: payload.code >= 400 ? payload.code : 401,
        msg: payload.msg || TOKEN_INVALID_RESPONSE.msg,
        data: null,
      } satisfies ApiResponse<null>,
      { status: status >= 400 ? status : 401 },
    );
  } catch {
    return NextResponse.json(SERVICE_UNAVAILABLE_RESPONSE, { status: 502 });
  }
}
