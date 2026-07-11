import { useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Link2,
  BarChart2,
  Settings,
  LogOut,
  Menu,
  X,
  Crown,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/store/authStore";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { usePlan } from "@/features/subscription/usePlan";
import { UpgradeModal } from "@/components/subscription/UpgradeModal";

function SidebarContent({
  user,
  isPremium,
  onLogout,
  onNavClick,
}: {
  user: { name: string; email: string; plan?: string } | null;
  isPremium: boolean;
  onLogout: () => void;
  onNavClick?: () => void;
}) {
  const [upgradeOpen, setUpgradeOpen] = useState(false);

  const navItems = [
    { to: "/", label: "Dashboard", icon: LayoutDashboard, end: true },
    { to: "/links", label: "My Links", icon: Link2, end: false },
    { to: "/analytics", label: "Analytics", icon: BarChart2, end: false },
    { to: "/settings", label: "Settings", icon: Settings, end: false },
  ];

  return (
    <>
      <div className="flex items-center gap-2 px-4 py-4 border-b border-border">
        <div className="flex items-center justify-center">
          <img src="/logo/icon.svg" alt="Smurl Icon" className="h-6 w-6" />
        </div>
        <span className="text-sm font-semibold tracking-tight text-text-primary">
          sm<span className="text-brand-600 dark:text-cyan-400">url</span>
        </span>
      </div>

      <nav className="flex-1 p-3 space-y-0.5">
        {navItems.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            onClick={onNavClick}
            className={({ isActive }) =>
              cn(
                "flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium ",
                isActive
                  ? "bg-brand-50 text-brand-700 dark:bg-brand-900/30 dark:text-brand-300"
                  : "text-text-secondary hover:bg-surface-muted hover:text-text-primary",
              )
            }
          >
            <Icon className="h-4 w-4 shrink-0" />
            {label}
          </NavLink>
        ))}
        {isPremium ? (
          <NavLink
            to="/premium"
            onClick={onNavClick}
            className={({ isActive }) =>
              cn(
                "flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium ",
                isActive
                  ? "bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300"
                  : "text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-900/20",
              )
            }
          >
            <Crown className="h-4 w-4 shrink-0" />
            Premium Features
          </NavLink>
        ) : (
          <button
            onClick={() => setUpgradeOpen(true)}
            className="w-full flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-900/20 cursor-pointer"
          >
            <Crown className="h-4 w-4 shrink-0" />
            Premium
          </button>
        )}
      </nav>

      <div className="p-3 border-t border-border">
        <div className="flex items-center justify-between rounded-lg px-3 py-2">
          <div className="min-w-0">
            <p className="text-sm font-medium text-text-primary truncate">
              {user?.name}
            </p>
            <p className="text-xs text-text-muted truncate">{user?.email}</p>
          </div>
          <div className="flex items-center gap-1 ml-2 shrink-0">
            <ThemeToggle />
            <button
              onClick={onLogout}
              title="Logout"
              aria-label="Logout"
              className="flex items-center justify-center h-7 w-7 rounded-md text-text-muted hover:text-red-500 hover:bg-surface-muted "
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      <UpgradeModal open={upgradeOpen} onClose={() => setUpgradeOpen(false)} />
    </>
  );
}

export function AppLayout() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const { isPremium } = usePlan();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <div className="flex h-screen bg-surface">
      <aside className="hidden md:flex w-56 flex-col border-r border-border bg-surface shrink-0">
        <SidebarContent
          user={user}
          isPremium={isPremium}
          onLogout={handleLogout}
        />
      </aside>

      <div className="md:hidden fixed top-0 inset-x-0 z-40 flex items-center justify-between h-14 px-4 border-b border-border bg-surface">
        <div className="flex items-center gap-2">
          <div className="flex items-center justify-center">
            <img src="/logo/icon.svg" alt="Smurl Icon" className="h-6 w-6" />
          </div>
          <span className="text-sm font-semibold tracking-tight text-text-primary">
            sm<span className="text-brand-600 dark:text-cyan-400">url</span>
          </span>
        </div>
        <div className="flex items-center gap-1">
          <ThemeToggle />
          <button
            onClick={() => setDrawerOpen(true)}
            aria-label="Open navigation menu"
            className="flex items-center justify-center h-9 w-9 rounded-lg text-text-secondary hover:text-text-primary hover:bg-surface-muted "
          >
            <Menu className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Mobile drawer overlay */}
      {drawerOpen && (
        <>
          {/* Backdrop */}
          <div
            className="md:hidden fixed inset-0 z-50 bg-black/40 backdrop-blur-sm animate-fade-in"
            onClick={() => setDrawerOpen(false)}
            aria-hidden="true"
          />
          {/* Drawer */}
          <aside className="md:hidden fixed inset-y-0 left-0 z-50 w-64 flex flex-col bg-surface border-r border-border shadow-xl animate-drawer-in">
            <div className="flex items-center justify-end p-3 border-b border-border">
              <button
                onClick={() => setDrawerOpen(false)}
                aria-label="Close navigation menu"
                className="flex items-center justify-center h-8 w-8 rounded-lg text-text-secondary hover:text-text-primary hover:bg-surface-muted "
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="flex flex-col flex-1">
              <SidebarContent
                user={user}
                isPremium={isPremium}
                onLogout={handleLogout}
                onNavClick={() => setDrawerOpen(false)}
              />
            </div>
          </aside>
        </>
      )}

      {/* Main content — push down on mobile to account for top bar */}
      <main className="flex-1 overflow-y-auto md:pt-0 pt-14">
        <Outlet />
      </main>
    </div>
  );
}
