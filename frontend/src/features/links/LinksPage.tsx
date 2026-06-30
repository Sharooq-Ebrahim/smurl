import { useState } from "react";
import { Link } from "react-router-dom";
import { Plus, Search, Copy, QrCode, Edit2, Trash2, Link2 } from "lucide-react";
import { useLinks, useDeleteLink, useUpdateLinkStatus } from "./useLinks";
import { getQRCodeUrl } from "@/api/links";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { PageSpinner } from "@/components/ui/Spinner";
import { CreateLinkModal } from "./CreateLinkModal";
import { EditLinkModal } from "./EditLinkModal";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { Modal } from "@/components/ui/Modal";
import { EmptyState } from "@/components/ui/EmptyState";
import { toast } from "@/store/toastStore";
import { formatDate, isExpired } from "@/lib/utils";
import { getRuntimeConfig } from "@/lib/runtimeConfig";
import type { ShortLink } from "@/types";

export function LinksPage() {
  const { data: links, isLoading } = useLinks();
  const deleteMutation = useDeleteLink();
  const statusMutation = useUpdateLinkStatus();
  const [search, setSearch] = useState("");
  const [pendingStatusCode, setPendingStatusCode] = useState<string | null>(
    null,
  );

  const [createOpen, setCreateOpen] = useState(false);
  const [editLink, setEditLink] = useState<ShortLink | null>(null);
  const [deleteLink, setDeleteLink] = useState<ShortLink | null>(null);
  const [qrLink, setQrLink] = useState<ShortLink | null>(null);

  if (isLoading) return <PageSpinner />;

  const filteredLinks =
    links?.filter(
      (l) => l.short_code.includes(search) || l.original_url.includes(search),
    ) || [];

  const handleCopy = async (code: string) => {
    try {
      const baseUrl = getRuntimeConfig("API_BASE_URL");
      await navigator.clipboard.writeText(`${baseUrl}/${code}`);
      toast.success("Copied to clipboard", `${baseUrl.replace(/^https?:\/\//, "")}/${code}`);
    } catch {
      toast.error("Failed to copy", "Please try again");
    }
  };

  const handleDelete = () => {
    if (!deleteLink) return;
    deleteMutation.mutate(deleteLink.short_code, {
      onSuccess: () => {
        toast.success(
          "Link deleted",
          `Removed smurl.com/${deleteLink.short_code}`,
        );
        setDeleteLink(null);
      },
      onError: () => {
        toast.error("Failed to delete", "Something went wrong");
      },
    });
  };

  const handleToggleStatus = (link: ShortLink) => {
    const newStatus = !link.is_active;
    setPendingStatusCode(link.short_code);
    statusMutation.mutate(
      { code: link.short_code, data: { is_active: newStatus } },
      {
        onSuccess: () => {
          toast.success(
            newStatus ? "Link activated" : "Link deactivated",
            `smurl.com/${link.short_code} is now ${
              newStatus ? "active" : "inactive"
            }.`,
          );
        },
        onError: () => {
          toast.error("Failed to update status", "Please try again.");
        },
        onSettled: () => {
          setPendingStatusCode(null);
        },
      },
    );
  };

  return (
    <div className="p-4 sm:p-6 max-w-5xl mx-auto">
      {/* Header — stacks on mobile */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6 sm:mb-8">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-text-primary tracking-tight">
            Links
          </h1>
          <p className="text-sm text-text-muted mt-1">
            Manage your short links
          </p>
        </div>
        <Button
          onClick={() => setCreateOpen(true)}
          className="w-full sm:w-auto"
        >
          <Plus className="h-4 w-4 mr-2" />
          Create Link
        </Button>
      </div>

      <div className="bg-surface rounded-xl border border-border shadow-sm overflow-hidden">
        {/* Search bar */}
        <div className="p-3 sm:p-4 border-b border-border">
          <div className="relative max-w-sm w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search links..."
              className="w-full pl-9 pr-4 py-2 text-sm border border-border rounded-lg bg-surface text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 "
            />
          </div>
        </div>

        {/* Table with horizontal scroll on mobile */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left min-w-[800px] table-fixed">
            <thead className="bg-surface-muted text-text-secondary font-medium border-b border-border">
              <tr>
                <th className="px-4 sm:px-6 py-3 w-32">Short Link</th>
                <th className="px-4 sm:px-6 py-3">Original URL</th>
                <th className="px-4 sm:px-6 py-3 w-48">Status</th>
                <th className="px-4 sm:px-6 py-3 w-40">Created</th>
                <th className="px-4 sm:px-6 py-3 w-48 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredLinks.length > 0 ? (
                filteredLinks.map((link) => {
                  const expired = isExpired(link.expires_at);
                  return (
                    <tr
                      key={link.id}
                      className="hover:bg-surface-muted/60 group"
                    >
                      <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                        <Link
                          to={`/links/${link.short_code}`}
                          className="font-medium text-brand-600 hover:underline"
                        >
                          {link.short_code}
                        </Link>
                      </td>
                      <td
                        className="px-4 sm:px-6 py-4 max-w-xs truncate text-text-secondary"
                        title={link.original_url}
                      >
                        {link.original_url}
                      </td>
                      <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2.5">
                          {/* Toggle switch */}
                          <button
                            role="switch"
                            aria-checked={link.is_active}
                            aria-label={`Toggle ${link.short_code}`}
                            disabled={
                              expired || pendingStatusCode === link.short_code
                            }
                            onClick={() => handleToggleStatus(link)}
                            className={[
                              "relative inline-flex h-5 w-9 flex-shrink-0 items-center rounded-full border-2 border-transparent",
                              "transition-colors focus:outline-none focus:ring-2 focus:ring-brand-500/40 focus:ring-offset-1",
                              "disabled:cursor-not-allowed disabled:opacity-40",
                              link.is_active
                                ? "bg-brand-500"
                                : "bg-border dark:bg-border",
                            ].join(" ")}
                          >
                            <span
                              className={[
                                "pointer-events-none inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow ring-0 transition-transform",
                                link.is_active
                                  ? "translate-x-4"
                                  : "translate-x-0",
                              ].join(" ")}
                            />
                          </button>

                          {/* Status text */}
                          <span className="text-sm font-medium">
                            {expired ? (
                              <span className="text-amber-600">Expired</span>
                            ) : link.is_active ? (
                              <span className="text-green-600">Active</span>
                            ) : (
                              <span className="text-gray-500">Inactive</span>
                            )}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 sm:px-6 py-4 text-text-muted whitespace-nowrap">
                        {formatDate(link.created_at)}
                      </td>
                      <td className="px-4 sm:px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 ">
                          <button
                            onClick={() => handleCopy(link.short_code)}
                            className="p-1.5 text-text-muted hover:text-text-primary hover:bg-surface-muted rounded-md "
                            title="Copy"
                          >
                            <Copy className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => setQrLink(link)}
                            className="p-1.5 text-text-muted hover:text-text-primary hover:bg-surface-muted rounded-md "
                            title="QR Code"
                          >
                            <QrCode className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => setEditLink(link)}
                            className="p-1.5 text-text-muted hover:text-text-primary hover:bg-surface-muted rounded-md "
                            title="Edit"
                          >
                            <Edit2 className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => setDeleteLink(link)}
                            className="p-1.5 text-text-muted hover:text-red-500 hover:bg-surface-muted rounded-md "
                            title="Delete"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={5}>
                    <EmptyState
                      icon={Link2}
                      title="No links found"
                      description={
                        search
                          ? "Try a different search term."
                          : "Create your first short link to get started."
                      }
                    />
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <CreateLinkModal open={createOpen} onClose={() => setCreateOpen(false)} />
      {editLink && (
        <EditLinkModal
          open={!!editLink}
          onClose={() => setEditLink(null)}
          link={editLink}
        />
      )}
      <ConfirmDialog
        open={!!deleteLink}
        onClose={() => setDeleteLink(null)}
        onConfirm={handleDelete}
        title="Delete Link"
        description="Are you sure you want to delete this link? This action cannot be undone."
        loading={deleteMutation.isPending}
      />
      <Modal open={!!qrLink} onClose={() => setQrLink(null)} title="QR Code">
        {qrLink && (
          <div className="flex flex-col items-center justify-center py-4">
            <img
              src={getQRCodeUrl(qrLink.short_code)}
              alt="QR Code"
              className="w-48 h-48 rounded-lg border border-border"
            />
            <p className="mt-4 text-sm font-medium text-text-primary">
              {getRuntimeConfig("API_BASE_URL")}/{qrLink.short_code}
            </p>
          </div>
        )}
      </Modal>
    </div>
  );
}
