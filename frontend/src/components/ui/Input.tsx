import { forwardRef, useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { cn } from "@/lib/utils";
import type { InputHTMLAttributes } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, hint, className, id, ...props }, ref) => {
    const inputId = id ?? label?.toLowerCase().replace(/\s+/g, "-");
    const isPassword = props.type === "password";
    const [showPassword, setShowPassword] = useState(false);

    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label
            htmlFor={inputId}
            className="text-sm font-medium text-text-primary"
          >
            {label}
          </label>
        )}
        <div className="relative">
          <input
            ref={ref}
            id={inputId}
            className={cn(
              "h-9 w-full rounded-lg border px-3 text-sm text-text-primary placeholder:text-text-muted",
              "bg-surface outline-none shadow-sm hover:border-text-muted/30",
              "border-border focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 focus:-translate-y-[1px]",
              "disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:border-border disabled:focus:translate-y-0",
              error &&
                "border-red-400 focus:border-red-500 focus:ring-red-500/10",
              isPassword && "pr-10", // space for eye icon
              props.type === "datetime-local" && "py-1.5",
              className,
            )}
            autoComplete="off"
            {...props}
            type={isPassword && showPassword ? "text" : props.type}
          />
          {isPassword && (
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-0 top-0 h-full px-3 text-text-muted hover:text-text-primary focus-visible:outline-none focus-visible:text-brand-600 rounded-r-lg"
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </button>
          )}
        </div>
        {error && (
          <p className="text-xs text-red-500 animate-fade-in">{error}</p>
        )}
        {hint && !error && <p className="text-xs text-text-muted">{hint}</p>}
      </div>
    );
  },
);

Input.displayName = "Input";
