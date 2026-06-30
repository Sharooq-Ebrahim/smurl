import { useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  ExternalLink,
  Calendar,
  Copy,
  MousePointerClick,
  TrendingUp,
  Edit2,
  Trash2,
  Download,
  Globe,
  BarChart2,
  Power,
  Check,
  Clock,
  Info,
  Settings,
  List,
  FileText,
  Activity,
} from "lucide-react";
import { useLinks, useLinkStats, useDeleteLink, useUpdateLinkStatus } from "./useLinks";
import { getQRCodeUrl } from "@/api/links";
import { PageSpinner } from "@/components/ui/Spinner";
import { Badge } from "@/components/ui/Badge";
import { toast } from "@/store/toastStore";
import { formatDate, isExpired } from "@/lib/utils";
import { EditLinkModal } from "./EditLinkModal";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { getRuntimeConfig } from "@/lib/runtimeConfig";

// ─── small helpers ────────────────────────────────────────────────────────────

function getFaviconUrl(url: string) {
  try {
    const { hostname } = new URL(url);
    return `https://www.google.com/s2/favicons?domain=${hostname}&sz=32`;
  } catch {
    return null;
  }
}

function getHostname(url: string) {
  try {
    return new URL(url).hostname;
  } catch {
    return url;
  }
}

// ─── stat card ────────────────────────────────────────────────────────────────

interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
  iconBg: string;
}

function StatCard({ icon, label, value, iconBg }: StatCardProps) {
  return (
    <div className="bg-surface rounded-xl border border-border p-4 sm:p-5 shadow-sm">
      <div className="flex items-center gap-2.5 mb-3">
        <div className={`p-1.5 rounded-lg ${iconBg}`}>{icon}</div>
        <span className="text-xs font-medium text-text-muted uppercase tracking-wide">
          {label}
        </span>
      </div>
      <p className="text-2xl font-bold text-text-primary">{value}</p>
    </div>
  );
}

// ─── section card ─────────────────────────────────────────────────────────────

interface SectionCardProps {
  title: string;
  description?: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
}

function SectionCard({ title, description, icon, children }: SectionCardProps) {
  return (
    <div className="bg-surface rounded-xl border border-border shadow-sm">
      <div className="px-5 py-3.5 border-b border-border">
        <div className="flex items-center gap-2 mb-0.5">
          {icon && <div className="text-text-secondary">{icon}</div>}
          <h2 className="text-sm font-semibold text-text-primary">{title}</h2>
        </div>
        {description && (
          <p className="text-xs text-text-muted">
            {description}
          </p>
        )}
      </div>
      <div className="p-5">{children}</div>
    </div>
  );
}

// ─── action button ────────────────────────────────────────────────────────────

interface ActionBtnProps {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  danger?: boolean;
  disabled?: boolean;
}

function ActionBtn({ icon, label, onClick, danger, disabled }: ActionBtnProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={[
        "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium border",
        "transition-colors disabled:opacity-50 disabled:cursor-not-allowed",
        danger
          ? "border-red-200 text-red-600 hover:bg-red-50 dark:border-red-900/50 dark:text-red-400 dark:hover:bg-red-950/30"
          : "border-border text-text-secondary hover:bg-surface-muted hover:text-text-primary",
      ].join(" ")}
    >
      {icon}
      {label}
    </button>
  );
}

// ─── main page ────────────────────────────────────────────────────────────────

