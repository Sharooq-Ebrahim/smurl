import type { Plan } from "@/types";

const PREMIUM_PLANS = new Set<Plan>(["premium"]);

export function isPremium(plan: Plan | undefined): boolean {
  if (!plan) return false;
  return PREMIUM_PLANS.has(plan);
}

export function isFree(plan: Plan | undefined): boolean {
  return !isPremium(plan);
}

export function canUseExpiration(plan: Plan | undefined): boolean {
  return isPremium(plan);
}

export function canGenerateQRCode(plan: Plan | undefined): boolean {
  return isPremium(plan);
}

export function canViewAdvancedAnalytics(plan: Plan | undefined): boolean {
  return isPremium(plan);
}

export function canCreatePasswordProtectedLink(
  plan: Plan | undefined,
): boolean {
  return isPremium(plan);
}

export function getPlanLabel(plan: Plan | undefined): string {
  switch (plan) {
    case "premium":
      return "Premium";
    default:
      return "Free";
  }
}
