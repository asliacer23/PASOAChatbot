import { AlertCircle, ArrowLeft, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { PasoaMascot } from "@/features/shared/components/PasoaMascot";

export function NoAccountComponent() {
  const navigate = useNavigate();

  return (
    <Card className="border-border/50 shadow-elegant bg-card/95 backdrop-blur overflow-hidden animate-card-appear">
      <CardContent className="space-y-6 p-6 md:p-8 text-center animate-fade-in-up">
        <div className="space-y-4">
          <div className="flex justify-center animate-bounce">
            <AlertCircle className="h-16 w-16 text-destructive/70" />
          </div>
          <div className="space-y-2">
            <h2 className="text-xl md:text-2xl font-bold text-foreground animate-fade-in-down">
              Account Not Found
            </h2>
            <p className="text-sm md:text-base text-muted-foreground animate-fade-in-up" style={{ animationDelay: "0.1s" }}>
              We couldn't find an account associated with this email address. 
            </p>
            <p className="text-sm text-muted-foreground animate-fade-in-up" style={{ animationDelay: "0.2s" }}>
              Would you like to create a new account instead?
            </p>
          </div>
        </div>

        <div className="space-y-3 pt-4">
          <Button
            onClick={() => navigate("/auth")}
            className="w-full rounded-xl md:rounded-lg bg-gradient-primary hover:opacity-90 h-12 md:h-11 font-semibold transition-all duration-300 transform hover:scale-105 active:scale-95"
          >
            <UserPlus className="h-4 w-4 mr-2" />
            Create Account
          </Button>
          <Button
            variant="outline"
            onClick={() => navigate("/auth/forgot-password")}
            className="w-full rounded-xl md:rounded-lg h-12 md:h-11 font-semibold transition-all duration-300"
          >
            Try Another Email
          </Button>
          <Button
            variant="ghost"
            onClick={() => navigate("/auth")}
            className="w-full rounded-xl md:rounded-lg h-12 md:h-11 font-semibold transition-all duration-300"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Sign In
          </Button>
        </div>

        <p className="text-center text-xs text-muted-foreground animate-fade-in-up" style={{ animationDelay: "0.3s" }}>
          If you need help, please contact support.
        </p>
      </CardContent>
    </Card>
  );
}
