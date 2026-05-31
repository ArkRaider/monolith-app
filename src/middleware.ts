import { clerkMiddleware, createRouteMatcher, clerkClient } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

const isDeveloperRoute = createRouteMatcher(["/admin(.*)", "/api/admin(.*)"]);
const isProtectedRoute = createRouteMatcher(["/dashboard(.*)", "/room(.*)"]);

export default clerkMiddleware(async (auth, req) => {
  // 1. Protect Developer Routes
  if (isDeveloperRoute(req)) {
    const authData = await auth();
    if (!authData.userId) {
      return authData.redirectToSignIn();
    }
    
    // Fetch user from Clerk to check metadata directly (bypasses need for custom JWT template)
    const client = await clerkClient();
    const user = await client.users.getUser(authData.userId);
    
    if (user.publicMetadata?.role !== "developer") {
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }
  } 
  // 2. Protect Standard Application Routes
  else if (isProtectedRoute(req)) {
    await auth.protect();
  }
});

export const config = {
  matcher: [
    // Skip Next.js internals and all static files
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Always run for API routes
    "/(api|trpc)(.*)",
  ],
};
