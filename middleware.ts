import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    const isAdmin = req.nextUrl.pathname.startsWith("/admin");
    const isOwner = req.nextUrl.pathname.startsWith("/owner");
    if (req.nextUrl.pathname === "/owner/signin") {
      return NextResponse.next();
    }
    const user = req.nextauth.token;

    if (!user) {
      if (isOwner) {
        return NextResponse.redirect(new URL("/owner/signin", req.url));
      }
      return NextResponse.redirect(new URL("/api/auth/signin", req.url));
    }

    if (user.status === "SUSPENDED") {
      return NextResponse.redirect(new URL("/", req.url));
    }

    if ((isAdmin || isOwner) && user.role !== "OWNER") {
      return NextResponse.redirect(new URL("/", req.url));
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token }) => Boolean(token),
    },
  }
);

export const config = {
  matcher: ["/admin/:path*", "/dashboard/:path*", "/owner/:path*"],
};