export function LinkDetailPage() {
  const { code } = useParams<{ code: string }>();
  const navigate = useNavigate();

  const { data: links, isLoading: linksLoading } = useLinks();
  const link = links?.find((l) => l.short_code === code);

  const { data: stats, isLoading: statsLoading } = useLinkStats(link?.id || 0);
  const deleteMutation = useDeleteLink();
  const statusMutation = useUpdateLinkStatus();

  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [notes, setNotes] = useState("");

  // ── loading / not-found ──────────────────────────────────────────────────

  if (linksLoading || (link && statsLoading)) return <PageSpinner />;

  if (!link) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-3">
        <div className="p-3 rounded-xl bg-surface-muted border border-border">
          <Globe className="h-6 w-6 text-text-muted" />
        </div>
        <p className="text-sm font-medium text-text-primary">Link not found</p>
        <Link
          to="/links"
          className="text-sm text-brand-600 hover:text-brand-700 hover:underline"
        >
          ← Back to links
        </Link>
      </div>
    );
  }

  // ── derived values ───────────────────────────────────────────────────────

  const baseUrl = getRuntimeConfig("API_BASE_URL");
  const shortUrl = `${baseUrl}/${link.short_code}`;
  const displayHost = baseUrl.replace(/^https?:\/\//, "");
  const favicon = getFaviconUrl(link.original_url);
  const hostname = getHostname(link.original_url);
  const expired = isExpired(link.expires_at);

  // ── handlers ─────────────────────────────────────────────────────────────

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(shortUrl);
      setCopied(true);
      toast.success("Copied!", shortUrl);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Failed to copy", "Please try again");
    }
  };

  const handleDownloadQR = async () => {
    try {
      const response = await fetch(getQRCodeUrl(link.short_code));
      if (!response.ok) throw new Error("Failed to fetch QR code");
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `qr-${link.short_code}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      toast.error("Download failed", "Could not download the QR code. Please try again.");
    }
  };

  const handleDelete = () => {
    deleteMutation.mutate(link.short_code, {
      onSuccess: () => {
        toast.success("Link deleted", `smurl.com/${link.short_code} removed.`);
        navigate("/links");
      },
      onError: () => toast.error("Failed to delete", "Please try again."),
    });
  };

  const handleToggleStatus = () => {
    const newStatus = !link.is_active;
    statusMutation.mutate(
      { code: link.short_code, data: { is_active: newStatus } },
      {
        onSuccess: () => {
          toast.success(
            newStatus ? "Link activated" : "Link deactivated",
            `smurl.com/${link.short_code} is now ${newStatus ? "active" : "inactive"}.`,
          );
        },
        onError: () => toast.error("Failed to update status", "Please try again."),
      },
    );
  };

  // ── render ────────────────────────────────────────────────────────────────

  return (
    <div className="p-4 sm:p-6 max-w-5xl mx-auto space-y-6">

      {/* Back nav */}
      <Link
        to="/links"
        className="inline-flex items-center text-sm text-text-muted hover:text-text-primary gap-1"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to links
      </Link>

      {/* ── Header card ────────────────────────────────────────────────── */}
      <div className="bg-surface rounded-xl border border-border shadow-sm p-5 sm:p-6">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">

          {/* Left: identity */}
          <div className="flex-1 min-w-0 space-y-4">

            {/* Favicon + short URL + badge */}
            <div className="flex flex-wrap items-center gap-3">
              {favicon && (
                <img
                  src={favicon}
                  alt={hostname}
                  className="w-6 h-6 rounded-sm shrink-0"
                  onError={(e) => (e.currentTarget.style.display = "none")}
                />
              )}
              <h1 className="text-xl sm:text-2xl font-bold text-text-primary tracking-tight font-mono">
                {displayHost}/{link.short_code}
              </h1>
              {expired ? (
                <Badge variant="muted">Expired</Badge>
              ) : link.is_active ? (
                <Badge variant="success">Active</Badge>
              ) : (
                <Badge variant="danger">Inactive</Badge>
              )}
            </div>

            {/* Destination URL */}
            <a
              href={link.original_url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-sm text-text-secondary hover:text-text-primary group max-w-full"
            >
              <Globe className="h-3.5 w-3.5 shrink-0 text-text-muted group-hover:text-text-primary" />
              <span className="truncate">{link.original_url}</span>
              <ExternalLink className="h-3 w-3 shrink-0 opacity-0 group-hover:opacity-100" />
            </a>

            {/* Dates */}
            <div className="flex flex-wrap gap-4 text-xs text-text-muted">
              <span className="flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5" />
                Created {formatDate(link.created_at)}
              </span>
              {link.expires_at && (
                <span className="flex items-center gap-1.5 text-amber-600 dark:text-amber-400">
                  <Clock className="h-3.5 w-3.5" />
                  Expires {formatDate(link.expires_at)}
                </span>
              )}
            </div>

            {/* Action group */}
            <div className="flex flex-wrap gap-2 pt-1">
              <ActionBtn
                icon={
                  copied
                    ? <Check className="h-3.5 w-3.5 text-green-600" />
                    : <Copy className="h-3.5 w-3.5" />
                }
                label={copied ? "Copied!" : "Copy link"}
                onClick={handleCopy}
              />
              <ActionBtn
                icon={<ExternalLink className="h-3.5 w-3.5" />}
                label="Open"
                onClick={() => window.open(shortUrl, "_blank")}
              />
              <ActionBtn
                icon={<Globe className="h-3.5 w-3.5" />}
                label="Destination"
                onClick={() => window.open(link.original_url, "_blank")}
              />
              <ActionBtn
                icon={<Edit2 className="h-3.5 w-3.5" />}
                label="Edit"
                onClick={() => setEditOpen(true)}
              />
              <ActionBtn
                icon={<Trash2 className="h-3.5 w-3.5" />}
                label="Delete"
                onClick={() => setDeleteOpen(true)}
                danger
              />
            </div>
          </div>

          {/* QR Code */}
          <div className="shrink-0 self-start mx-auto md:mx-0 flex flex-col items-center gap-2">
            <div className="p-3 bg-white rounded-xl border border-border shadow-sm">
              <img
                src={getQRCodeUrl(link.short_code)}
                alt="QR Code"
                className="w-28 h-28 sm:w-32 sm:h-32 rounded"
              />
            </div>
            <button
              onClick={handleDownloadQR}
              className="inline-flex items-center gap-1.5 text-xs text-text-muted hover:text-text-primary"
            >
              <Download className="h-3 w-3" />
              Download QR
            </button>
          </div>
        </div>
      </div>

      {/* ── Stats grid ─────────────────────────────────────────────────── */}
      <SectionCard 
        title="Performance"
        description="Overview of link click activity and analytics."
        icon={<Activity className="h-4 w-4" />}
      >
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
          <StatCard
            icon={<MousePointerClick className="h-4 w-4 text-blue-600 dark:text-blue-400" />}
            iconBg="bg-blue-50 dark:bg-blue-950/40"
            label="Total Clicks"
            value={stats?.total_clicks ?? 0}
          />
          <StatCard
            icon={<TrendingUp className="h-4 w-4 text-green-600 dark:text-green-400" />}
            iconBg="bg-green-50 dark:bg-green-950/40"
            label="Today"
            value={stats?.daily_clicks ?? 0}
          />
          <StatCard
            icon={<BarChart2 className="h-4 w-4 text-purple-600 dark:text-purple-400" />}
            iconBg="bg-purple-50 dark:bg-purple-950/40"
            label="Last 7 Days"
            value="—"
          />
          <StatCard
            icon={<Clock className="h-4 w-4 text-orange-600 dark:text-orange-400" />}
            iconBg="bg-orange-50 dark:bg-orange-950/40"
            label="Last Click"
            value="—"
          />
        </div>
        <p className="mt-4 text-xs text-text-muted">
          Full analytics are available on the{" "}
          <Link to="/analytics" className="text-brand-600 hover:underline">
            Analytics page
          </Link>
          .
        </p>
      </SectionCard>

      {/* ── Bottom two-column grid ──────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">



        {/* Advanced info */}
        <SectionCard 
          title="Details"
          description="Advanced configuration and metadata."
          icon={<List className="h-4 w-4" />}
        >
          <dl className="space-y-3 text-sm">
            {[
              { label: "Short Code", value: <span className="font-mono">{link.short_code}</span> },
              { label: "Redirect Type", value: "302 Temporary" },
              {
                label: "Expiration",
                value: link.expires_at
                  ? formatDate(link.expires_at)
                  : <span className="text-text-muted">Never</span>,
              },
              {
                label: "Password",
                value: <span className="text-text-muted">Not set</span>,
              },
              { label: "Last updated", value: formatDate(link.updated_at) },
            ].map(({ label, value }) => (
              <div key={label} className="flex items-center justify-between gap-4">
                <dt className="text-text-muted shrink-0">{label}</dt>
                <dd className="text-text-primary text-right">{value}</dd>
              </div>
            ))}
          </dl>
        </SectionCard>
        {/* ── Notes ──────────────────────────────────────────────────────── */}
        <SectionCard 
          title="Notes"
          description="Internal session notes."
          icon={<FileText className="h-4 w-4" />}
        >
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Add internal notes about this link…"
          rows={3}
          className="w-full resize-none text-sm text-text-primary bg-surface-muted border border-border rounded-lg px-3 py-2.5 placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
        />
        <p className="mt-1.5 text-xs text-text-muted flex items-center gap-1">
          <Info className="h-3 w-3" />
          Notes are saved locally in this session.
        </p>
      </SectionCard>
      </div>

      {/* ── Link Settings ───────────────────────────────────────────────── */}
      <div className="rounded-xl border border-border bg-surface shadow-sm">
        <div className="px-5 py-3.5 border-b border-border">
          <div className="flex items-center gap-2 mb-0.5">
            <Settings className="h-4 w-4 text-text-secondary" />
            <h2 className="text-sm font-semibold text-text-primary">
              Link Settings
            </h2>
          </div>
          <p className="text-xs text-text-muted">
            Manage the configuration and availability of this short link.
          </p>
        </div>
        
        <div className="p-0">
          {/* Link Status Row */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 px-5 py-4 border-b border-border">
            <div className="pr-0 sm:pr-8">
              <h3 className="text-sm font-medium text-text-primary mb-0.5">
                Link Status
              </h3>
              <p className="text-xs text-text-muted">
                Enable or disable this link. Changes take effect immediately.
              </p>
            </div>
            <div className="shrink-0 self-start sm:self-center mt-1 sm:mt-0">
              <button
                role="switch"
                aria-checked={link.is_active}
                disabled={expired || statusMutation.isPending}
                onClick={handleToggleStatus}
                className={[
                  "relative inline-flex h-5 w-9 flex-shrink-0 items-center rounded-full border-2 border-transparent",
                  "transition-colors focus:outline-none focus:ring-2 focus:ring-brand-500/40 focus:ring-offset-1",
                  "disabled:cursor-not-allowed disabled:opacity-40",
                  link.is_active ? "bg-[#16A34A]" : "bg-border dark:bg-border",
                ].join(" ")}
              >
                <span
                  className={[
                    "pointer-events-none inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow ring-0 transition-transform",
                    link.is_active ? "translate-x-4" : "translate-x-0",
                  ].join(" ")}
                />
              </button>
            </div>
          </div>

          {/* Delete Link Row */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 px-5 py-4">
            <div className="pr-0 sm:pr-8">
              <h3 className="text-sm font-medium text-text-primary mb-0.5">
                Delete Link
              </h3>
              <p className="text-xs text-text-muted">
                Permanently remove this link. This action cannot be undone.
              </p>
            </div>
            <div className="shrink-0 self-start sm:self-center mt-1 sm:mt-0">
              <button
                onClick={() => setDeleteOpen(true)}
                className="inline-flex items-center justify-center rounded-lg px-3 py-1.5 text-sm font-medium text-red-600 bg-red-50 hover:bg-red-100 border border-red-200 transition-colors shadow-sm focus:outline-none focus:ring-2 focus:ring-red-500/40 focus:ring-offset-1"
              >
                Delete Link
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ── Modals ─────────────────────────────────────────────────────── */}
      {editOpen && (
        <EditLinkModal
          open={editOpen}
          onClose={() => setEditOpen(false)}
          link={link}
        />
      )}



      <ConfirmDialog
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        onConfirm={handleDelete}
        title="Delete link?"
        description="This will permanently delete the link and all its analytics. This action cannot be undone."
        confirmLabel="Delete"
        loading={deleteMutation.isPending}
      />
    </div>
  );
}
