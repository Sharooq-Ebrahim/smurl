import { useLinks } from "@/features/links/useLinks";
import { PageSpinner } from "@/components/ui/Spinner";
import { Link } from "react-router-dom";
import {
  ExternalLink,
  Link2,
  MousePointerClick,
  TrendingUp,
} from "lucide-react";

export function DashboardPage() {
  const { data: links, isLoading } = useLinks();

  if (isLoading) return <PageSpinner />;

  const totalLinks = links?.length || 0;
  const activeLinks =
    links?.filter((l) => !l.expires_at || new Date(l.expires_at) > new Date())
      .length || 0;

  return (
    <div className="p-4 sm:p-6 max-w-5xl mx-auto">
      <div className="mb-6 sm:mb-8">
        <h1 className="text-xl sm:text-2xl font-bold text-text-primary tracking-tight">
          Dashboard
        </h1>
        <p className="text-sm text-text-muted mt-1">Overview of your links</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 mb-6 sm:mb-8">
        <div className="bg-surface rounded-xl border border-border p-4 sm:p-5 shadow-sm">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 rounded-lg bg-brand-50 dark:bg-brand-900/30">
              <Link2 className="h-5 w-5 text-brand-600 dark:text-brand-400" />
            </div>
            <h3 className="text-sm font-medium text-text-secondary">
              Total Links
            </h3>
          </div>
          <p className="text-3xl font-bold text-text-primary">{totalLinks}</p>
        </div>
        <div className="bg-surface rounded-xl border border-border p-4 sm:p-5 shadow-sm">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 rounded-lg bg-green-50 dark:bg-green-950/40">
              <TrendingUp className="h-5 w-5 text-green-600 dark:text-green-400" />
            </div>
            <h3 className="text-sm font-medium text-text-secondary">
              Active Links
            </h3>
          </div>
          <p className="text-3xl font-bold text-text-primary">{activeLinks}</p>
        </div>
        <div className="bg-surface rounded-xl border border-border p-4 sm:p-5 shadow-sm">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-950/40">
              <MousePointerClick className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            <h3 className="text-sm font-medium text-text-secondary">
              Total Clicks
            </h3>
          </div>
          <p className="text-3xl font-bold text-text-primary">—</p>
        </div>
      </div>

      <div className="bg-surface rounded-xl border border-border overflow-hidden shadow-sm">
        <div className="border-b border-border px-4 sm:px-5 py-4">
          <h2 className="text-base font-semibold text-text-primary">
            Recent Links
          </h2>
        </div>
        {links && links.length > 0 ? (
          <ul className="divide-y divide-border">
            {links.slice(0, 5).map((link) => (
              <li
                key={link.id}
                className="p-4 sm:p-5 flex items-center justify-between gap-3 hover:bg-surface-muted "
              >
                <div className="min-w-0 flex-1">
                  <Link
                    to={`/links/${link.short_code}`}
                    className="text-sm font-medium text-brand-600 hover:underline flex items-center gap-1.5"
                  >
                    smurl.com/{link.short_code}
                  </Link>
                  <p className="text-xs text-text-muted mt-1 truncate max-w-xs sm:max-w-md">
                    {link.original_url}
                  </p>
                </div>
                <a
                  href={`/${link.short_code}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 text-text-muted hover:text-text-primary hover:bg-surface rounded-md border border-transparent hover:border-border shrink-0"
                >
                  <ExternalLink className="h-4 w-4" />
                </a>
              </li>
            ))}
          </ul>
        ) : (
          <div className="p-8 text-center text-sm text-text-muted">
            No links created yet.
          </div>
        )}
      </div>
    </div>
  );
}
