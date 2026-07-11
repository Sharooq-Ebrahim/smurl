import { useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { DatePicker } from "@/components/ui/DatePicker";
import { Button } from "@/components/ui/Button";
import { useUpdateLink } from "./useLinks";
import { toast } from "@/store/toastStore";
import { getErrorMessage } from "@/lib/utils";
import type { ShortLink } from "@/types";
import { usePlan } from "@/features/subscription/usePlan";
import { PremiumBadge } from "@/components/subscription/PremiumBadge";
import { PremiumFeature } from "@/components/subscription/PremiumFeature";

const schema = z.object({
  original_url: z.string().url("Enter a valid URL (include https://)"),
  expires_at: z.string().optional().or(z.literal("")),
});

type FormData = z.infer<typeof schema>;

interface Props {
  open: boolean;
  onClose: () => void;
  link: ShortLink;
}

export function EditLinkModal({ open, onClose, link }: Props) {
  const updateMutation = useUpdateLink();
  const { canUseExpiration } = usePlan();


  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
    reset,
    setError,
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { 
      original_url: link.original_url,
      expires_at: link.expires_at || "",
    },
  });

  useEffect(() => {
    reset({ 
      original_url: link.original_url,
      expires_at: link.expires_at || "",
    });
  }, [link, reset]);

  const onSubmit = (data: FormData) => {
    updateMutation.mutate(
      { 
        code: link.short_code, 
        data: { 
          original_url: data.original_url,
          expires_at: data.expires_at ? new Date(data.expires_at).toISOString() : null,
        } 
      },
      {
        onSuccess: () => {
          toast.success("Link updated successfully");
          onClose();
        },
        onError: (error) => {
          const msg = getErrorMessage(error);
          if (msg.toLowerCase().includes("premium")) {
            setError("root", { message: "This feature requires a Premium subscription." });
          } else {
            setError("root", { message: msg });
          }
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
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-text-primary">Expiration date</span>
            {!canUseExpiration && <PremiumBadge />}
          </div>
          <PremiumFeature hasAccess={canUseExpiration} featureName="Link Expiration">
            <Controller
              control={control}
              name="expires_at"
              render={({ field }) => (
                <DatePicker
                  hint="Leave empty for no expiration"
                  value={field.value}
                  onChange={field.onChange}
                  error={errors.expires_at?.message}
                  disablePastDates={true}
                />
              )}
            />
          </PremiumFeature>
        </div>

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
