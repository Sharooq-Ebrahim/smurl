import {
  Crown,
  Zap,
  Clock,
  Lock,
  QrCode,
  BarChart2,
  Gauge,
} from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { toast } from "@/store/toastStore";

interface UpgradeModalProps {
  open: boolean;
  onClose: () => void;
}

const PREMIUM_FEATURES = [
  { icon: Clock, label: "Link Expiration" },
  { icon: Lock, label: "Password Protected Links" },
  { icon: QrCode, label: "QR Code Generation" },
  { icon: BarChart2, label: "Advanced Analytics" },
  { icon: Gauge, label: "Higher Rate Limits" },
];

export function UpgradeModal({ open, onClose }: UpgradeModalProps) {
  const handleUpgrade = () => {
    toast.info("Payment integration coming soon.");
  };

  return (
    <Modal open={open} onClose={onClose} title="Upgrade to Premium">
      <div className="space-y-5">
        <div className="flex flex-col items-center gap-3 pt-1">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 shadow-lg shadow-amber-500/30">
            <Crown className="h-7 w-7 text-white" />
          </div>
          <p className="text-sm text-text-muted text-center leading-relaxed">
            Unlock advanced features to supercharge your link management.
          </p>
        </div>

        <ul className="space-y-2.5 rounded-xl border border-border bg-surface-muted/40 p-4">
          {PREMIUM_FEATURES.map(({ icon: Icon, label }) => (
            <li key={label} className="flex items-center gap-3">
              <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-amber-100 dark:bg-amber-900/30">
                <Icon className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />
              </div>
              <span className="text-sm text-text-primary">{label}</span>
              <Zap className="ml-auto h-3.5 w-3.5 text-amber-500" />
            </li>
          ))}
        </ul>

        <div className="flex gap-2 pt-1">
          <Button variant="outline" onClick={onClose} className="flex-1">
            Cancel
          </Button>
          <Button
            onClick={handleUpgrade}
            className="flex-1 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white border-0 shadow-md shadow-amber-500/25"
          >
            <Crown className="h-4 w-4" />
            Upgrade
          </Button>
        </div>
      </div>
    </Modal>
  );
}
