import type { LucideIcon } from "lucide-react";
import { TrendingDown, TrendingUp } from "lucide-react";

import { formatPct } from "@/lib/format";

export function StatCard({
  label,
  value,
  sublabel,
  icon: Icon,
  changePct,
  invertChange = false,
}: {
  label: string;
  value: string;
  sublabel?: string;
  icon?: LucideIcon;
  /** Period-over-period delta. Omit to hide the trend chip entirely. */
  changePct?: number;
  /** For metrics where "up" is bad (e.g. refunds, outstanding balance). */
  invertChange?: boolean;
}) {
  const hasChange = changePct != null && Number.isFinite(changePct);
  const isUp = hasChange && changePct > 0;
  const isFlat = hasChange && changePct === 0;
  const isGood = invertChange ? !isUp : isUp;

  return (
    <div className="card p-5">
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-brand-ink/45">{label}</p>
        {Icon && <Icon className="h-4 w-4 shrink-0 text-brand-forest/45" />}
      </div>

      <p className="tnum mt-2 font-display text-2xl text-brand-ink">{value}</p>

      <div className="mt-1.5 flex items-center gap-2">
        {hasChange && !isFlat && (
          <span
            className={`inline-flex items-center gap-1 text-xs font-semibold ${
              isGood ? "text-green-700" : "text-red-600"
            }`}
          >
            {isUp ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
            {formatPct(changePct)}
          </span>
        )}
        {sublabel && <span className="text-xs text-brand-ink/45">{sublabel}</span>}
      </div>
    </div>
  );
}