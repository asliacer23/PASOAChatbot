import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { ScrollArea } from "@/components/ui/scroll-area";

interface TermsOfServiceProps {
  onAccept?: () => void;
  showAcceptButton?: boolean;
  compact?: boolean;
  onBack?: () => void;
}

export function TermsOfService({ onAccept, showAcceptButton = true, compact = false, onBack }: TermsOfServiceProps) {
  const navigate = useNavigate();

  const handleBack = () => {
    if (onBack) {
      onBack();
      return;
    }

    if (window.history.length > 1) {
      navigate(-1);
      return;
    }

    navigate("/");
  };

  return (
    <div className={compact ? "" : "min-h-screen bg-gradient-to-br from-background via-background to-accent/5 py-8 px-4"}>
      <div className={compact ? "" : "w-full px-4 sm:px-6 lg:px-8"}>
        <Card className={compact ? "border-0 bg-transparent shadow-none" : "border-border/50 shadow-elegant bg-card/95 backdrop-blur"}>
          {!compact && (
            <CardHeader className="pb-6">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleBack}
                className="w-fit mb-4"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
              <CardTitle className="text-3xl">Terms of Service</CardTitle>
              <CardDescription>Please read our terms carefully before creating an account</CardDescription>
            </CardHeader>
          )}
          
          <CardContent className={compact ? "space-y-0" : "space-y-6"}>
            <ScrollArea className={compact ? "h-96" : "h-auto"}>
              <div className={`space-y-6 ${compact ? "px-4" : ""} text-sm leading-relaxed`}>
                <div>
                  <h2 className="text-xl font-bold mb-3 text-foreground">Hi there, PASOAnian! 👋</h2>
                  <p className="text-muted-foreground">
                    We're so glad you're here. This hub was built to make your life as a BSOAD student easier. By using our website, you're joining our digital community and agreeing to comply with the following terms:
                  </p>
                </div>

                <div>
                  <h3 className="font-bold text-lg mb-2 text-foreground">Description of Service and User Conduct</h3>
                  <p className="text-muted-foreground mb-3">
                    PASOA Student Hub is a communication platform designed for members of the PASOA organization. It provides automated responses to queries, access to announcements, and a portal for direct communication with organization administrators.
                  </p>
                  <p className="text-muted-foreground font-semibold mb-2">To maintain a productive environment, users agree not to:</p>
                  <ul className="space-y-2 text-muted-foreground list-disc list-inside">
                    <li>Submit queries containing offensive or inappropriate language.</li>
                    <li>Upload images that violate university policies or contain sensitive personal data of others.</li>
                    <li>Attempt to bypass the chatbot's security or disrupt the admin dashboard.</li>
                  </ul>
                </div>

                <div>
                  <h3 className="font-bold text-lg mb-2 text-foreground">Limitations of PASOA Student Hub</h3>
                  <p className="text-muted-foreground">
                    The PASOA Student Hub chatbot uses automated processing to provide immediate answers. While we strive for accuracy, the chatbot may occasionally provide outdated or incorrect information. For official university matters, always verify through the Admin View or official PASOA announcements.
                  </p>
                  <p className="text-muted-foreground mt-3">
                    Questions that the chatbot cannot resolve will be forwarded to the PASOA Admin Team. We do not guarantee an immediate response time for manual queries, but we aim to support students as efficiently as possible.
                  </p>
                </div>

                <div className="pt-4 border-t border-border/50">
                  <p className="text-sm text-muted-foreground text-center">
                    For our data privacy practices, please see our <a href="/privacy" className="text-primary hover:underline font-semibold">Privacy Policy</a>.
                  </p>
                </div>

                
              </div>
            </ScrollArea>

            {showAcceptButton && (
              <div className={`pt-6 space-y-4 border-t border-border/50 ${compact ? "" : ""}`}>
                <Button
                  onClick={onAccept}
                  className="w-full rounded-xl bg-gradient-primary hover:opacity-90 h-12 font-semibold"
                >
                  ✓ I Accept the Terms of Service
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

