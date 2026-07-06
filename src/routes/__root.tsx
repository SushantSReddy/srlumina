import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";
import { Toaster } from "sonner";

import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";
import { supabase } from "@/integrations/supabase/client";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <p className="mt-4 text-sm text-muted-foreground">This page doesn't exist.</p>
        <Link to="/" className="mt-6 inline-flex rounded-full bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground">Go home</Link>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  const router = useRouter();
  useEffect(() => { reportLovableError(error, { boundary: "root" }); }, [error]);
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold">Something went wrong</h1>
        <p className="mt-2 text-sm text-muted-foreground">Try refreshing.</p>
        <button
          onClick={() => { router.invalidate(); reset(); }}
          className="mt-6 rounded-full bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground"
        >Try again</button>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1, viewport-fit=cover" },
      { name: "theme-color", content: "#000000" },
      { title: "SR Lumina — JEE & NEET Question Tracker" },
      { name: "description", content: "Track questions solved daily by subject and source. Built for JEE and NEET aspirants." },
      { property: "og:title", content: "SR Lumina — JEE & NEET Question Tracker" },
      { property: "og:description", content: "Track questions solved daily by subject and source. Built for JEE and NEET aspirants." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: "SR Lumina — JEE & NEET Question Tracker" },
      { name: "twitter:description", content: "Track questions solved daily by subject and source. Built for JEE and NEET aspirants." },
      { property: "og:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/2f108d32-0697-497a-8c00-a6801337c0f2/id-preview-2fe6880b--e96ac1dd-237e-4c00-a9f8-866f80ebef24.lovable.app-1783140206298.png" },
      { name: "twitter:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/2f108d32-0697-497a-8c00-a6801337c0f2/id-preview-2fe6880b--e96ac1dd-237e-4c00-a9f8-866f80ebef24.lovable.app-1783140206298.png" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "icon", href: "/favicon.ico", type: "image/x-icon" },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head><HeadContent /></head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  const router = useRouter();

  useEffect(() => {
    // Theme: honor system preference
    const mql = window.matchMedia("(prefers-color-scheme: dark)");
    const apply = () => {
      const stored = localStorage.getItem("theme");
      const dark = stored ? stored === "dark" : mql.matches;
      document.documentElement.classList.toggle("dark", dark);
    };
    apply();
    mql.addEventListener("change", apply);

    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if (event !== "SIGNED_IN" && event !== "SIGNED_OUT" && event !== "USER_UPDATED") return;
      router.invalidate();
      if (event !== "SIGNED_OUT") queryClient.invalidateQueries();
      if (event === "SIGNED_IN" && session?.user) {
        const key = `login-logged-${session.user.id}-${new Date().toDateString()}`;
        if (!sessionStorage.getItem(key)) {
          sessionStorage.setItem(key, "1");
          supabase.from("login_events").insert({
            user_id: session.user.id,
            email: session.user.email ?? null,
            user_agent: navigator.userAgent,
          }).then(() => {});
        }
      }
    });
    return () => {
      mql.removeEventListener("change", apply);
      sub.subscription.unsubscribe();
    };
  }, [router, queryClient]);

  return (
    <QueryClientProvider client={queryClient}>
      <Outlet />
      <Toaster position="top-center" richColors closeButton />
    </QueryClientProvider>
  );
}
