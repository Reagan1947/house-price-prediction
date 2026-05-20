const DEFAULT_WHAT_IF_API_BASE_URL = "http://114.67.76.100:8003";

function normalizeWhatIfApiBaseUrl(url: string): string {
  const trimmedUrl = url.trim().replace(/\/+$/, "");

  if (/^https?:\/\//i.test(trimmedUrl)) {
    return trimmedUrl;
  }

  return `http://${trimmedUrl}`;
}

/** Backend host for What-if APIs (baseline, scenario predict). */
export const WHAT_IF_API_BASE_URL = normalizeWhatIfApiBaseUrl(
  process.env.WHAT_IF_API_BASE_URL ??
    process.env.SEGMENTS_API_BASE_URL ??
    DEFAULT_WHAT_IF_API_BASE_URL,
);

export function getWhatIfApiUrl(path: string): string {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${WHAT_IF_API_BASE_URL}${normalizedPath}`;
}

export function getWhatIfBaselineApiUrl(): string {
  return getWhatIfApiUrl("/api/what-if/baseline");
}

export function getWhatIfScenarioPredictApiUrl(): string {
  return getWhatIfApiUrl("/api/what-if/scenarios/predict");
}
