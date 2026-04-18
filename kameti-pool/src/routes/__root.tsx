import { Outlet, Link, createRootRoute, HeadContent, Scripts } from "@tanstack/react-router";
import { Toaster } from "@/components/ui/sonner";
import { Wallet, LayoutDashboard, Plus } from "lucide-react";
import { UserSwitcher } from "@/components/UserSwitcher";

import appCss from "../styles.css?url";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">Page not found</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "Kameti — Premium Digital ROSCA & BC Platform" },
      {
        name: "description",
        content:
          "Kameti is a sleek, secure digital ROSCA platform. Create, join and manage committees (BC) with transparent payouts and real-time tracking.",
      },
      { name: "author", content: "Kameti" },
      { property: "og:title", content: "Kameti — Premium Digital ROSCA Platform" },
      {
        property: "og:description",
        content: "Sleek, secure digital committees with transparent payouts.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      {
        rel: "preconnect",
        href: "https://fonts.googleapis.com",
      },
      {
        rel: "preconnect",
        href: "https://fonts.gstatic.com",
        crossOrigin: "anonymous",
      },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap",
      },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
});

function RootShell({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-40 border-b border-border/60 glass">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-emerald transition-transform group-hover:scale-105">
              <Wallet className="h-5 w-5" />
            </div>
            <div className="flex flex-col leading-none">
              <span className="text-base font-bold tracking-tight">Kameti</span>
              <span className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground">
                Digital ROSCA
              </span>
            </div>
          </Link>

          <nav className="hidden items-center gap-1 sm:flex">
            <Link
              to="/"
              activeOptions={{ exact: true }}
              activeProps={{ className: "bg-secondary text-foreground" }}
              className="inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
            >
              <LayoutDashboard className="h-4 w-4" />
              Dashboard
            </Link>
            <Link
              to="/create"
              activeProps={{ className: "bg-secondary text-foreground" }}
              className="inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
            >
              <Plus className="h-4 w-4" />
              New Kameti
            </Link>
          </nav>

          <div className="flex items-center gap-3">
            <div className="hidden items-center gap-2 rounded-full border border-border/60 bg-card/60 px-3 py-1.5 sm:flex">
              <span className="h-2 w-2 rounded-full bg-primary shadow-emerald" />
              <span className="text-xs font-medium text-muted-foreground">Verified</span>
            </div>
            <UserSwitcher />
          </div>
        </div>
      </header>

      <main>
        <Outlet />
      </main>

      <Toaster />
    </div>
  );
}
