import { cn } from "@/lib/utils";
import type { ButtonHTMLAttributes } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "danger" | "outline";
  size?: "sm" | "md" | "lg";
  loading?: boolean;
}

export function Button({
  variant = "primary",
  size = "md",
  loading = false,
  className,
  children,
  disabled,
  ...props
}: ButtonProps) {
  return (
    <button
      disabled={disabled || loading}
      className={cn(
        "inline-flex items-center justify-center gap-2 font-medium rounded-lg active:scale-[0.98]",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-surface",
        "disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100 cursor-pointer",
        {
          // Sizes
          "text-xs px-3 py-1.5 h-7": size === "sm",
          "text-sm px-4 py-2 h-9": size === "md",
          "text-sm px-5 py-2.5 h-10": size === "lg",
          // Variants
          "bg-brand-600 text-white hover:bg-brand-700 focus-visible:ring-brand-500":
            variant === "primary",
          "bg-surface-muted text-text-primary hover:bg-border focus-visible:ring-brand-500":
            variant === "secondary",
          "text-text-secondary hover:bg-surface-muted hover:text-text-primary focus-visible:ring-brand-500":
            variant === "ghost",
          "bg-red-600 text-white hover:bg-red-700 focus-visible:ring-red-500":
            variant === "danger",
          "border border-border text-text-primary hover:bg-surface-muted focus-visible:ring-brand-500":
            variant === "outline",
        },
        className,
      )}
      {...props}
    >
      {loading && (
        <svg
          className="animate-spin h-4 w-4"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
          />
        </svg>
      )}
      {children}
    </button>
  );
}
