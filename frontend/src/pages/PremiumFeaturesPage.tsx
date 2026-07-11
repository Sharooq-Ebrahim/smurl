import {
  Crown,
  Clock,
  Lock,
  QrCode,
  BarChart2,
  Gauge,
  Check,
  Sparkles,
} from "lucide-react";

const PREMIUM_FEATURES = [
  {
    icon: Clock,
    label: "Link Expiration",
    description:
      "Set expiry dates on your links. Expired links return 410 Gone automatically.",
    iconBg: "bg-blue-50 dark:bg-blue-950/40",
    iconColor: "text-blue-600 dark:text-blue-400",
  },
  {
    icon: Lock,
    label: "Password Protected Links",
    description: "Require a password before anyone can access your short link.",
    iconBg: "bg-purple-50 dark:bg-purple-950/40",
    iconColor: "text-purple-600 dark:text-purple-400",
  },
  {
    icon: QrCode,
    label: "QR Code Generation",
    description:
      "Instantly generate and download QR codes for any of your short links.",
    iconBg: "bg-green-50 dark:bg-green-950/40",
    iconColor: "text-green-600 dark:text-green-400",
  },
  {
    icon: BarChart2,
    label: "Advanced Analytics",
    description:
      "Detailed click timelines, device breakdowns, and referrer tracking.",
    iconBg: "bg-orange-50 dark:bg-orange-950/40",
    iconColor: "text-orange-600 dark:text-orange-400",
  },
  {
    icon: Gauge,
    label: "Higher Rate Limits",
    description: "Up to 100 requests per window instead of 30 for free users.",
    iconBg: "bg-red-50 dark:bg-red-950/40",
    iconColor: "text-red-600 dark:text-red-400",
  },
];

export function PremiumFeaturesPage() {
  return (
    <div className="p-4 sm:p-6 max-w-3xl mx-auto">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 shadow-lg shadow-amber-500/25">
            <Crown className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-text-primary tracking-tight">
              Premium Features
            </h1>
            <p className="text-sm text-text-muted mt-0.5">
              Your plan unlocks all of these capabilities.
            </p>
          </div>
        </div>
        <div className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-amber-50 to-amber-100 dark:from-amber-900/30 dark:to-amber-800/20 border border-amber-200 dark:border-amber-700/40 px-4 py-1.5 text-sm font-semibold text-amber-700 dark:text-amber-400 shadow-sm">
          <Sparkles className="h-4 w-4" />
          Premium — All features active
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {PREMIUM_FEATURES.map(
          ({ icon: Icon, label, description, iconBg, iconColor }) => (
            <div
              key={label}
              className="bg-surface rounded-xl border border-border p-5 shadow-sm flex gap-4 hover:shadow-md transition-shadow"
            >
              <div className={`shrink-0 p-2.5 rounded-xl ${iconBg} self-start`}>
                <Icon className={`h-5 w-5 ${iconColor}`} />
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="text-sm font-semibold text-text-primary">
                    {label}
                  </h3>
                  <div className="flex h-4 w-4 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/40">
                    <Check className="h-2.5 w-2.5 text-green-600 dark:text-green-400" />
                  </div>
                </div>
                <p className="text-xs text-text-muted leading-relaxed">
                  {description}
                </p>
              </div>
            </div>
          ),
        )}
      </div>

      <div className="mt-8 rounded-xl border border-amber-200 dark:border-amber-700/40 bg-amber-50/60 dark:bg-amber-900/10 px-5 py-4 flex items-start gap-3">
        <Sparkles className="h-4 w-4 text-amber-500 mt-0.5 shrink-0" />
        <p className="text-sm text-amber-800 dark:text-amber-300 leading-relaxed">
          You're on the <strong>Premium plan</strong>. All features listed above
          are fully unlocked and ready to use across your account.
        </p>
      </div>
    </div>
  );
}
