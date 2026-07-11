import { useState } from "react";
import { Lock } from "lucide-react";
import { UpgradeModal } from "./UpgradeModal";
import { cn } from "@/lib/utils";

interface PremiumFeatureProps {
  children: React.ReactNode;
  hasAccess: boolean;
  featureName?: string;
  className?: string;
}

export function PremiumFeature({
  children,
  hasAccess,
  featureName,
  className,
}: PremiumFeatureProps) {
  const [upgradeOpen, setUpgradeOpen] = useState(false);

  if (hasAccess) return <div className={className}>{children}</div>;

  return (
    <>
      <div
        className={cn("relative", className)}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setUpgradeOpen(true);
        }}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => e.key === "Enter" && setUpgradeOpen(true)}
        aria-label={`${featureName ?? "This feature"} requires a Premium subscription`}
      >
        <div className="pointer-events-none select-none opacity-50">
          {children}
        </div>

        <div className="absolute inset-0 flex flex-col items-center justify-center gap-1.5 cursor-pointer rounded-lg bg-surface/60 backdrop-blur-[2px] border border-dashed border-amber-300 dark:border-amber-700/50">
          <div className="flex items-center justify-center h-7 w-7 rounded-full bg-amber-100 dark:bg-amber-900/40">
            <Lock className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />
          </div>
          <p className="text-xs font-medium text-amber-700 dark:text-amber-400 text-center px-2">
            Available only for Premium users.
          </p>
        </div>
      </div>

      <UpgradeModal open={upgradeOpen} onClose={() => setUpgradeOpen(false)} />
    </>
  );
}
