import { Outlet } from "react-router-dom";
import { ThemeToggle } from "@/components/ui/ThemeToggle";

export function AuthLayout() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-surface-muted p-4 relative">
      {/* Theme toggle in corner */}
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>

      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="flex items-center justify-center gap-2 mb-8">
          <img src="/logo/icon.svg" alt="Smurl Icon" className="h-8 w-8" />
          <span className="text-xl font-bold tracking-tight text-text-primary">
            Sm<span className="text-brand-600 dark:text-cyan-400">url</span>
          </span>
        </div>
        {/* Auth card */}
        <div className="bg-surface rounded-xl border border-border p-6 shadow-sm animate-auth-entrance">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
