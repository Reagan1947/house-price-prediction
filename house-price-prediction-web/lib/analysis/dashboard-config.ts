const DEFAULT_DASHBOARD_API_BASE_URL = "http://114.67.76.100:8003";

function normalizeDashboardApiBaseUrl(url: string): string {
  const trimmedUrl = url.trim().replace(/\/+$/, "");

  if (/^https?:\/\//i.test(trimmedUrl)) {
    return trimmedUrl;
  }

  return `http://${trimmedUrl}`;
}

export const DASHBOARD_API_BASE_URL = normalizeDashboardApiBaseUrl(
  process.env.DASHBOARD_API_BASE_URL ??
    process.env.ANALYSIS_DASHBOARD_API_BASE_URL ??
    DEFAULT_DASHBOARD_API_BASE_URL,
);

export function getDashboardApiUrl(path = "/api/dashboard"): string {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${DASHBOARD_API_BASE_URL}${normalizedPath}`;
}
