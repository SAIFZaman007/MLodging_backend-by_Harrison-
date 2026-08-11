import type { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { Loader2 } from "lucide-react";

import { useAuth } from "@/context/AuthContext";

export function ProtectedRoute({ children }: { children: ReactNode }) {
  const { user, isLoading } = useAuth();

  // Held until the session bootstrap resolves — redirecting first would bounce
  // an already-signed-in operator to /login on every hard refresh.
  if (isLoading) {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center gap-3 bg-brand-cream text-brand-ink/40">
        <Loader2 className="h-5 w-5 animate-spin" />
        <p className="text-sm">Loading console…</p>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}