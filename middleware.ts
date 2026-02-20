import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import type { UserRole } from "@/types";

const protectedRouteRules: Array<{ prefix: string; roles: UserRole[] }> = [
  { prefix: "/restaurant", roles: ["restaurant"] },
  { prefix: "/ngo", roles: ["ngo"] },
  { prefix: "/admin", roles: ["admin"] },
];

function getDashboardByRole(role: UserRole): string {
  if (role === "restaurant") {
    return "/restaurant/dashboard";
  }

  if (role === "ngo") {
    return "/ngo/dashboard";
  }

  return "/admin";
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const session = request.cookies.get("fb_session")?.value;
  const role = request.cookies.get("fb_role")?.value as UserRole | undefined;

  const matchingProtectedRule = protectedRouteRules.find((rule) =>
    pathname.startsWith(rule.prefix),
  );

  if (matchingProtectedRule && (!session || !role)) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if (matchingProtectedRule && role && !matchingProtectedRule.roles.includes(role)) {
    return NextResponse.redirect(new URL("/unauthorized", request.url));
  }

  if (["/login", "/register"].includes(pathname) && session && role) {
    return NextResponse.redirect(new URL(getDashboardByRole(role), request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico).*)",
  ],
};
