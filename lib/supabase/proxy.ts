import { createClient } from "./server";
import { NextResponse, type NextRequest } from "next/server";

export async function updateSession(request: NextRequest) {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const user = data?.claims;
  const pathname = request.nextUrl.pathname;

  // 1. Define Route Logic
  const isAdminRoute =
    pathname.startsWith("/dashboard") || pathname.startsWith("/api/dashboard");

  // Specific check: /chat is public, but /chat/[id] or /api/chat requires a user
  const isProtectedChat =
    (pathname.startsWith("/chat/") || pathname.startsWith("/api/chat")) &&
    pathname !== "/chat";

  const isAuthPage = pathname === "/login" || pathname === "/callback";

  // CASE 3: Redirect authenticated users AWAY from Login/Callback
  // if (isAuthPage && user) {
  //   const url = request.nextUrl.clone();
  //   // Non-anonymous (Admin) -> dashboard | Anonymous -> /chat
  //   url.pathname = '/' + (user.is_anonymous ? 'chat' : 'dashboard');
  //   return NextResponse.redirect(url);
  // }
  // CASE 3: Redirect authenticated users AWAY from Login/Callback
  if (isAuthPage && user) {
    const url = request.nextUrl.clone();

    // ✅ Allow anonymous users to stay on login page
    if (user.is_anonymous) {
      return NextResponse.next({ request });
    }

    // Only redirect non-anonymous (authenticated admins)
    url.pathname = "/dashboard";
    return NextResponse.redirect(url);
  }

  // CASE 1: Admin Route Protection (/dashboard and /api/dashboard)
  if (isAdminRoute) {
    // Block if no user OR user is anonymous
    if (!user || user.is_anonymous) {
      const url = request.nextUrl.clone();
      url.pathname = "/login";
      return NextResponse.redirect(url);
    }
  }

  // CASE 2: Protected Chat & API (/chat/[id] or /api/chat)
  // Allows both Admin and Anonymous users
  if (isProtectedChat) {
    if (!user) {
      const url = request.nextUrl.clone();
      url.pathname = "/login";
      return NextResponse.redirect(url);
    }
  }

  // Final Response: Allow /chat (base), /login, and /callback to pass through naturally
  const response = NextResponse.next({ request });
  if (user) {
    response.headers.set("x-user-id", user.sub as string);
  }

  return response;
}
