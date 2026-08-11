import { useState } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ComposedChart,
  Legend,
  Line,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  BedDouble,
  CalendarCheck,
  DollarSign,
  Home,
  MessageSquareText,
  RefreshCw,
  Wallet,
} from "lucide-react";
import { Link } from "react-router-dom";

import { useDashboardOverview } from "@/hooks/useAdminData";
import { StatCard } from "@/components/StatCard";
import { Button } from "@/components/ui/Button";
import { EmptyState, ErrorState, PageHeader, SkeletonCards, StatusBadge } from "@/components/ui/Feedback";
import {
  CHART_COLORS,
  eventLabel,
  formatDateTime,
  formatUsd,
  formatUsdCompact,
} from "@/lib/format";

const RANGE_OPTIONS = [
  { months: 6, label: "6M" },
  { months: 12, label: "12M" },
  { months: 24, label: "24M" },
];

const AXIS_TICK = { fontSize: 11, fill: "#16201c99" };
const GRID_STROKE = "#e5e0d3";

const TOOLTIP_STYLE = {
  borderRadius: 12,
  border: "1px solid rgba(14,59,44,0.12)",
  boxShadow: "0 8px 24px -12px rgba(14,59,44,0.3)",
  fontSize: 12,
};

function ChartCard({
  title,
  hint,
  isEmpty,
  emptyLabel,
  children,
}: {
  title: string;
  hint?: string;
  isEmpty?: boolean;
  emptyLabel?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="card">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="font-display text-lg text-brand-ink">{title}</h2>
        {hint && <span className="text-xs text-brand-ink/40">{hint}</span>}
      </div>
      {isEmpty ? (
        <p className="py-16 text-center text-sm text-brand-ink/40">
          {emptyLabel ?? "Nothing to chart yet."}
        </p>
      ) : (
        <div className="mt-4 h-64">{children}</div>
      )}
    </div>
  );
}

