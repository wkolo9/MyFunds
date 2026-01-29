import { defineMiddleware } from "astro:middleware";
import { createSupabaseServerInstance } from "../db/supabase.client";

// Polyfill MessageChannel for Cloudflare Workers if missing
// This fixes issues with libraries (like certain fetch polyfills or testing libs) that expect it
if (typeof globalThis.MessageChannel === "undefined") {
  // @ts-expect-error - Minimal polyfill for environment compatibility
  globalThis.c = class MessageChannel {
    port1: MessagePort;
    port2: MessagePort;
    constructor() {
      // Mock ports with minimal necessary API
      const createPort = () => ({
        onmessage: null,
        onmessageerror: null,
        postMessage: () => {
          // No-op for mock
        },
        start: () => {
          // No-op for mock
        },
        close: () => {
          // No-op for mock
        },
        addEventListener: () => {
          // No-op for mock
        },
        removeEventListener: () => {
          // No-op for mock
        },
        dispatchEvent: () => true,
      });
      // @ts-expect-error - Mocking internal types
      this.port1 = createPort();
      // @ts-expect-error - Mocking internal types
      this.port2 = createPort();
    }
  };
}

// Public paths - Auth API endpoints & Server-Rendered Astro Pages
const PUBLIC_PATHS = [
  // Server-Rendered Astro Pages
  "/auth/login",
  "/auth/register",
  "/auth/reset-password",
  "/auth/forgot-password",
  "/auth/callback",
  // Auth API endpoints
  "/api/auth/login",
  "/api/auth/register",
  "/api/auth/reset-password",
  "/api/auth/logout",
];

export const onRequest = defineMiddleware(async ({ locals, cookies, url, request, redirect }, next) => {
  // Create Supabase server instance
  const supabase = createSupabaseServerInstance({
    cookies,
    headers: request.headers,
  });

  // Make supabase available in locals
  locals.supabase = supabase;

  // Check auth status
  // IMPORTANT: Always get user session first before any other operations
  // Using getUser() instead of getSession() as it's more secure for server-side
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    locals.user = {
      email: user.email,
      id: user.id,
    };
  }

  // Protect routes
  // If user is NOT logged in and tries to access a protected route
  if (!user && !PUBLIC_PATHS.includes(url.pathname) && !url.pathname.startsWith("/api/market")) {
    // Allow market API for now if needed publicly, or add to PUBLIC_PATHS if specific
    // Assuming all non-auth pages are protected except maybe landing page if it exists?
    // Spec says: "Redirect to /auth/login for not logged in users" for Layout.astro
    // If root "/" is portfolio, it should be protected.

    // Additional check: maybe some assets are public?
    if (url.pathname.startsWith("/_image") || url.pathname.startsWith("/favicon.png")) {
      return next();
    }

    return redirect("/auth/login");
  }

  // If user IS logged in and tries to access auth pages (login/register), redirect to home
  if (user && (url.pathname === "/auth/login" || url.pathname === "/auth/register")) {
    return redirect("/");
  }

  return next();
});
