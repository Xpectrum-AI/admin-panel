import { getRouteHandlers } from "@propelauth/nextjs/server/app-router";
import { NextRequest } from "next/server";

const routeHandlers = getRouteHandlers({
  postLoginRedirectPathFn: (req: NextRequest) => {
    return "/dashboard";  // Redirect user here after login
  }
});

export const GET = routeHandlers.getRouteHandler;
export const POST = routeHandlers.postRouteHandler;
