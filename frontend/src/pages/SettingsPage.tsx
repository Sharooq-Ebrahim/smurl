import { User, Mail, Shield, Calendar } from "lucide-react";
import { useAuthStore } from "@/store/authStore";
import { formatDate } from "@/lib/utils";

export function SettingsPage() {
  const { user } = useAuthStore();

  if (!user) return null;

  return (
    <div className="p-4 sm:p-6 max-w-3xl mx-auto space-y-6 sm:space-y-8">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-text-primary tracking-tight">
          Settings
        </h1>
        <p className="text-sm text-text-muted mt-1">
          Manage your account and preferences
        </p>
      </div>

      <div className="bg-surface rounded-xl border border-border shadow-sm overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-border">
          <h2 className="text-base font-semibold text-text-primary">
            Profile Information
          </h2>
        </div>
        <div className="p-4 sm:p-6 divide-y divide-border">
          <div className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2 first:pt-0">
            <div className="flex items-center gap-3 text-sm">
              <div className="p-2 bg-surface-muted rounded-lg shrink-0">
                <User className="h-4 w-4 text-text-secondary" />
              </div>
              <div>
                <p className="font-medium text-text-primary">Full Name</p>
                <p className="text-text-muted mt-0.5">{user.name}</p>
              </div>
            </div>
          </div>

          <div className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-3 text-sm">
              <div className="p-2 bg-surface-muted rounded-lg shrink-0">
                <Mail className="h-4 w-4 text-text-secondary" />
              </div>
              <div>
                <p className="font-medium text-text-primary">Email Address</p>
                <p className="text-text-muted mt-0.5">{user.email}</p>
              </div>
            </div>
          </div>

          <div className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-3 text-sm">
              <div className="p-2 bg-surface-muted rounded-lg shrink-0">
                <Calendar className="h-4 w-4 text-text-secondary" />
              </div>
              <div>
                <p className="font-medium text-text-primary">Member Since</p>
                <p className="text-text-muted mt-0.5">
                  {formatDate(user.created_at)}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-surface rounded-xl border border-border shadow-sm overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-border">
          <h2 className="text-base font-semibold text-text-primary flex items-center">
            <Shield className="h-4 w-4 mr-2" /> Security
          </h2>
        </div>
        <div className="p-4 sm:p-6">
          <p className="text-sm text-text-secondary mb-4">
            Password change and two-factor authentication will be available in a
            future update.
          </p>
          <button className="text-sm font-medium text-brand-600 bg-brand-50 hover:bg-brand-100 dark:bg-brand-900/30 dark:hover:bg-brand-900/50 dark:text-brand-400 px-4 py-2 rounded-lg cursor-not-allowed opacity-60">
            Change Password
          </button>
        </div>
      </div>
    </div>
  );
}
