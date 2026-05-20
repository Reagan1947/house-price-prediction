import { NextResponse } from "next/server";
import type { ApiResponse } from "@/lib/api/response";
import {
  getAuthTokenFromCookies,
  getBearerAuthHeaders,
} from "@/lib/auth/session";
import {
  getDashboardApiMessage,
  isDashboardApiSuccess,
  normalizeDashboardVo,
  sanitizeDashboardQueryRequest,
} from "./dashboard-api";
import {
  readSegmentsApiResponse,
  sanitizeSegmentQueryRequest,
  type SegmentChartVO,
  type SegmentQueryRequest,
  type SegmentTableVO,
} from "./segments-api";
import { getSegmentsChartApiUrl, getSegmentsDashboardApiUrl, getSegmentsTableApiUrl } from "./segments-config";

const UNAUTHORIZED_RESPONSE: ApiResponse<null> = {
  code: 401,
  msg: "Not Authenticated",
  data: null,
};

const SERVICE_UNAVAILABLE_RESPONSE: ApiResponse<null> = {
  code: 502,
  msg: "Segments analysis service is unavailable.",
  data: null,
};

const INVALID_PARAMETER_RESPONSE: ApiResponse<null> = {
  code: 400,
  msg: "Invalid segment parameters.",
  data: null,
};

async function fetchBackendSegment<T, TBody extends object>(
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
  const payload = await readSegmentsApiResponse<T>(backendResponse);

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
      status,
      msg: getDashboardApiMessage(payload),
    };
  }

  return { ok: true, data: payload.data };
}

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

export async function forwardSegmentTableRequest(raw: unknown): Promise<NextResponse> {
  const token = await getAuthTokenFromCookies();

  if (!token) {
    return NextResponse.json(UNAUTHORIZED_RESPONSE, { status: 401 });
  }

  const body = sanitizeSegmentQueryRequest(raw);
  if (!body) {
    return NextResponse.json(INVALID_PARAMETER_RESPONSE, { status: 400 });
  }

  try {
    const result = await fetchBackendSegment<SegmentTableVO, SegmentQueryRequest>(
      getSegmentsTableApiUrl(),
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

    return NextResponse.json(
      { code: 200, msg: "success", data: result.data } satisfies ApiResponse<SegmentTableVO>,
      { status: 200 },
    );
  } catch {
    return NextResponse.json(SERVICE_UNAVAILABLE_RESPONSE, { status: 502 });
  }
}

export async function forwardSegmentsSummaryRequest(): Promise<NextResponse> {
  const token = await getAuthTokenFromCookies();

  if (!token) {
    return NextResponse.json(UNAUTHORIZED_RESPONSE, { status: 401 });
  }

  const body = sanitizeDashboardQueryRequest({});

  try {
    const result = await fetchBackendSegment<unknown, ReturnType<typeof sanitizeDashboardQueryRequest>>(
      getSegmentsDashboardApiUrl(),
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

    const dashboard = normalizeDashboardVo(result.data);

    return NextResponse.json(
      {
        code: 200,
        msg: "success",
        data: { totalRecords: dashboard.metrics.totalRecords },
      } satisfies ApiResponse<{ totalRecords: number }>,
      { status: 200 },
    );
  } catch {
    return NextResponse.json(SERVICE_UNAVAILABLE_RESPONSE, { status: 502 });
  }
}

export async function forwardSegmentChartRequest(raw: unknown): Promise<NextResponse> {
  const token = await getAuthTokenFromCookies();

  if (!token) {
    return NextResponse.json(UNAUTHORIZED_RESPONSE, { status: 401 });
  }

  const body = sanitizeSegmentQueryRequest(raw);
  if (!body) {
    return NextResponse.json(INVALID_PARAMETER_RESPONSE, { status: 400 });
  }

  try {
    const result = await fetchBackendSegment<SegmentChartVO, SegmentQueryRequest>(
      getSegmentsChartApiUrl(),
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

    return NextResponse.json(
      { code: 200, msg: "success", data: result.data } satisfies ApiResponse<SegmentChartVO>,
      { status: 200 },
    );
  } catch {
    return NextResponse.json(SERVICE_UNAVAILABLE_RESPONSE, { status: 502 });
  }
}
