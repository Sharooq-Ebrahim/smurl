import { cn } from "@/lib/utils";

interface BadgeProps {
  variant?: "default" | "success" | "warning" | "danger" | "muted";
  children: React.ReactNode;
  className?: string;
}

export function Badge({
  variant = "default",
  children,
  className,
}: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium",
        {
          "bg-brand-100 text-brand-700 dark:bg-brand-900/40 dark:text-brand-300":
            variant === "default",
          "bg-green-50 text-green-700 dark:bg-green-950/60 dark:text-green-400":
            variant === "success",
          "bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400":
            variant === "warning",
          "bg-red-50 text-red-600 dark:bg-red-950/60 dark:text-red-400":
            variant === "danger",
          "bg-surface-muted text-text-muted": variant === "muted",
        },
        className,
      )}
    >
      {children}
    </span>
  );
}
