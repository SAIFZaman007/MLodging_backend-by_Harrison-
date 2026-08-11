import { useState, type ReactNode } from "react";
import { Menu } from "lucide-react";

import { Sidebar } from "@/components/Sidebar";

/**
 * The shell that fixes the scrolling sidebar.
 *
 * The bug: the old layout used `min-h-screen` on the wrapper and `h-screen` on
 * the sidebar. Because the wrapper could grow past the viewport, the *document*
 * scrolled — taking the sidebar with it. `overflow-y-auto` on <main> did nothing
 * because <main> had no bounded height to overflow.
 *
 * The fix: pin the wrapper to exactly one viewport (`h-dvh`) and forbid it from
 * scrolling. That makes <main> the only scroll container on the page, so the
 * sidebar is structurally immovable rather than being held in place by
 * `position: fixed` (which would break the flex flow and need magic margins).
 *
 * `h-dvh` over `h-screen` handles mobile browser chrome collapsing correctly.
 */
export function AdminLayout({ children }: { children: ReactNode }) {
  // The drawer closes from Sidebar's onNavigate callback rather than from an
  // effect watching the route — the click already knows navigation happened, so
  // syncing state in an effect would just be a slower way to learn the same thing.
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  return (
    <div className="flex h-dvh overflow-hidden bg-brand-cream">
      {/* Desktop: permanent rail. */}
      <div className="hidden lg:flex">
        <Sidebar />
      </div>

      {/* Mobile: overlay drawer. */}
      {mobileNavOpen && (
        <div className="fixed inset-0 z-80 flex lg:hidden">
          <div
            className="absolute inset-0 animate-fade-in bg-brand-ink/50"
            onClick={() => setMobileNavOpen(false)}
            aria-hidden="true"
          />
          <div className="relative animate-rise-in">
            <Sidebar onNavigate={() => setMobileNavOpen(false)} />
          </div>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex shrink-0 items-center gap-3 border-b border-brand-forest/8 bg-brand-cream/90 px-4 py-3 backdrop-blur-sm lg:hidden">
          <button
            type="button"
            onClick={() => setMobileNavOpen(true)}
            aria-label="Open navigation"
            className="rounded-lg p-2 text-brand-ink/70 transition-colors hover:bg-white"
          >
            <Menu className="h-5 w-5" />
          </button>
          <span className="font-display text-sm text-brand-ink">8888 Augusta</span>
        </header>

        {/* The one and only scroll container. */}
        <main className="scroll-slim flex-1 overflow-y-auto">
          <div className="mx-auto w-full max-w-[1600px] px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}