import { forwardWhatIfBaselineRequest } from "@/lib/analysis/what-if-route-utils";

export async function POST(request: Request) {
  let raw: unknown = {};

  try {
    raw = await request.json();
  } catch {
    // Empty body is valid for full-market baseline.
  }

  return forwardWhatIfBaselineRequest(raw);
}
