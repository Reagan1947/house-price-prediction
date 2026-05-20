import { NextResponse } from "next/server";
import {
  getApiResponseStatus,
  getBackendApiUrl,
  parseAuthLoginParam,
  parseLoginToken,
  readBackendApiResponse,
  setAuthTokenCookie,
  setAuthUserCookie,
  type ApiResponse,
  type GetLoginToken,
} from "@/lib/auth/session";

const LOGIN_FAILED_RESPONSE: ApiResponse<null> = {
  code: 401,
  msg: "The email or password for the account is incorrect. Please check and try again.",
  data: null,
};

const SERVICE_UNAVAILABLE_RESPONSE: ApiResponse<null> = {
  code: 502,
  msg: "Authentication service is unavailable.",
  data: null,
};

export async function POST(request: Request) {
  let requestBody: ReturnType<typeof parseAuthLoginParam>;

  try {
    requestBody = parseAuthLoginParam(await request.json());
  } catch {
    requestBody = null;
  }

  if (!requestBody) {
    return NextResponse.json(
      {
        code: 400,
        msg: "Invalid login request.",
        data: null,
      } satisfies ApiResponse<null>,
      { status: 400 },
    );
  }

  try {
    const backendResponse = await fetch(getBackendApiUrl("/auth/login"), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
      cache: "no-store",
    });
    const payload = await readBackendApiResponse<GetLoginToken>(backendResponse);
    const status = getApiResponseStatus(backendResponse.status, payload);

    if (status !== 200) {
      return NextResponse.json(LOGIN_FAILED_RESPONSE, { status: 401 });
    }

    const loginData = parseLoginToken(payload.data);

    if (!loginData) {
      return NextResponse.json(LOGIN_FAILED_RESPONSE, { status: 401 });
    }

    const response = NextResponse.json(payload, { status: 200 });
    setAuthTokenCookie(response, loginData.access_token, loginData.expires_in);
    if (loginData.user) {
      setAuthUserCookie(response, loginData.user, loginData.expires_in);
    }

    return response;
  } catch {
    return NextResponse.json(SERVICE_UNAVAILABLE_RESPONSE, { status: 502 });
  }
}
