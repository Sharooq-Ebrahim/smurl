import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { useUpdateLink } from "./useLinks";
import { toast } from "@/store/toastStore";
import { getErrorMessage } from "@/lib/utils";
import type { ShortLink } from "@/types";

const schema = z.object({
  original_url: z.string().url("Enter a valid URL (include https://)"),
});

type FormData = z.infer<typeof schema>;

interface Props {
  open: boolean;
  onClose: () => void;
  link: ShortLink;
}

export function EditLinkModal({ open, onClose, link }: Props) {
  const updateMutation = useUpdateLink();

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setError,
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { original_url: link.original_url },
  });

  useEffect(() => {
    reset({ original_url: link.original_url });
  }, [link, reset]);

  const onSubmit = (data: FormData) => {
    updateMutation.mutate(
      { code: link.short_code, data: { original_url: data.original_url } },
      {
        onSuccess: () => {
          toast.success("Link updated successfully");
          onClose();
        },
        onError: (error) => {
          setError("root", { message: getErrorMessage(error) });
        },
      },
    );
  };

  return (
    <Modal open={open} onClose={onClose} title="Edit link">
      <div className="mb-4 p-3 rounded-lg bg-surface-muted">
        <p className="text-xs text-text-muted mb-0.5">Short code</p>
        <p className="text-sm font-medium text-text-primary font-mono">
          {link.short_code}
        </p>
      </div>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Input
          label="Destination URL"
          type="url"
          placeholder="https://example.com/new-destination"
          error={errors.original_url?.message}
          {...register("original_url")}
        />

        {errors.root && (
          <p className="text-sm text-red-500 bg-red-50 dark:bg-red-950/40 dark:text-red-400 px-3 py-2 rounded-lg">
            {errors.root.message}
          </p>
        )}

        <div className="flex justify-end gap-2 pt-1">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" loading={updateMutation.isPending}>
            Save changes
          </Button>
        </div>
      </form>
    </Modal>
  );
}
