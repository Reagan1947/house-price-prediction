import { cookies } from "next/headers";
import type { NextResponse } from "next/server";

export type ApiResponse<T> = {
  code: number;
  msg: string;
  data: T | null;
};

export type AuthUser = {
  username: string;
  email: string;
};

export type AuthLoginParam = {
  email: string;
  password: string;
};

export type GetLoginToken = {
  access_token: string;
  token_type: string;
  expires_in: number;
  user: AuthUser | null;
};

export const AUTH_TOKEN_COOKIE_NAME = process.env.AUTH_COOKIE_NAME ?? "auth_token";
export const AUTH_USER_COOKIE_NAME = "auth_user";

export const AUTH_COOKIE_KEYS = Array.from(new Set([
  AUTH_TOKEN_COOKIE_NAME,
  "auth_token",
  "access_token",
  "session",
  "__session",
].filter((value): value is string => Boolean(value))));

const API_V1_PATH = process.env.FASTAPI_API_V1_PATH ?? "/api/v1";
const API_BASE_URL =
  process.env.FASTAPI_API_BASE_URL ??
  process.env.BACKEND_API_BASE_URL ??
  process.env.API_BASE_URL ??
  process.env.NEXT_PUBLIC_API_BASE_URL ??
  "http://114.67.76.100:8001";

function normalizeApiBaseUrl(url: string): string {
  const trimmedUrl = url.trim().replace(/\/+$/, "");

  if (/^https?:\/\//i.test(trimmedUrl)) {
    return trimmedUrl;
  }

  return `http://${trimmedUrl}`;
}

export function getBackendApiUrl(path: string): string {
  const normalizedBaseUrl = normalizeApiBaseUrl(API_BASE_URL);
  const normalizedApiPath = API_V1_PATH.startsWith("/") ? API_V1_PATH : `/${API_V1_PATH}`;
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;

  if (normalizedBaseUrl.endsWith(normalizedApiPath)) {
    return `${normalizedBaseUrl}${normalizedPath}`;
  }

  return `${normalizedBaseUrl}${normalizedApiPath}${normalizedPath}`;
}

export async function readApiResponse<T>(response: Response): Promise<ApiResponse<T>> {
  const text = await response.text();

  if (!text) {
    return {
      code: response.status,
      msg: response.statusText || "请求失败",
      data: null,
    };
  }

  try {
    return JSON.parse(text) as ApiResponse<T>;
  } catch {
    return {
      code: response.status,
      msg: response.statusText || "请求失败",
      data: null,
    };
  }
}

function isObjectRecord(input: unknown): input is Record<string, unknown> {
  return Boolean(input) && typeof input === "object" && !Array.isArray(input);
}

function readResponseCode(input: Record<string, unknown>, fallbackCode: number): number {
  return typeof input.code === "number" ? input.code : fallbackCode;
}

function readResponseMessage(input: Record<string, unknown>, fallbackMessage: string): string {
  return typeof input.msg === "string" && input.msg.trim().length > 0 ? input.msg : fallbackMessage;
}

export async function readBackendApiResponse<T>(response: Response): Promise<ApiResponse<T>> {
  const fallbackCode = response.ok ? 200 : response.status;
  const fallbackMessage = response.ok ? "请求成功" : response.statusText || "请求失败";
  const text = await response.text();

  if (!text) {
    return {
      code: fallbackCode,
      msg: fallbackMessage,
      data: null,
    };
  }

  try {
    const parsed = JSON.parse(text) as unknown;

    if (isObjectRecord(parsed)) {
      return {
        code: readResponseCode(parsed, fallbackCode),
        msg: readResponseMessage(parsed, fallbackMessage),
        data: "data" in parsed ? (parsed.data as T | null) : null,
      };
    }

    return {
      code: fallbackCode,
      msg: fallbackMessage,
      data: null,
    };
  } catch {
    return {
      code: fallbackCode,
      msg: fallbackMessage,
      data: null,
    };
  }
}

