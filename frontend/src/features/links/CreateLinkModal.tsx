import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { useCreateLink } from "./useLinks";
import { toast } from "@/store/toastStore";
import { getErrorMessage } from "@/lib/utils";

const schema = z.object({
  original_url: z.string().url("Enter a valid URL (include https://)"),
  custom_short_code: z
    .string()
    .regex(/^[a-zA-Z0-9_-]{3,20}$/, {
      message: "Alias: 3–20 chars, letters/numbers/- only",
    })
    .optional()
    .or(z.literal("")),
  expires_at: z.string().optional().or(z.literal("")),
});

type FormData = z.infer<typeof schema>;

interface Props {
  open: boolean;
  onClose: () => void;
}

export function CreateLinkModal({ open, onClose }: Props) {
  const createMutation = useCreateLink();

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setError,
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  const onSubmit = (data: FormData) => {
    createMutation.mutate(
      {
        original_url: data.original_url,
        custom_short_code: data.custom_short_code || undefined,
        expires_at: data.expires_at || undefined,
      },
      {
        onSuccess: () => {
          toast.success("Link created successfully");
          reset();
          onClose();
        },
        onError: (error) => {
          setError("root", { message: getErrorMessage(error) });
        },
      },
    );
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  return (
    <Modal open={open} onClose={handleClose} title="Create short link">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Input
          label="Destination URL"
          type="url"
          placeholder="https://example.com/your-long-url"
          error={errors.original_url?.message}
          {...register("original_url")}
        />
        <Input
          label="Custom alias"
          placeholder="my-link (optional)"
          hint="3–20 characters: letters, numbers, hyphens"
          error={errors.custom_short_code?.message}
          {...register("custom_short_code")}
        />
        {/* <Input
 label="Expiration date"
 type="datetime-local"
 hint="Leave empty for no expiration"
 error={errors.expires_at?.message}
 {...register('expires_at')}
 /> */}

        {errors.root && (
          <p className="text-sm text-red-500 bg-red-50 dark:bg-red-950/40 dark:text-red-400 px-3 py-2 rounded-lg">
            {errors.root.message}
          </p>
        )}

        <div className="flex justify-end gap-2 pt-1">
          <Button type="button" variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          <Button type="submit" loading={createMutation.isPending}>
            Create link
          </Button>
        </div>
      </form>
    </Modal>
  );
}
