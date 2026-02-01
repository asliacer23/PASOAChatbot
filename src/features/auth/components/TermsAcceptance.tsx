import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Shield, FileText, Lock } from "lucide-react";
import { TermsOfService } from "./TermsOfService";
import { PrivacyPolicy } from "./PrivacyPolicy";

interface TermsAcceptanceProps {
  onAccept: () => void;
  onCancel?: () => void;
  isLoading?: boolean;
}

export function TermsAcceptance({ onAccept, onCancel, isLoading = false }: TermsAcceptanceProps) {
  const [agreed, setAgreed] = useState(false);
  const [showFullTerms, setShowFullTerms] = useState(false);
  const [showFullPrivacy, setShowFullPrivacy] = useState(false);
  const navigate = useNavigate();

  const handleCancel = () => {
    // Clear pending data
    localStorage.removeItem("pendingSignupData");
    // Call the onCancel callback if provided
    if (onCancel) {
      onCancel();
    } else {
      // Otherwise navigate back to auth
      navigate("/auth");
    }
  };

  if (showFullTerms) {
    return (
      <TermsOfService
        onAccept={() => {
          setAgreed(true);
          setShowFullTerms(false);
        }}
        onBack={() => setShowFullTerms(false)}
        showAcceptButton={true}
        compact={false}
      />
    );
  }

  if (showFullPrivacy) {
    return (
      <PrivacyPolicy
        onAccept={() => {
          setAgreed(true);
          setShowFullPrivacy(false);
        }}
        onBack={() => setShowFullPrivacy(false)}
        showAcceptButton={false}
        compact={false}
      />
    );
  }

  return (
    <Card className="border-border/50 shadow-2xl bg-gradient-to-br from-card via-card to-card/80 backdrop-blur-xl overflow-hidden">
      <CardContent className="p-8 space-y-6">
        {/* Header */}
        <div className="space-y-3 pb-2">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/15 rounded-lg">
              <Shield className="h-5 w-5 text-primary" />
            </div>
            <h3 className="font-bold text-xl text-foreground">Terms & Privacy Agreement</h3>
          </div>
          <p className="text-sm text-muted-foreground pl-11">
            Please review and accept our legal documents before creating your account
          </p>
        </div>

        {/* Divider */}
        <div className="h-px bg-gradient-to-r from-transparent via-primary/20 to-transparent" />

        {/* Checkbox Section - Enhanced */}
        <div className="space-y-4">
          <div className="flex items-start space-x-3 p-5 bg-gradient-to-br from-primary/8 via-primary/5 to-transparent rounded-xl border border-primary/15 hover:border-primary/30 transition-colors">
            <Checkbox
              id="terms-accept"
              checked={agreed}
              onCheckedChange={(checked) => setAgreed(checked as boolean)}
              className="mt-1.5 h-5 w-5"
            />
            <Label
              htmlFor="terms-accept"
              className="text-sm cursor-pointer flex-1 font-medium leading-relaxed text-foreground/90"
            >
              <span className="block mb-3">I have read and agree to both documents:</span>
              <div className="space-y-2 text-muted-foreground">
                <button
                  type="button"
                  onClick={() => setShowFullTerms(true)}
                  className="inline-flex items-center gap-1.5 text-primary hover:text-primary/80 font-semibold hover:underline transition-colors"
                >
                  <FileText className="h-4 w-4" />
                  Terms of Service
                </button>
                <span className="text-muted-foreground"> & </span>
                <button
                  type="button"
                  onClick={() => setShowFullPrivacy(true)}
                  className="inline-flex items-center gap-1.5 text-primary hover:text-primary/80 font-semibold hover:underline transition-colors"
                >
                  <Lock className="h-4 w-4" />
                  Privacy Policy
                </button>
                <p className="text-xs text-muted-foreground/80 pt-2">
                  I voluntarily provide my consent to PASOA for the collection and processing of my personal information in accordance with the Data Privacy Act of 2012.
                </p>
              </div>
            </Label>
          </div>

          {/* Buttons Section - Enhanced */}
          <div className="space-y-2 pt-2">
            <Button
              onClick={onAccept}
              disabled={!agreed || isLoading}
              className="w-full h-12 rounded-xl bg-gradient-to-r from-primary to-primary/90 hover:shadow-lg hover:shadow-primary/25 hover:opacity-95 font-semibold text-base transition-all duration-300 transform hover:scale-[1.01] active:scale-[0.99]"
            >
              {isLoading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Creating Account...
                </>
              ) : (
                "Continue to Sign Up"
              )}
            </Button>

            <Button
              type="button"
              variant="outline"
              onClick={handleCancel}
              className="w-full h-11 rounded-xl border-border/50 hover:bg-secondary/50 font-medium transition-colors"
            >
              Cancel
            </Button>
          </div>
        </div>

        {/* Footer Info */}
        <div className="pt-2 border-t border-border/30 text-center">
          <p className="text-xs text-muted-foreground/70">
            Both documents are required to proceed with account creation
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
