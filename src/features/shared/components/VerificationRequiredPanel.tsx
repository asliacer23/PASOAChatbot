import { ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

interface VerificationRequiredPanelProps {
  featureLabel: string;
}

export function VerificationRequiredPanel({ featureLabel }: VerificationRequiredPanelProps) {
  return (
    <div className="w-full min-h-[60vh] flex items-center justify-center px-4 py-8 sm:px-6 sm:py-10">
      <div className="w-full max-w-xl rounded-2xl border border-amber-500/30 bg-gradient-to-br from-amber-500/15 via-amber-500/10 to-transparent p-5 sm:p-7 md:p-8 shadow-lg">
        <div className="flex items-center justify-center sm:justify-start gap-2">
          <ShieldAlert className="h-5 w-5 text-amber-600" />
          <h3 className="text-base sm:text-lg font-semibold text-foreground">Verification Required</h3>
        </div>
        <p className="text-sm sm:text-base text-muted-foreground mt-3 text-center sm:text-left">
          You need to verify your student number before using the {featureLabel}.
        </p>
        <div className="flex justify-center sm:justify-start mt-5">
          <Button asChild>
            <Link to="/profile">Verify Now</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
