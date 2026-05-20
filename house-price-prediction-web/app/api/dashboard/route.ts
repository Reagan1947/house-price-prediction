import { forwardDashboardRequest } from "@/lib/analysis/dashboard-route-utils";
import { sanitizeDashboardQueryRequest } from "@/lib/analysis/dashboard-api";

export async function POST(request: Request) {
  let raw: unknown = {};

  try {
    raw = await request.json();
  } catch {
    // Empty body is valid for an unfiltered dashboard query.
  }

  return forwardDashboardRequest(sanitizeDashboardQueryRequest(raw));
}

export async function HEAD() {
  return new Response(null, { status: 200 });
}
