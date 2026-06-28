import { useParams, Link } from "react-router-dom";
import {
  ArrowLeft,
  ExternalLink,
  Calendar,
  Link2,
  Copy,
  MousePointerClick,
  TrendingUp,
} from "lucide-react";
import { useLinks, useLinkStats } from "./useLinks";
import { getQRCodeUrl } from "@/api/links";
import { PageSpinner } from "@/components/ui/Spinner";
import { Badge } from "@/components/ui/Badge";
import { toast } from "@/store/toastStore";
import { formatDate, isExpired } from "@/lib/utils";

export function LinkDetailPage() {
  const { code } = useParams<{ code: string }>();
  const { data: links, isLoading: linksLoading } = useLinks();
  const link = links?.find((l) => l.short_code === code);

  const { data: stats, isLoading: statsLoading } = useLinkStats(link?.id || 0);

  if (linksLoading || (link && statsLoading)) return <PageSpinner />;
  if (!link) {
    return (
      <div className="p-8 text-center">
        <h2 className="text-xl font-semibold text-text-primary">
          Link not found
        </h2>
        <Link
          to="/links"
          className="text-brand-600 hover:underline mt-2 inline-block"
        >
          Back to links
        </Link>
      </div>
    );
  }

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(
        `${window.location.origin}/${link.short_code}`,
      );
      toast.success("Copied to clipboard", `smurl.com/${link.short_code}`);
    } catch {
      toast.error("Failed to copy", "Please try again");
    }
  };

  return (
    <div className="p-4 sm:p-6 max-w-5xl mx-auto">
      <Link
        to="/links"
        className="inline-flex items-center text-sm text-text-muted hover:text-text-primary mb-5 sm:mb-6 "
      >
        <ArrowLeft className="h-4 w-4 mr-1" />
        Back to links
      </Link>

      <div className="bg-surface rounded-xl border border-border shadow-sm p-4 sm:p-6 mb-6 sm:mb-8">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
          <div className="space-y-4 flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-xl sm:text-2xl font-bold text-text-primary tracking-tight">
                smurl.com/{link.short_code}
              </h1>
              {isExpired(link.expires_at) ? (
                <Badge variant="muted">Expired</Badge>
              ) : (
                <Badge variant="success">Active</Badge>
              )}
            </div>

            <a
              href={link.original_url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center text-sm text-text-secondary hover:text-text-primary max-w-full group"
            >
              <Link2 className="h-4 w-4 mr-2 shrink-0 text-text-muted group-hover:text-text-primary" />
              <span className="truncate">{link.original_url}</span>
              <ExternalLink className="h-3 w-3 ml-1.5 shrink-0 opacity-0 group-hover:opacity-100 " />
            </a>

            <div className="flex flex-wrap items-center gap-3 sm:gap-4 text-sm text-text-muted pt-2">
              <div className="flex items-center">
                <Calendar className="h-4 w-4 mr-1.5" />
                Created {formatDate(link.created_at)}
              </div>
              {link.expires_at && (
                <div className="flex items-center text-amber-600 dark:text-amber-400">
                  <Calendar className="h-4 w-4 mr-1.5" />
                  Expires {formatDate(link.expires_at)}
                </div>
              )}
            </div>

            <div className="pt-2">
              <button
                onClick={handleCopy}
                className="inline-flex items-center text-sm font-medium text-brand-600 hover:text-brand-700 bg-brand-50 hover:bg-brand-100 dark:bg-brand-900/30 dark:hover:bg-brand-900/50 dark:text-brand-400 px-3 py-1.5 rounded-lg "
              >
                <Copy className="h-4 w-4 mr-1.5" />
                Copy Link
              </button>
            </div>
          </div>

          {/* QR code — centered on mobile, right-aligned on md+ */}
          <div className="shrink-0 self-start mx-auto md:mx-0 p-3 bg-surface-muted rounded-xl border border-border">
            <img
              src={getQRCodeUrl(link.short_code)}
              alt="QR Code"
              className="w-28 h-28 sm:w-32 sm:h-32 rounded-lg bg-white"
            />
          </div>
        </div>
      </div>

      <div className="mb-5 sm:mb-6">
        <h2 className="text-lg font-semibold text-text-primary">Performance</h2>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
        <div className="bg-surface rounded-xl border border-border p-4 sm:p-5 shadow-sm">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-950/40">
              <MousePointerClick className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            <h3 className="text-sm font-medium text-text-secondary">
              Total Clicks
            </h3>
          </div>
          <p className="text-3xl font-bold text-text-primary">
            {stats?.total_clicks || 0}
          </p>
        </div>

        <div className="bg-surface rounded-xl border border-border p-4 sm:p-5 shadow-sm">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 rounded-lg bg-green-50 dark:bg-green-950/40">
              <TrendingUp className="h-5 w-5 text-green-600 dark:text-green-400" />
            </div>
            <h3 className="text-sm font-medium text-text-secondary">
              Clicks Today
            </h3>
          </div>
          <p className="text-3xl font-bold text-text-primary">
            {stats?.daily_clicks || 0}
          </p>
        </div>
      </div>
    </div>
  );
}
