import { forwardSegmentsSummaryRequest } from "@/lib/analysis/segments-route-utils";

export async function POST() {
  return forwardSegmentsSummaryRequest();
}
