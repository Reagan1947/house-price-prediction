import { forwardAuthenticatedBackendRequest } from "@/lib/valuation/route-utils";

export async function GET(request: Request) {
  const query = new URL(request.url).searchParams.toString();
  const path = query ? `/predictions?${query}` : "/predictions";

  return forwardAuthenticatedBackendRequest(path, {
    method: "GET",
  });
}

export async function POST(request: Request) {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    body = {};
  }

  return forwardAuthenticatedBackendRequest("/predictions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
}
