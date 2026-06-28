import { useState, useMemo } from "react";
import type React from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Cell,
  PieChart,
  Pie,
} from "recharts";
import {
  BarChart2,
  Globe,
  Smartphone,
  Monitor,
  Tablet,
  MousePointerClick,
  TrendingUp,
  AlertCircle,
} from "lucide-react";
import {
  useLinks,
  useLinkStats,
  useLinkTimeline,
  useLinkDevices,
} from "@/features/links/useLinks";
import { PageSpinner } from "@/components/ui/Spinner";
import { EmptyState } from "@/components/ui/EmptyState";
import { useTheme } from "@/lib/theme";

const DAYS_OPTIONS = [7, 14, 30] as const;
type DaysOption = (typeof DAYS_OPTIONS)[number];

const DEVICE_COLORS: Record<string, string> = {
  desktop: "#7c3aed",
  mobile: "#06b6d4",
  tablet: "#f59e0b",
  unknown: "#9ca3af",
};

const DEVICE_ICONS: Record<string, React.ReactNode> = {
  desktop: <Monitor className="h-4 w-4" />,
  mobile: <Smartphone className="h-4 w-4" />,
  tablet: <Tablet className="h-4 w-4" />,
};

function ErrorBanner({ message }: { message: string }) {
  return (
    <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950/40 px-4 py-3 text-sm text-red-700 dark:text-red-400">
      <AlertCircle className="h-4 w-4 shrink-0" />
      {message}
    </div>
  );
}

function SectionSkeleton({ height = "h-64" }: { height?: string }) {
  return (
    <div className={`${height} animate-pulse rounded-xl bg-surface-muted`} />
  );
}

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-border bg-surface px-3 py-2 shadow-md text-sm">
      <p className="font-medium text-text-primary mb-1">{label}</p>
      <p className="text-brand-600 dark:text-brand-400 font-semibold">
        {payload[0].value} clicks
      </p>
    </div>
  );
}

