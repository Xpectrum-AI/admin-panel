import { getRouteHandlers } from "@propelauth/nextjs/server/app-router";
import { NextRequest } from "next/server";

const routeHandlers = getRouteHandlers({
  postLoginRedirectPathFn: () => "/dashboard",
});

export const GET = async (request: Request, context: any) => {
  const nextReq = request instanceof NextRequest ? request : new NextRequest(request.url, request);
  return routeHandlers.getRouteHandler(nextReq, context);
};

export const POST = async (request: Request, context: any) => {
  const nextReq = request instanceof NextRequest ? request : new NextRequest(request.url, request);
  return routeHandlers.postRouteHandler(nextReq, context);
};
