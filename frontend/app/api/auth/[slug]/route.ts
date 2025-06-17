// app/api/auth/[slug]/route.ts
import {getRouteHandlers} from "@propelauth/nextjs/server/app-router";
import {NextRequest} from "next/server";
import { NextResponse } from "next/server";

// postLoginRedirectPathFn is optional, but if you want to redirect the user to a different page after login, you can do so here.
const routeHandlers = getRouteHandlers({
  postLoginRedirectPathFn: () => "/",
})

type RouteContext = {
  params: Promise<{
    slug: string;
  }>;
};

export async function GET(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const handler = routeHandlers.getRouteHandler;
    // Resolve the Promise and transform to the format PropelAuth expects
    const params = await context.params;
    const transformedContext = { params };
    return handler(request, transformedContext);
  } catch (error) {
    console.error('Auth error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const handler = routeHandlers.postRouteHandler;
    // Resolve the Promise and transform to the format PropelAuth expects
    const params = await context.params;
    const transformedContext = { params };
    return handler(request, transformedContext);
  } catch (error) {
    console.error('Auth error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}