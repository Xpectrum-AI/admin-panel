import { getRouteHandlers } from "@propelauth/nextjs/server/app-router";
import { NextRequest } from "next/server";

const routeHandlers = getRouteHandlers({
  postLoginRedirectPathFn: () => "/dashboard",
});

export const GET = async (_req: Request, context: { params: Promise<{ slug: string }> }) => {
  const resolvedContext = { ...context, params: await context.params };
  const nextReq = _req instanceof NextRequest ? _req : new NextRequest(_req.url, _req);
  return routeHandlers.getRouteHandler(nextReq, resolvedContext);
};

export const POST = async (req: Request, context: { params: Promise<{ slug: string }> }) => {
  const resolvedContext = { ...context, params: await context.params };
  const nextReq = req instanceof NextRequest ? req : new NextRequest(req.url, req);
  return routeHandlers.postRouteHandler(nextReq, resolvedContext);
};
