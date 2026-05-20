import { forwardSegmentTableRequest } from "@/lib/analysis/segments-route-utils";

export async function POST(request: Request) {
  let raw: unknown = {};

  try {
    raw = await request.json();
  } catch {
    // Empty body is invalid for segments (segmentDimension required).
  }

  return forwardSegmentTableRequest(raw);
}