export function AnalyticsPage() {
  const { theme } = useTheme();
  const isDark = theme === "dark";

  const { data: links, isLoading: linksLoading } = useLinks();
  const [selectedLinkId, setSelectedLinkId] = useState<number | null>(null);
  const [days, setDays] = useState<DaysOption>(7);

  // Auto-select first link once loaded
  const effectiveId = selectedLinkId ?? links?.[0]?.id ?? 0;
  if (
    links &&
    links.length > 0 &&
    selectedLinkId === null &&
    links[0].id !== effectiveId
  ) {
    setSelectedLinkId(links[0].id);
  }

  const {
    data: stats,
    isLoading: statsLoading,
    isError: statsError,
  } = useLinkStats(effectiveId);
  const {
    data: timeline,
    isLoading: timelineLoading,
    isError: timelineError,
  } = useLinkTimeline(effectiveId, days);
  const {
    data: devices,
    isLoading: devicesLoading,
    isError: devicesError,
  } = useLinkDevices(effectiveId);

  // Build a complete date range for the selected window, filling missing days with 0 clicks
  const fullTimeline = useMemo(() => {
    const result: { date: string; clicks: number }[] = [];
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split("T")[0];
      const found = timeline?.find((t) => t.date === dateStr);
      result.push({ date: dateStr, clicks: found ? Number(found.clicks) : 0 });
    }
    return result;
  }, [timeline, days]);

  // Chart colors adapt to theme
  const chartAxisColor = isDark ? "#6b7280" : "#6b7280";
  const chartGridColor = isDark ? "#374151" : "#f3f4f6";
  const chartAxisLineColor = isDark ? "#374151" : "#e5e7eb";

  if (linksLoading) return <PageSpinner />;

  if (!links || links.length === 0) {
    return (
      <div className="p-4 sm:p-6 max-w-5xl mx-auto h-full flex flex-col justify-center">
        <EmptyState
          icon={BarChart2}
          title="No analytics yet"
          description="Create some links and share them to start seeing analytics data."
        />
      </div>
    );
  }

  const totalDeviceClicks = devices?.reduce((sum, d) => sum + d.clicks, 0) ?? 0;

  return (
    <div className="p-4 sm:p-6 max-w-5xl mx-auto space-y-6 sm:space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-text-primary tracking-tight">
            Analytics
          </h1>
          <p className="text-sm text-text-muted mt-1">
            Deep dive into your link performance
          </p>
        </div>
        <div className="w-full sm:w-64">
          <select
            id="link-selector"
            value={effectiveId}
            onChange={(e) => setSelectedLinkId(Number(e.target.value))}
            className="w-full h-10 px-3 text-sm border border-border rounded-lg bg-surface text-text-primary focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 cursor-pointer "
          >
            {links.map((l) => (
              <option key={l.id} value={l.id}>
                smurl.com/{l.short_code}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
        {statsLoading ? (
          <>
            <SectionSkeleton height="h-28" />
            <SectionSkeleton height="h-28" />
          </>
        ) : statsError ? (
          <div className="sm:col-span-2">
            <ErrorBanner message="Failed to load click statistics." />
          </div>
        ) : (
          <>
            <div className="bg-surface rounded-xl border border-border p-5 sm:p-6 shadow-sm flex items-center gap-4 sm:gap-5">
              <div className="p-3 rounded-xl bg-blue-50 dark:bg-blue-950/40 shrink-0">
                <MousePointerClick className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-text-secondary">
                  Total Clicks
                </p>
                <p className="text-3xl sm:text-4xl font-bold text-text-primary mt-0.5">
                  {stats?.total_clicks ?? 0}
                </p>
              </div>
            </div>
            <div className="bg-surface rounded-xl border border-border p-5 sm:p-6 shadow-sm flex items-center gap-4 sm:gap-5">
              <div className="p-3 rounded-xl bg-green-50 dark:bg-green-950/40 shrink-0">
                <TrendingUp className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-text-secondary">
                  Clicks Today
                </p>
                <p className="text-3xl sm:text-4xl font-bold text-text-primary mt-0.5">
                  {stats?.daily_clicks ?? 0}
                </p>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Click History Timeline */}
      <div className="bg-surface rounded-xl border border-border overflow-hidden shadow-sm">
        <div className="p-4 sm:p-5 border-b border-border flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <h3 className="text-base font-semibold text-text-primary flex items-center gap-2">
            <BarChart2 className="h-4 w-4 text-text-muted" />
            Click History
          </h3>
          <div className="flex items-center gap-1 bg-surface-muted rounded-lg p-1 self-start sm:self-auto">
            {DAYS_OPTIONS.map((d) => (
              <button
                key={d}
                id={`timeline-days-${d}`}
                onClick={() => setDays(d)}
                className={`px-3 py-1 rounded-md text-xs font-medium ${
                  days === d
                    ? "bg-surface text-text-primary shadow-sm border border-border"
                    : "text-text-muted hover:text-text-primary"
                }`}
              >
                {d}d
              </button>
            ))}
          </div>
        </div>

        <div className="px-3 sm:px-5 pb-5 sm:pb-6 pt-3" style={{ height: 272 }}>
          {timelineLoading && !timeline ? (
            <SectionSkeleton height="h-full" />
          ) : timelineError ? (
            <div className="h-full flex items-center justify-center">
              <ErrorBanner message="Failed to load click history." />
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={240}>
              <LineChart
                data={fullTimeline}
                margin={{ top: 8, right: 20, left: -10, bottom: 8 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke={chartGridColor}
                  vertical={false}
                />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 11, fill: chartAxisColor, fontWeight: 500 }}
                  tickLine={false}
                  axisLine={{ stroke: chartAxisLineColor }}
                  tickMargin={8}
                  tickFormatter={(v: string) => {
                    const d = new Date(v + "T00:00:00");
                    return d.toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                    });
                  }}
                  interval={days === 7 ? 0 : days === 14 ? 1 : 4}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: chartAxisColor, fontWeight: 500 }}
                  tickLine={false}
                  axisLine={false}
                  allowDecimals={false}
                  width={32}
                  tickMargin={4}
                />
                <Tooltip content={<CustomTooltip />} />
                <Line
                  type="monotone"
                  dataKey="clicks"
                  stroke="#7c3aed"
                  strokeWidth={2}
                  dot={
                    fullTimeline.length <= 7
                      ? { r: 4, fill: "#7c3aed", strokeWidth: 0 }
                      : false
                  }
                  activeDot={{
                    r: 5,
                    fill: "#7c3aed",
                    strokeWidth: 2,
                    stroke: isDark ? "#3b0764" : "#ede9fe",
                  }}
                  connectNulls
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Bottom row: Top Referrers + Devices */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {/* Referrers — not yet available */}
        <div className="bg-surface rounded-xl border border-border overflow-hidden shadow-sm">
          <div className="p-4 sm:p-5 border-b border-border">
            <h3 className="text-base font-semibold text-text-primary flex items-center gap-2">
              <Globe className="h-4 w-4 text-text-muted" />
              Top Referrers
            </h3>
          </div>
          <div className="h-48 flex flex-col items-center justify-center p-6 text-center">
            <p className="text-sm font-medium text-text-secondary">
              Coming soon
            </p>
            <p className="text-xs text-text-muted mt-1">
              Referrer tracking will be available in a future update.
            </p>
          </div>
        </div>

        {/* Devices */}
        <div className="bg-surface rounded-xl border border-border overflow-hidden shadow-sm">
          <div className="p-4 sm:p-5 border-b border-border">
            <h3 className="text-base font-semibold text-text-primary flex items-center gap-2">
              <Smartphone className="h-4 w-4 text-text-muted" />
              Devices
            </h3>
          </div>

          {devicesLoading ? (
            <div className="p-5 h-48">
              <SectionSkeleton height="h-full" />
            </div>
          ) : devicesError ? (
            <div className="p-5 h-48 flex items-center justify-center">
              <ErrorBanner message="Failed to load device data." />
            </div>
          ) : !devices || devices.length === 0 ? (
            <div className="h-48 flex flex-col items-center justify-center text-center p-6">
              <Monitor className="h-8 w-8 text-text-muted opacity-40 mb-3" />
              <p className="text-sm font-medium text-text-secondary">
                No device data yet
              </p>
            </div>
          ) : (
            <div className="flex items-center gap-4 p-4 sm:p-5">
              {/* Pie chart */}
              <div className="shrink-0">
                <PieChart width={130} height={130}>
                  <Pie
                    data={devices}
                    dataKey="clicks"
                    nameKey="device"
                    cx="50%"
                    cy="50%"
                    innerRadius={34}
                    outerRadius={58}
                    paddingAngle={2}
                    strokeWidth={0}
                  >
                    {devices.map((entry) => (
                      <Cell
                        key={entry.device}
                        fill={DEVICE_COLORS[entry.device] ?? "#9ca3af"}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value) => [`${value} clicks`, ""]}
                    contentStyle={{
                      fontSize: 12,
                      borderRadius: 8,
                      backgroundColor: isDark ? "oklch(18% 0.008 250)" : "#fff",
                      borderColor: isDark ? "oklch(27% 0.01 250)" : "#e5e7eb",
                      color: isDark ? "#f3f4f6" : "#111",
                    }}
                  />
                </PieChart>
              </div>

              {/* Legend list */}
              <div className="flex-1 space-y-2.5">
                {devices.map((d) => {
                  const pct =
                    totalDeviceClicks > 0
                      ? Math.round((d.clicks / totalDeviceClicks) * 100)
                      : 0;
                  const color = DEVICE_COLORS[d.device] ?? "#9ca3af";
                  return (
                    <div key={d.device} className="flex items-center gap-2.5">
                      <div
                        className="h-3 w-3 rounded-sm shrink-0"
                        style={{ backgroundColor: color }}
                      />
                      <span className="text-text-muted">
                        {DEVICE_ICONS[d.device] ?? (
                          <Monitor className="h-4 w-4" />
                        )}
                      </span>
                      <span className="text-sm capitalize text-text-primary flex-1">
                        {d.device}
                      </span>
                      <span className="text-sm font-semibold text-text-primary">
                        {pct}%
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
