const DEFAULT_SEGMENTS_API_BASE_URL = "http://114.67.76.100:8003";

function normalizeSegmentsApiBaseUrl(url: string): string {
  const trimmedUrl = url.trim().replace(/\/+$/, "");

  if (/^https?:\/\//i.test(trimmedUrl)) {
    return trimmedUrl;
  }

  return `http://${trimmedUrl}`;
}

/** Backend host for all Segments analysis APIs (table, chart, summary). */
export const SEGMENTS_API_BASE_URL = normalizeSegmentsApiBaseUrl(
  process.env.SEGMENTS_API_BASE_URL ?? DEFAULT_SEGMENTS_API_BASE_URL,
);

export function getSegmentsApiUrl(path: string): string {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${SEGMENTS_API_BASE_URL}${normalizedPath}`;
}

export function getSegmentsTableApiUrl(): string {
  return getSegmentsApiUrl("/api/segments/table");
}

export function getSegmentsChartApiUrl(): string {
  return getSegmentsApiUrl("/api/segments/chart");
}

export function getSegmentsDashboardApiUrl(): string {
  return getSegmentsApiUrl("/api/dashboard");
}
