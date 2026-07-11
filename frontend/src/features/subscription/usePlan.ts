import { useAuthStore } from "@/store/authStore";
import {
  isPremium,
  isFree,
  canUseExpiration,
  canGenerateQRCode,
  canViewAdvancedAnalytics,
  canCreatePasswordProtectedLink,
} from "@/lib/plan";
import type { Plan } from "@/types";

export function usePlan() {
  const plan = useAuthStore((s) => s.user?.plan) as Plan | undefined;

  return {
    plan,
    isPremium: isPremium(plan),
    isFree: isFree(plan),
    canUseExpiration: canUseExpiration(plan),
    canGenerateQRCode: canGenerateQRCode(plan),
    canViewAdvancedAnalytics: canViewAdvancedAnalytics(plan),
    canCreatePasswordProtectedLink: canCreatePasswordProtectedLink(plan),
  };
}
