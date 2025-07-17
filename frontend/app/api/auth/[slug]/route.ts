import { getRouteHandlers } from "@propelauth/nextjs/server/app-router";
import { NextRequest } from "next/server";
import { UserFromToken } from '@propelauth/nextjs/server'

const routeHandlers = getRouteHandlers({
  postLoginRedirectPathFn: (req: NextRequest) => {
    return '/dashboard'
  },
  getDefaultActiveOrgId: (req: NextRequest, user: UserFromToken) => {
    const orgs = user.getOrgs().sort((a, b) => {
        return a.orgName.localeCompare(b.orgName)
    })
    if (orgs.length > 0) {
        return orgs[0].orgId
    } else {
        return undefined
    }
},
});



export const GET = routeHandlers.getRouteHandler
export const POST = routeHandlers.postRouteHandler
