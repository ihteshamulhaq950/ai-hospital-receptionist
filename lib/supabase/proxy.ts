import { createClient } from "./server";
import { NextResponse, type NextRequest } from "next/server";


export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const pathname = request.nextUrl.pathname;

  const isProtected = 
    pathname.startsWith('/dashboard') ||
    pathname.startsWith('/api')

  // With Fluid compute, don't put this client in a global environment
  // variable. Always create a new one on each request.
  const supabase = await createClient()

  // Do not run code between createServerClient and
  // supabase.auth.getClaims(). A simple mistake could make it very hard to debug
  
  const { data } = await supabase.auth.getClaims()

  const user = data?.claims

  console.log("✅ Proxy user claims:", user)

  if (
    isProtected && 
    !user
  ) {
    // no user, potentially respond by redirecting the user to the login page
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}
