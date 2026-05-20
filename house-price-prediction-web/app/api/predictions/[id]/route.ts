import { forwardAuthenticatedBackendRequest } from "@/lib/valuation/route-utils";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(_request: Request, context: RouteContext) {
  const { id } = await context.params;

  return forwardAuthenticatedBackendRequest(`/predictions/${id}`, {
    method: "GET",
  });
}

export async function PUT(request: Request, context: RouteContext) {
  const { id } = await context.params;
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    body = {};
  }

  return forwardAuthenticatedBackendRequest(`/predictions/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
}

export async function DELETE(_request: Request, context: RouteContext) {
  const { id } = await context.params;

  return forwardAuthenticatedBackendRequest(`/predictions/${id}`, {
    method: "DELETE",
  });
}
