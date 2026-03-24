import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { ScrollArea } from "@/components/ui/scroll-area";

interface PrivacyPolicyProps {
  onAccept?: () => void;
  showAcceptButton?: boolean;
  compact?: boolean;
  onBack?: () => void;
}

export function PrivacyPolicy({ onAccept, showAcceptButton = false, compact = false, onBack }: PrivacyPolicyProps) {
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
              <CardTitle className="text-3xl">Privacy Policy</CardTitle>
              <CardDescription>How we protect and use your data</CardDescription>
            </CardHeader>
          )}
          
          <CardContent className={compact ? "space-y-0" : "space-y-6"}>
            <ScrollArea className={compact ? "h-96" : "h-auto"}>
              <div className={`space-y-6 ${compact ? "px-4" : ""} text-sm leading-relaxed`}>
                <div>
                  <h2 className="text-xl font-bold mb-3 text-foreground">DATA PRIVACY COMPLIANCE NOTICE</h2>
                  <p className="text-muted-foreground">
                    Your privacy is important to us. In Compliance with Republic Act No. 10173, PASOA Student Hub recognizes its responsibilities under the Data Privacy Act of 2012. We are committed to the protection of student privacy and the secure management of all personal data collected through our web-based communication system.
                  </p>
                </div>

                <div>
                  <h3 className="font-bold text-lg mb-2 text-foreground">What We Collect</h3>
                  <ul className="space-y-2 text-muted-foreground list-disc list-inside">
                    <li><strong>User Profiles:</strong> Basic identification (Name, Student Number, or Email) required for authentication.</li>
                    <li><strong>Chat History:</strong> Text queries and messages sent to the chatbot or admins.</li>
                    <li><strong>Media Attachments:</strong> Images uploaded by users to provide context for their queries.</li>
                    <li><strong>Technical Logs:</strong> IP addresses and browser types for security and system optimization.</li>
                  </ul>
                </div>

                <div>
                  <h3 className="font-bold text-lg mb-2 text-foreground">How We Use Your Information</h3>
                  <p className="text-muted-foreground mb-2">We use the collected data strictly for:</p>
                  <ul className="space-y-2 text-muted-foreground list-disc list-inside">
                    <li>Providing accurate answers to your questions.</li>
                    <li>Improving the chatbot's knowledge base.</li>
                    <li>Allowing PASOA Admins to follow up on complex issues.</li>
                  </ul>
                  <p className="text-muted-foreground mt-4">
                    PASOA Student Hub does not sell or rent your data. Information is only shared with authorized PASOA Administrators to resolve your specific queries or when required by university regulations or legal mandates. We retain chat logs and images only for as long as necessary to fulfill the service or as required by the university's data retention policy.
                  </p>
                </div>

                <div>
                  <h3 className="font-bold text-lg mb-2 text-foreground">Your Rights</h3>
                  <p className="text-muted-foreground">
                    You have the right to request access to your data or ask for the deletion of your chat history. Please contact the PASOA Admin Team for any privacy-related concerns.
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
                  ✓ I Accept the Privacy Policy
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

