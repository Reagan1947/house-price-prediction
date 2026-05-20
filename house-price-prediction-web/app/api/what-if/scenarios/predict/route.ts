import { forwardWhatIfScenarioPredictRequest } from "@/lib/analysis/what-if-route-utils";

export async function POST(request: Request) {
  let raw: unknown;

  try {
    raw = await request.json();
  } catch {
    return forwardWhatIfScenarioPredictRequest(null);
  }

  return forwardWhatIfScenarioPredictRequest(raw);
}
