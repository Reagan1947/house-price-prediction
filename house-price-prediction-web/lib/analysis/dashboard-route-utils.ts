import { NextResponse } from "next/server";
import type { ApiResponse } from "@/lib/api/response";
import {
  getAuthTokenFromCookies,
  getBearerAuthHeaders,
} from "@/lib/auth/session";
import {
  applyBaselineDeltaToDashboardData,
  coerceAnalysisDashboardData,
  getDashboardApiMessage,
  hasDashboardFilters,
  stripDashboardBaselineDelta,
  isDashboardApiSuccess,
  normalizeDashboardVo,
  readDashboardApiResponse,
  sanitizeDashboardQueryRequest,
  toBaselineDashboardQueryRequest,
  type DashboardQueryRequest,
} from "./dashboard-api";
import { getDashboardApiUrl } from "./dashboard-config";
import type { AnalysisDashboardData } from "./types";

const UNAUTHORIZED_RESPONSE: ApiResponse<null> = {
  code: 401,
  msg: "Not Authenticated",
  data: null,
};

const SERVICE_UNAVAILABLE_RESPONSE: ApiResponse<null> = {
  code: 502,
  msg: "Analysis dashboard service is unavailable.",
  data: null,
};

async function fetchBackendDashboard(
  headers: Headers,
  query: DashboardQueryRequest,
): Promise<{ ok: true; data: unknown } | { ok: false; status: number; msg: string; unauthorized?: boolean }> {
  const backendResponse = await fetch(getDashboardApiUrl(), {
    method: "POST",
    headers,
    body: JSON.stringify(query),
    cache: "no-store",
  });
  const payload = await readDashboardApiResponse<unknown>(backendResponse);

  if (backendResponse.status === 401 || payload.code === 401) {
    return {
      ok: false,
      status: 401,
      msg: getDashboardApiMessage(payload) || "Not Authenticated",
      unauthorized: true,
    };
  }

  if (!backendResponse.ok || !isDashboardApiSuccess(payload.code) || !payload.data) {
    const status = backendResponse.status >= 400 ? backendResponse.status : 502;
    return {
      ok: false,
      status,
      msg: getDashboardApiMessage(payload),
    };
  }

  return { ok: true, data: payload.data };
}

export async function forwardDashboardRequest(body: unknown): Promise<NextResponse> {
  const token = await getAuthTokenFromCookies();

  if (!token) {
    return NextResponse.json(UNAUTHORIZED_RESPONSE, { status: 401 });
  }

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

  const query = sanitizeDashboardQueryRequest(body);
  const needsBaseline = hasDashboardFilters(query);

  try {
    const filteredResult = await fetchBackendDashboard(headers, query);

    if (!filteredResult.ok) {
      const status = filteredResult.unauthorized ? 401 : filteredResult.status;
      return NextResponse.json(
        {
          code: status,
          msg: filteredResult.msg,
          data: null,
        } satisfies ApiResponse<null>,
        { status },
      );
    }

    const filteredVo = normalizeDashboardVo(filteredResult.data);
    const baseData = coerceAnalysisDashboardData(filteredVo);
    const hasApiBaselineDelta = Boolean(baseData.kpis.deltaVsBaseline);

    let baselineMetrics: ReturnType<typeof normalizeDashboardVo>["metrics"] | undefined;

    if (needsBaseline && !hasApiBaselineDelta) {
      const baselineResult = await fetchBackendDashboard(headers, toBaselineDashboardQueryRequest(query));

      if (!baselineResult.ok) {
        const status = baselineResult.unauthorized ? 401 : baselineResult.status;
        return NextResponse.json(
          {
            code: status,
            msg: baselineResult.msg,
            data: null,
          } satisfies ApiResponse<null>,
          { status },
        );
      }

      baselineMetrics = normalizeDashboardVo(baselineResult.data).metrics;
    }

    const data: AnalysisDashboardData = needsBaseline
      ? applyBaselineDeltaToDashboardData(baseData, baselineMetrics)
      : stripDashboardBaselineDelta(baseData);

    return NextResponse.json(
      {
        code: 200,
        msg: "success",
        data,
      } satisfies ApiResponse<AnalysisDashboardData>,
      { status: 200 },
    );
  } catch {
    return NextResponse.json(SERVICE_UNAVAILABLE_RESPONSE, { status: 502 });
  }
}
