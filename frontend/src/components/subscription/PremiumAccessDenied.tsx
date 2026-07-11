import { Crown } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { useState } from 'react'
import { UpgradeModal } from '@/components/subscription/UpgradeModal'

interface PremiumAccessDeniedProps {
  title?: string
  description?: string
}

export function PremiumAccessDenied({
  title = 'Premium Feature',
  description = 'This page is available to Premium subscribers only.',
}: PremiumAccessDeniedProps) {
  const [upgradeOpen, setUpgradeOpen] = useState(false)

  return (
    <>
      <div className="flex flex-col items-center justify-center min-h-[60vh] p-8 text-center">
        <div className="mb-5 flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-br from-amber-400 to-amber-600 shadow-xl shadow-amber-500/30">
          <Crown className="h-10 w-10 text-white" />
        </div>
        <h1 className="text-2xl font-bold text-text-primary mb-2">{title}</h1>
        <p className="text-sm text-text-muted max-w-sm leading-relaxed mb-6">{description}</p>
        <Button
          onClick={() => setUpgradeOpen(true)}
          className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white border-0 shadow-md shadow-amber-500/25"
        >
          <Crown className="h-4 w-4" />
          Upgrade to Premium
        </Button>
      </div>

      <UpgradeModal open={upgradeOpen} onClose={() => setUpgradeOpen(false)} />
    </>
  )
}
