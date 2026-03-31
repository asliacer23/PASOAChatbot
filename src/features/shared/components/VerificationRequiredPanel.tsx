import { ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

interface VerificationRequiredPanelProps {
  featureLabel: string;
}

export function VerificationRequiredPanel({ featureLabel }: VerificationRequiredPanelProps) {
  return (
    <div className="flex-1 flex items-center justify-center p-4">
      <div className="w-full max-w-lg rounded-xl border border-amber-500/30 bg-amber-500/10 p-5 sm:p-6 space-y-4">
        <div className="flex items-center gap-2">
          <ShieldAlert className="h-5 w-5 text-amber-600" />
          <h3 className="text-base sm:text-lg font-semibold text-foreground">Verification Required</h3>
        </div>
        <p className="text-sm text-muted-foreground">
          You need to verify your student number before using the {featureLabel}.
        </p>
        <div className="flex gap-2">
          <Button asChild>
            <Link to="/profile">Verify Now</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