export function getApiResponseStatus<T>(backendStatus: number, payload: ApiResponse<T>): number {
  if (backendStatus !== 200) {
    return backendStatus;
  }

  if (payload.code >= 400 && payload.code <= 599) {
    return payload.code;
  }

  return 200;
}

export function parseAuthUser(input: unknown): AuthUser | null {
  if (!isObjectRecord(input)) {
    return null;
  }

  const username = typeof input.username === "string" ? input.username.trim() : "";
  const email = typeof input.email === "string" ? input.email.trim() : "";

  if (!username && !email) {
    return null;
  }

  return {
    username: username || email,
    email,
  };
}

export function parseLoginToken(input: unknown): GetLoginToken | null {
  if (!isObjectRecord(input)) {
    return null;
  }

  const access_token = typeof input.access_token === "string" ? input.access_token.trim() : "";
  const token_type = typeof input.token_type === "string" ? input.token_type.trim() : "Bearer";
  const expires_in = typeof input.expires_in === "number" ? input.expires_in : 86400;
  const user = parseAuthUser(input.user);

  if (!access_token) {
    return null;
  }

  return {
    access_token,
    token_type: token_type || "Bearer",
    expires_in: Number.isFinite(expires_in) ? expires_in : 86400,
    user,
  };
}

export function parseAuthLoginParam(input: unknown): AuthLoginParam | null {
  if (!isObjectRecord(input)) {
    return null;
  }

  const email =
    (typeof input.email === "string" ? input.email.trim() : "") ||
    (typeof input.username === "string" ? input.username.trim() : "");
  const password = typeof input.password === "string" ? input.password : "";

  if (!email || !password) {
    return null;
  }

  return { email, password };
}

export function getBearerAuthHeaders(token: string): HeadersInit {
  return {
    Authorization: `Bearer ${token}`,
  };
}

export function setAuthTokenCookie(response: NextResponse, token: string, maxAge: number) {
  response.cookies.set({
    name: AUTH_TOKEN_COOKIE_NAME,
    value: token,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge,
  });
}

export function setAuthUserCookie(response: NextResponse, user: AuthUser, maxAge: number) {
  response.cookies.set({
    name: AUTH_USER_COOKIE_NAME,
    value: encodeURIComponent(JSON.stringify(user)),
    httpOnly: false,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge,
  });
}

export function clearAuthCookies(response: NextResponse) {
  for (const key of [...AUTH_COOKIE_KEYS, AUTH_USER_COOKIE_NAME]) {
    response.cookies.set({
      name: key,
      value: "",
      maxAge: 0,
      path: "/",
      sameSite: "lax",
    });
  }
}

export async function getAuthUserFromCookies(): Promise<AuthUser | null> {
  const cookieStore = await cookies();
  const raw = cookieStore.get(AUTH_USER_COOKIE_NAME)?.value;

  if (!raw) {
    return null;
  }

  try {
    return parseAuthUser(JSON.parse(decodeURIComponent(raw)));
  } catch {
    return null;
  }
}

export async function getAuthTokenFromCookies(): Promise<string | undefined> {
  const cookieStore = await cookies();
  return AUTH_COOKIE_KEYS.map((key) => cookieStore.get(key)?.value).find(Boolean);
}

export async function getCurrentUser(): Promise<AuthUser | null> {
  const token = await getAuthTokenFromCookies();

  if (!token) {
    return null;
  }

  try {
    const response = await fetch(getBackendApiUrl("/users/me"), {
      method: "GET",
      headers: getBearerAuthHeaders(token),
      cache: "no-store",
    });
    const payload = await readBackendApiResponse<AuthUser>(response);

    if (getApiResponseStatus(response.status, payload) === 200) {
      const parsed = parseAuthUser(payload.data);
      if (parsed) {
        return parsed;
      }
    }
  } catch {
    // fall through to cookie-based fallback
  }

  return getAuthUserFromCookies();
}

export async function hasActiveSession(): Promise<boolean> {
  return Boolean(await getAuthTokenFromCookies());
}
