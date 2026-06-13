import { clerkMiddleware } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { clerkEnabled } from "@/lib/clerk";

// When Clerk is configured, attach its auth context to every matched
// request (route protection itself is enforced server-side via
// requireSession()). Without keys, fall back to a no-op passthrough so the
// app runs in dev-no-auth / unauthenticated mode.
const passthrough = () => NextResponse.next();

export default clerkEnabled ? clerkMiddleware() : passthrough;

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)",
    "/(api|trpc)(.*)",
  ],
};
