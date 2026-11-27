import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Canada Civ is a separate static deployment. Serve it at /canada-civ
// (a path, like /fintech-investors-map) by proxying to that deployment.
// A trailing slash is required so relative CSS, JS, and data URLs resolve
// under /canada-civ/ rather than the site root. This file handles the
// slash-less redirect and the rewrite so Next.js does not strip the slash.
const PREFIX = "/canada-civ";
const ORIGIN = "https://canada-civ.vercel.app";

export function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;

  if (pathname === PREFIX) {
    const url = request.nextUrl.clone();
    url.pathname = `${PREFIX}/`;
    return NextResponse.redirect(url, 308);
  }

  if (pathname.startsWith(`${PREFIX}/`)) {
    return NextResponse.rewrite(new URL(`${pathname.slice(PREFIX.length)}${search}`, ORIGIN));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/canada-civ", "/canada-civ/:path*"],
};