export function Dashboard() {
  const [months, setMonths] = useState(12);
  const { data, isLoading, isError, error, refetch, isFetching } = useDashboardOverview(months);

  const stats = data?.stats;
  const noActivity = Boolean(stats && stats.total_orders === 0 && stats.total_bookings === 0);

  return (
    <div className="space-y-6">
      <PageHeader
        breadcrumb="Manage · Dashboard"
        title="Dashboard"
        description="Revenue, occupancy, and demand across the whole portfolio."
        actions={
          <>
            <div className="flex rounded-full border border-brand-forest/15 bg-white p-0.5">
              {RANGE_OPTIONS.map((option) => (
                <button
                  key={option.months}
                  type="button"
                  onClick={() => setMonths(option.months)}
                  className={`rounded-full px-3.5 py-1.5 text-xs font-semibold transition-colors ${
                    months === option.months
                      ? "bg-brand-forest text-brand-cream"
                      : "text-brand-ink/55 hover:text-brand-ink"
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
            <Button onClick={() => refetch()} disabled={isFetching}>
              <RefreshCw className={`h-3.5 w-3.5 ${isFetching ? "animate-spin" : ""}`} />
              Refresh
            </Button>
          </>
        }
      />

      {isError && (
        <div className="card-flush">
          <ErrorState message={(error as Error)?.message} onRetry={() => refetch()} />
        </div>
      )}

      {isLoading && (
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-3 xl:grid-cols-6">
          <SkeletonCards count={6} height="h-28" />
        </div>
      )}

      {stats && (
        <>
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-3 xl:grid-cols-6">
            <StatCard
              label="Net collected"
              value={formatUsd(stats.net_collected_cents)}
              icon={DollarSign}
              changePct={stats.revenue_change_pct}
              sublabel="vs prior 30d"
            />
            <StatCard
              label="Orders"
              value={String(stats.total_orders)}
              icon={CalendarCheck}
              changePct={stats.orders_change_pct}
              sublabel="vs prior 30d"
            />
            <StatCard
              label="Outstanding"
              value={formatUsd(stats.outstanding_balance_cents)}
              icon={Wallet}
              sublabel="Awaiting payment"
            />
            <StatCard
              label="Occupancy"
              value={`${stats.occupancy_next_30_pct}%`}
              icon={BedDouble}
              sublabel="Next 30 days"
            />
            <StatCard
              label="Properties"
              value={String(stats.total_properties)}
              icon={Home}
              sublabel={`${stats.published_properties} published`}
            />
            <StatCard
              label="New inquiries"
              value={String(stats.total_inquiries_new)}
              icon={MessageSquareText}
              sublabel={`${stats.total_inquiries} all time`}
            />
          </div>

          {noActivity && (
            <div className="card-flush">
              <EmptyState
                title="No activity yet"
                description="The portfolio is loaded but there are no orders or bookings to chart. Run the demo seeder to populate the console with a full year of realistic activity."
                action={
                  <code className="rounded-lg bg-brand-cream px-3 py-2 text-xs text-brand-ink/70">
                    python -m app.seed.demo
                  </code>
                }
              />
            </div>
          )}

          <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
            <div className="xl:col-span-2">
              <ChartCard
                title="Revenue &amp; order volume"
                hint="collected, net of refunds"
                isEmpty={stats.timeseries.every((p) => p.revenue_cents === 0 && p.orders === 0)}
              >
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={stats.timeseries} margin={{ left: 4, right: 4, top: 8 }}>
                    <defs>
                      <linearGradient id="revenueFill" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#0e3b2c" stopOpacity={0.28} />
                        <stop offset="100%" stopColor="#0e3b2c" stopOpacity={0.02} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke={GRID_STROKE} vertical={false} />
                    <XAxis dataKey="label" tick={AXIS_TICK} tickLine={false} axisLine={false} />
                    <YAxis
                      yAxisId="money"
                      tick={AXIS_TICK}
                      tickLine={false}
                      axisLine={false}
                      width={54}
                      tickFormatter={(value: number) => formatUsdCompact(value)}
                    />
                    <YAxis
                      yAxisId="count"
                      orientation="right"
                      tick={AXIS_TICK}
                      tickLine={false}
                      axisLine={false}
                      width={34}
                    />
                    <Tooltip
                      contentStyle={TOOLTIP_STYLE}
                      formatter={(value: unknown, name: unknown) =>
                        name === "Revenue" ? formatUsd(Number(value)) : String(value)
                      }
                    />
                    <Legend iconType="circle" wrapperStyle={{ fontSize: 12 }} />
                    <Area
                      yAxisId="money"
                      type="monotone"
                      dataKey="revenue_cents"
                      name="Revenue"
                      stroke="#0e3b2c"
                      strokeWidth={2}
                      fill="url(#revenueFill)"
                    />
                    <Line
                      yAxisId="count"
                      type="monotone"
                      dataKey="orders"
                      name="Orders"
                      stroke="#c8a34d"
                      strokeWidth={2}
                      dot={false}
                    />
                  </ComposedChart>
                </ResponsiveContainer>
              </ChartCard>
            </div>

            <ChartCard
              title="Revenue by event"
              hint="all time"
              isEmpty={stats.by_event.length === 0}
            >
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={stats.by_event}
                  layout="vertical"
                  margin={{ left: 8, right: 12, top: 4 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke={GRID_STROKE} horizontal={false} />
                  <XAxis
                    type="number"
                    tick={AXIS_TICK}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(value: number) => formatUsdCompact(value)}
                  />
                  <YAxis
                    type="category"
                    dataKey="event_week"
                    tick={AXIS_TICK}
                    tickLine={false}
                    axisLine={false}
                    width={86}
                    tickFormatter={(value: string) => eventLabel(value)}
                  />
                  <Tooltip
                    contentStyle={TOOLTIP_STYLE}
                    formatter={(value: unknown) => formatUsd(Number(value))}
                    labelFormatter={(label: unknown) => eventLabel(String(label))}
                  />
                  <Bar dataKey="collected_cents" name="Collected" radius={[0, 6, 6, 0]}>
                    {stats.by_event.map((entry, index) => (
                      <Cell
                        key={entry.event_week}
                        fill={CHART_COLORS[index % CHART_COLORS.length]}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>
          </div>

          <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
            <div className="xl:col-span-2">
              <ChartCard
                title="Occupancy by month"
                hint="booked nights ÷ published homes"
                isEmpty={stats.occupancy_by_month.every((p) => p.nights_booked === 0)}
              >
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={stats.occupancy_by_month} margin={{ left: 4, right: 4, top: 8 }}>
                    <defs>
                      <linearGradient id="occupancyFill" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#c8a34d" stopOpacity={0.4} />
                        <stop offset="100%" stopColor="#c8a34d" stopOpacity={0.03} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke={GRID_STROKE} vertical={false} />
                    <XAxis dataKey="label" tick={AXIS_TICK} tickLine={false} axisLine={false} />
                    <YAxis
                      tick={AXIS_TICK}
                      tickLine={false}
                      axisLine={false}
                      width={40}
                      unit="%"
                    />
                    <Tooltip
                      contentStyle={TOOLTIP_STYLE}
                      formatter={(value: unknown) => `${Number(value)}%`}
                    />
                    <Area
                      type="monotone"
                      dataKey="occupancy_pct"
                      name="Occupancy"
                      stroke="#c8a34d"
                      strokeWidth={2}
                      fill="url(#occupancyFill)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </ChartCard>
            </div>

            <ChartCard
              title="Booking channels"
              hint="active holds"
              isEmpty={stats.bookings_by_source.length === 0}
            >
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={stats.bookings_by_source}
                    dataKey="count"
                    nameKey="label"
                    innerRadius="52%"
                    outerRadius="78%"
                    paddingAngle={2}
                    stroke="none"
                  >
                    {stats.bookings_by_source.map((entry, index) => (
                      <Cell key={entry.key} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={TOOLTIP_STYLE} />
                  <Legend iconType="circle" wrapperStyle={{ fontSize: 12 }} />
                </PieChart>
              </ResponsiveContainer>
            </ChartCard>
          </div>

          <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
            <ChartCard
              title="Order status"
              hint={`${stats.total_orders} total`}
              isEmpty={stats.orders_by_status.length === 0}
            >
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats.orders_by_status} margin={{ left: 4, right: 4, top: 8 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={GRID_STROKE} vertical={false} />
                  <XAxis
                    dataKey="label"
                    tick={{ ...AXIS_TICK, fontSize: 10 }}
                    tickLine={false}
                    axisLine={false}
                    interval={0}
                    angle={-30}
                    textAnchor="end"
                    height={58}
                  />
                  <YAxis tick={AXIS_TICK} tickLine={false} axisLine={false} width={30} />
                  <Tooltip contentStyle={TOOLTIP_STYLE} />
                  <Bar dataKey="count" name="Orders" radius={[6, 6, 0, 0]}>
                    {stats.orders_by_status.map((entry, index) => (
                      <Cell key={entry.key} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>

            <ChartCard
              title="Lead funnel"
              hint={`${stats.total_inquiries} inquiries`}
              isEmpty={stats.inquiries_by_status.every((s) => s.count === 0)}
            >
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={stats.inquiries_by_status}
                  layout="vertical"
                  margin={{ left: 8, right: 12, top: 4 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke={GRID_STROKE} horizontal={false} />
                  <XAxis type="number" tick={AXIS_TICK} tickLine={false} axisLine={false} />
                  <YAxis
                    type="category"
                    dataKey="label"
                    tick={AXIS_TICK}
                    tickLine={false}
                    axisLine={false}
                    width={80}
                  />
                  <Tooltip contentStyle={TOOLTIP_STYLE} />
                  <Bar dataKey="count" name="Leads" radius={[0, 6, 6, 0]}>
                    {stats.inquiries_by_status.map((entry, index) => (
                      <Cell key={entry.key} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>

            <ChartCard
              title="Demand signal"
              hint="bookings vs inquiries"
              isEmpty={stats.timeseries.every((p) => p.bookings === 0 && p.inquiries === 0)}
            >
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={stats.timeseries} margin={{ left: 4, right: 4, top: 8 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={GRID_STROKE} vertical={false} />
                  <XAxis dataKey="label" tick={AXIS_TICK} tickLine={false} axisLine={false} />
                  <YAxis tick={AXIS_TICK} tickLine={false} axisLine={false} width={30} />
                  <Tooltip contentStyle={TOOLTIP_STYLE} />
                  <Legend iconType="circle" wrapperStyle={{ fontSize: 12 }} />
                  <Bar dataKey="bookings" name="Bookings" fill="#0e3b2c" radius={[4, 4, 0, 0]} />
                  <Line
                    type="monotone"
                    dataKey="inquiries"
                    name="Inquiries"
                    stroke="#d4607a"
                    strokeWidth={2}
                    dot={false}
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </ChartCard>
          </div>

          <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
            <div className="card xl:col-span-2">
              <div className="flex items-baseline justify-between">
                <h2 className="font-display text-lg text-brand-ink">Top performing homes</h2>
                <Link to="/properties" className="text-xs text-brand-forest hover:underline">
                  All properties
                </Link>
              </div>
              {stats.by_property.length === 0 ? (
                <p className="py-12 text-center text-sm text-brand-ink/40">No revenue yet.</p>
              ) : (
                <div className="mt-3 overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-brand-forest/10">
                        <th className="th">Property</th>
                        <th className="th text-right">Bookings</th>
                        <th className="th text-right">Orders</th>
                        <th className="th text-right">Collected</th>
                      </tr>
                    </thead>
                    <tbody>
                      {stats.by_property.map((row) => (
                        <tr key={row.property_slug} className="row">
                          <td className="td text-brand-ink">{row.property_address}</td>
                          <td className="td tnum text-right">{row.bookings}</td>
                          <td className="td tnum text-right">{row.orders}</td>
                          <td className="td tnum text-right font-medium text-brand-ink">
                            {formatUsd(row.collected_cents)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            <div className="card">
              <div className="flex items-baseline justify-between">
                <h2 className="font-display text-lg text-brand-ink">Recent orders</h2>
                <Link to="/orders" className="text-xs text-brand-forest hover:underline">
                  View all
                </Link>
              </div>
              {data.recent_orders.length === 0 ? (
                <p className="py-12 text-center text-sm text-brand-ink/40">No orders yet.</p>
              ) : (
                <ul className="mt-3 divide-y divide-brand-forest/5">
                  {data.recent_orders.map((order) => (
                    <li key={order.id} className="flex items-center justify-between gap-3 py-3">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-brand-ink">
                          {order.customer_name}
                        </p>
                        <p className="text-xs text-brand-ink/45">{order.invoice_number}</p>
                      </div>
                      <div className="shrink-0 text-right">
                        <p className="tnum text-sm font-medium text-brand-ink">
                          {formatUsd(order.amount_cents)}
                        </p>
                        <StatusBadge value={order.status} />
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          <p className="text-right text-xs text-brand-ink/30">
            Last updated {formatDateTime(data.generated_at)}
          </p>
        </>
      )}
    </div>
  );
}