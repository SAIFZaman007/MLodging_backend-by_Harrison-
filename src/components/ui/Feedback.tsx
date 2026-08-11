import type { LucideIcon } from "lucide-react";
import { AlertCircle, Inbox } from "lucide-react";
import type { ReactNode } from "react";

import { statusColor, titleCase } from "@/lib/format";

export function PageHeader({
  breadcrumb,
  title,
  description,
  actions,
}: {
  breadcrumb: string;
  title: string;
  description?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-4">
      <div className="min-w-0">
        <p className="text-xs text-brand-ink/40">{breadcrumb}</p>
        <h1 className="mt-1 font-display text-2xl text-brand-ink sm:text-3xl">{title}</h1>
        {description && (
          <p className="mt-1.5 max-w-2xl text-sm text-brand-ink/50">{description}</p>
        )}
      </div>
      {actions && <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}

export function StatusBadge({ value }: { value: string | null | undefined }) {
  if (!value) return <span className="text-brand-ink/30">—</span>;
  return <span className={`badge ${statusColor(value)}`}>{titleCase(value)}</span>;
}

export function EmptyState({
  icon: Icon = Inbox,
  title,
  description,
  action,
}: {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
      <span className="flex h-11 w-11 items-center justify-center rounded-full bg-brand-cream">
        <Icon className="h-5 w-5 text-brand-forest/45" />
      </span>
      <p className="mt-3 font-display text-base text-brand-ink">{title}</p>
      {description && (
        <p className="mt-1 max-w-sm text-sm text-brand-ink/45">{description}</p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function ErrorState({ message, onRetry }: { message?: string; onRetry?: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-14 text-center">
      <AlertCircle className="h-6 w-6 text-red-500" />
      <p className="mt-3 font-display text-base text-brand-ink">Couldn't load that</p>
      <p className="mt-1 max-w-md text-sm text-brand-ink/50">
        {message ?? "The API didn't respond as expected."}
      </p>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="mt-4 rounded-full border border-brand-forest/20 px-4 py-2 text-sm text-brand-ink/70 transition-colors hover:bg-white"
        >
          Try again
        </button>
      )}
    </div>
  );
}

export function SkeletonRows({ rows = 5, className = "" }: { rows?: number; className?: string }) {
  return (
    <div className={`space-y-2 p-5 ${className}`}>
      {Array.from({ length: rows }).map((_, index) => (
        <div key={index} className="h-11 animate-pulse rounded-lg bg-brand-cream/80" />
      ))}
    </div>
  );
}

export function SkeletonCards({ count = 4, height = "h-28" }: { count?: number; height?: string }) {
  return (
    <>
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className={`card animate-pulse ${height}`} />
      ))}
    </>
  );
}