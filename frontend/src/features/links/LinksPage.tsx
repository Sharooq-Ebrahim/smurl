import { useState } from "react";
import { Link } from "react-router-dom";
import { Plus, Search, Copy, QrCode, Edit2, Trash2, Link2 } from "lucide-react";
import { useLinks, useDeleteLink } from "./useLinks";
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
import type { ShortLink } from "@/types";

export function LinksPage() {
  const { data: links, isLoading } = useLinks();
  const deleteMutation = useDeleteLink();
  const [search, setSearch] = useState("");

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
      await navigator.clipboard.writeText(`${window.location.origin}/${code}`);
      toast.success("Copied to clipboard", `smurl.com/${code}`);
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
          <table className="w-full text-sm text-left min-w-[600px]">
            <thead className="bg-surface-muted text-text-secondary font-medium border-b border-border">
              <tr>
                <th className="px-4 sm:px-6 py-3">Short Link</th>
                <th className="px-4 sm:px-6 py-3">Original URL</th>
                <th className="px-4 sm:px-6 py-3">Status</th>
                <th className="px-4 sm:px-6 py-3">Created</th>
                <th className="px-4 sm:px-6 py-3 text-right">Actions</th>
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
                        {expired ? (
                          <Badge variant="muted">Expired</Badge>
                        ) : (
                          <Badge variant="success">Active</Badge>
                        )}
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
              {window.location.origin}/{qrLink.short_code}
            </p>
          </div>
        )}
      </Modal>
    </div>
  );
}
