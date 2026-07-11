import { Crown, CheckCircle2, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { useState } from 'react'
import { UpgradeModal } from './UpgradeModal'
import { getPlanLabel } from '@/lib/plan'
import type { Plan } from '@/types'

interface PlanCardProps {
  plan: Plan | undefined
}

export function PlanCard({ plan }: PlanCardProps) {
  const [upgradeOpen, setUpgradeOpen] = useState(false)
  const isUserPremium = plan === 'premium'
  const label = getPlanLabel(plan)

  return (
    <>
      <div className={`
        relative overflow-hidden rounded-xl border p-5 shadow-sm
        ${isUserPremium
          ? 'border-amber-200 bg-gradient-to-br from-amber-50 to-white dark:from-amber-900/20 dark:to-surface dark:border-amber-700/40'
          : 'border-border bg-surface'
        }
      `}>
        {isUserPremium && (
          <div className="absolute top-0 right-0 h-24 w-24 -translate-y-4 translate-x-4 rounded-full bg-amber-400/10 blur-xl" />
        )}

        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-text-muted mb-1">
              Current Plan
            </p>
            <div className="flex items-center gap-2">
              {isUserPremium ? (
                <Crown className="h-5 w-5 text-amber-500" />
              ) : (
                <CheckCircle2 className="h-5 w-5 text-text-muted" />
              )}
              <span className={`text-xl font-bold ${isUserPremium ? 'text-amber-600 dark:text-amber-400' : 'text-text-primary'}`}>
                {label}
              </span>
            </div>
          </div>
          {isUserPremium && (
            <div className="flex items-center gap-1 rounded-full bg-amber-100 dark:bg-amber-900/30 px-2.5 py-1 text-xs font-semibold text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-700/40">
              <Sparkles className="h-3 w-3" />
              Active
            </div>
          )}
        </div>

        {!isUserPremium && (
          <div className="mt-4">
            <p className="text-xs text-text-muted mb-3">
              Unlock expiration dates, QR codes, advanced analytics, and more.
            </p>
            <Button
              size="sm"
              onClick={() => setUpgradeOpen(true)}
              className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white border-0 shadow-sm shadow-amber-500/25"
            >
              <Crown className="h-3.5 w-3.5" />
              Upgrade to Premium
            </Button>
          </div>
        )}

        {isUserPremium && (
          <p className="mt-3 text-xs text-amber-600/70 dark:text-amber-400/70">
            All premium features are unlocked for your account.
          </p>
        )}
      </div>

      <UpgradeModal open={upgradeOpen} onClose={() => setUpgradeOpen(false)} />
    </>
  )
}
