import { NextResponse } from "next/server";
import type { ApiResponse } from "@/lib/api/response";
import { getAuthTokenFromCookies, getBearerAuthHeaders } from "@/lib/auth/session";
import {
  getDashboardApiMessage,
  isDashboardApiSuccess,
} from "./dashboard-api";
import {
  normalizeBaselineVO,
  normalizeScenarioPredictVO,
  readWhatIfApiResponse,
  sanitizeScenarioPredictRequest,
  sanitizeWhatIfBaselineQueryRequest,
  type BaselineVO,
  type ScenarioPredictRequest,
  type ScenarioPredictVO,
} from "./what-if-api";
import { getWhatIfBaselineApiUrl, getWhatIfScenarioPredictApiUrl } from "./what-if-config";

const UNAUTHORIZED_RESPONSE: ApiResponse<null> = {
  code: 401,
  msg: "Not Authenticated",
  data: null,
};

const SERVICE_UNAVAILABLE_RESPONSE: ApiResponse<null> = {
  code: 502,
  msg: "What-if analysis service is unavailable.",
  data: null,
};

const INVALID_PARAMETER_RESPONSE: ApiResponse<null> = {
  code: 400,
  msg: "Invalid what-if parameters.",
  data: null,
};

function buildAuthHeaders(token: string): Headers {
  const headers = new Headers({
    "Content-Type": "application/json",
  });
  const bearerHeaders = getBearerAuthHeaders(token);

  if (typeof bearerHeaders === "object" && bearerHeaders !== null && !Array.isArray(bearerHeaders)) {
    for (const [key, value] of Object.entries(bearerHeaders)) {
      if (typeof value === "string") {
        headers.set(key, value);
      }
    }
  }

  return headers;
}

async function fetchBackendWhatIf<T, TBody extends object>(
  url: string,
  headers: Headers,
  body: TBody,
): Promise<{ ok: true; data: T } | { ok: false; status: number; msg: string; unauthorized?: boolean }> {
  const backendResponse = await fetch(url, {
    method: "POST",
    headers,
    body: JSON.stringify(body),
    cache: "no-store",
  });
  const payload = await readWhatIfApiResponse<T>(backendResponse);

  if (backendResponse.status === 401 || payload.code === 401) {
    return {
      ok: false,
      status: 401,
      msg: getDashboardApiMessage(payload) || "Not Authenticated",
      unauthorized: true,
    };
  }

  if (!backendResponse.ok || !isDashboardApiSuccess(payload.code) || payload.data === null) {
    const status = backendResponse.status >= 400 ? backendResponse.status : 502;
    return {
      ok: false,
      status: payload.code >= 400 ? payload.code : status,
      msg: getDashboardApiMessage(payload),
    };
  }

  return { ok: true, data: payload.data };
}

export async function forwardWhatIfBaselineRequest(raw: unknown): Promise<NextResponse> {
  const token = await getAuthTokenFromCookies();

  if (!token) {
    return NextResponse.json(UNAUTHORIZED_RESPONSE, { status: 401 });
  }

  const body = sanitizeWhatIfBaselineQueryRequest(raw);

  try {
    const result = await fetchBackendWhatIf<BaselineVO, typeof body>(
      getWhatIfBaselineApiUrl(),
      buildAuthHeaders(token),
      body,
    );

    if (!result.ok) {
      const status = result.unauthorized ? 401 : result.status;
      return NextResponse.json(
        { code: status, msg: result.msg, data: null } satisfies ApiResponse<null>,
        { status },
      );
    }

    const normalized = normalizeBaselineVO(result.data);
    if (!normalized) {
      return NextResponse.json(
        { code: 502, msg: "Invalid baseline response format.", data: null } satisfies ApiResponse<null>,
        { status: 502 },
      );
    }

    return NextResponse.json(
      { code: 200, msg: "success", data: normalized } satisfies ApiResponse<BaselineVO>,
      { status: 200 },
    );
  } catch {
    return NextResponse.json(SERVICE_UNAVAILABLE_RESPONSE, { status: 502 });
  }
}

export async function forwardWhatIfScenarioPredictRequest(raw: unknown): Promise<NextResponse> {
  const token = await getAuthTokenFromCookies();

  if (!token) {
    return NextResponse.json(UNAUTHORIZED_RESPONSE, { status: 401 });
  }

  const body = sanitizeScenarioPredictRequest(raw);
  if (!body) {
    return NextResponse.json(INVALID_PARAMETER_RESPONSE, { status: 400 });
  }

  try {
    const result = await fetchBackendWhatIf<ScenarioPredictVO, ScenarioPredictRequest>(
      getWhatIfScenarioPredictApiUrl(),
      buildAuthHeaders(token),
      body,
    );

    if (!result.ok) {
      const status = result.unauthorized ? 401 : result.status;
      return NextResponse.json(
        { code: status, msg: result.msg, data: null } satisfies ApiResponse<null>,
        { status },
      );
    }

    const normalized = normalizeScenarioPredictVO(result.data);
    if (!normalized) {
      return NextResponse.json(
        { code: 502, msg: "Invalid scenario predict response format.", data: null } satisfies ApiResponse<null>,
        { status: 502 },
      );
    }

    return NextResponse.json(
      { code: 200, msg: "success", data: normalized } satisfies ApiResponse<ScenarioPredictVO>,
      { status: 200 },
    );
  } catch {
    return NextResponse.json(SERVICE_UNAVAILABLE_RESPONSE, { status: 502 });
  }
}
