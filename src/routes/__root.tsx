import { Outlet, Link, createRootRoute, HeadContent, Scripts } from "@tanstack/react-router";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AppStoreProvider } from "@/store/AppStore";
import { AudioProvider } from "@/lib/audio";
import { GlobalAudioToggle } from "@/components/game/GlobalAudioToggle";

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
      { title: "Défi-Bad" },
      { name: "description", content: "Suivi gamifié des compétences badminton en EPS — Cycle 3 et Cycle 4." },
      { name: "author", content: "Défi Badminton" },
      { property: "og:title", content: "Défi-Bad" },
      { property: "og:description", content: "Suivi gamifié des compétences badminton en EPS — Cycle 3 et Cycle 4." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "twitter:site", content: "@Lovable" },
      { name: "twitter:title", content: "Défi-Bad" },
      { name: "twitter:description", content: "Suivi gamifié des compétences badminton en EPS — Cycle 3 et Cycle 4." },
      { property: "og:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/52f80517-0cc8-4e52-81e5-e43da0370b13/id-preview-b07e2869--03823042-a8c7-4930-8c38-d6f3ebf2db45.lovable.app-1777928633584.png" },
      { name: "twitter:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/52f80517-0cc8-4e52-81e5-e43da0370b13/id-preview-b07e2869--03823042-a8c7-4930-8c38-d6f3ebf2db45.lovable.app-1777928633584.png" },
    ],
    links: [
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Lexend:wght@400;500;600;700;800;900&family=Inter:wght@400;500;600;700;800;900&display=swap",
      },
      {
        rel: "stylesheet",
        href: appCss,
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
    <TooltipProvider>
      <AppStoreProvider>
        <AudioProvider>
          <Outlet />
          <GlobalAudioToggle />
          <Toaster />
        </AudioProvider>
      </AppStoreProvider>
    </TooltipProvider>
  );
}
