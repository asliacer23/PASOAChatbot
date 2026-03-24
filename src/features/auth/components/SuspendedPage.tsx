import { AlertTriangle, Mail, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "../hooks/useAuth";
import { PasoaMascot } from "@/features/shared/components/PasoaMascot";

interface SuspendedPageProps {
  reason?: string | null;
}

export function SuspendedPage({ reason }: SuspendedPageProps) {
  const { signOut, profile } = useAuth();

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-background via-background to-destructive/10">
      <div className="w-full max-w-md space-y-6 animate-fade-up">
        <div className="text-center space-y-4">
          <div className="flex justify-center">
            <div className="relative">
              <PasoaMascot size="lg" mood="idle" animate={false} />
              <div className="absolute -top-2 -right-2 bg-destructive rounded-full p-2">
                <AlertTriangle className="h-5 w-5 text-white" />
              </div>
            </div>
          </div>
          <div>
            <h1 className="text-2xl font-bold text-destructive">Account Suspended</h1>
            <p className="text-muted-foreground mt-1">
              Hi {profile?.first_name}, your account has been suspended.
            </p>
          </div>
        </div>

        <Card className="border-destructive/30 bg-destructive/5">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              Suspension Details
            </CardTitle>
            <CardDescription>
              Your access to Pasoa Student Hub has been restricted.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 rounded-xl bg-card border border-border">
              <p className="text-sm font-medium text-muted-foreground mb-2">Reason for suspension:</p>
              <p className="text-sm">
                {reason || "No specific reason provided. Please contact the administrator for more information."}
              </p>
            </div>

            <div className="space-y-3">
              <p className="text-sm font-medium">What can you do?</p>
              <ul className="text-sm text-muted-foreground space-y-2">
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-0.5">•</span>
                  Contact the Student Affairs Office for clarification
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-0.5">•</span>
                  Submit an appeal through official channels
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-0.5">•</span>
                  Wait for the suspension period to end (if temporary)
                </li>
              </ul>
            </div>

            <div className="flex flex-col gap-2 pt-2">
              <a 
                href="mailto:pasoastudenthub@gmail.com" 
                className="flex items-center gap-2 text-sm text-primary hover:underline"
              >
                <Mail className="h-4 w-4" />
                pasoastudenthub@gmail.com
              </a>
              <a 
                href="tel:+639123456789" 
                className="flex items-center gap-2 text-sm text-primary hover:underline"
              >
                <Phone className="h-4 w-4" />
                +63 912 345 6789
              </a>
            </div>
          </CardContent>
        </Card>

        <Button
          onClick={signOut}
          variant="outline"
          className="w-full rounded-xl"
        >
          Sign Out
        </Button>
      </div>
    </div>
  );
}
