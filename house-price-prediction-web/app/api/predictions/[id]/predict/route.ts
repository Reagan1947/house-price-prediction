import { forwardAuthenticatedBackendRequest } from "@/lib/valuation/route-utils";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function POST(_request: Request, context: RouteContext) {
  const { id } = await context.params;

  return forwardAuthenticatedBackendRequest(`/predictions/${id}/predict`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({}),
  });
}
