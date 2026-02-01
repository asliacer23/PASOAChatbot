import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ArrowLeft, Loader2, Mail, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { PasoaMascot } from "@/features/shared/components/PasoaMascot";
import { ThemeToggle } from "@/features/shared/components/ThemeToggle";
import { NoAccountComponent } from "./NoAccountComponent";
import "./auth-animations.css";

const forgotPasswordSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
});

type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;

export function ForgotPasswordPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [accountNotFound, setAccountNotFound] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  const form = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: "" },
  });

  // Check if email exists in the system by querying auth.users through the profiles table
  const checkEmailExists = async (email: string): Promise<boolean> => {
    try {
      // Check if user exists in profiles table
      const { data, error } = await supabase
        .from("profiles")
        .select("id")
        .eq("email", email.toLowerCase())
        .single();

      if (error && error.code !== "PGRST116") {
        console.error("Error checking email:", error);
        return false;
      }

      return !!data;
    } catch (error) {
      console.error("Error checking email:", error);
      return false;
    }
  };

  const handleForgotPassword = async (data: ForgotPasswordFormData) => {
    setIsLoading(true);
    try {
      // First, check if the account exists
      const emailExists = await checkEmailExists(data.email);

      if (!emailExists) {
        setAccountNotFound(true);
        toast({
          title: "Account Not Found",
          description: "No account is registered with this email address.",
          variant: "destructive",
        });
        setIsLoading(false);
        return;
      }

      // If account exists, send the reset email
      const { error } = await supabase.auth.resetPasswordForEmail(data.email, {
        redirectTo: `${window.location.origin}/auth/reset-password`,
      });

      if (error) {
        toast({
          title: "Error",
          description: error.message,
          variant: "destructive",
        });
      } else {
        setIsSubmitted(true);
        toast({
          title: "Success!",
          description: "Check your email for a password reset link.",
        });
      }
    } catch (error) {
      console.error("Forgot password error:", error);
      toast({
        title: "Error",
        description: "Failed to send reset email. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-accent/20 flex flex-col items-center justify-center overflow-hidden relative py-6 md:py-0">
      {/* Theme Toggle */}
      <div className="absolute top-4 md:top-6 right-4 md:right-6 z-50">
        <ThemeToggle />
      </div>

      {/* Animated background elements */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-10 left-10 w-80 h-80 bg-gradient-to-br from-primary/15 to-transparent rounded-full blur-3xl animate-pulse-slow" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-gradient-to-tl from-primary/10 to-transparent rounded-full blur-3xl animate-float" />
      </div>

      {/* Back Button */}
      <Button
        variant="outline"
        size="sm"
        className="absolute top-4 md:top-6 left-4 md:left-6 h-10 md:h-9 px-3 md:px-2.5 border-border/50 hover:bg-primary/10 hover:border-primary/50 transition-all duration-200 flex items-center gap-1.5 text-sm"
        onClick={() => navigate("/auth")}
      >
        <ArrowLeft className="h-4 w-4" />
        <span className="hidden md:inline">Back</span>
      </Button>

      <div className="w-full max-w-md animate-fade-in-right">
        {/* Header Section */}
        <div className="text-center space-y-4 mb-8 animate-fade-in-down">
          <div className="flex justify-center animate-float-gentle">
            <PasoaMascot size="lg" mood={accountNotFound ? "idle" : "thinking"} />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent animate-text-shimmer">
              {accountNotFound ? "Account Not Found" : "Forgot Password?"}
            </h1>
            <p className="text-sm md:text-base text-muted-foreground mt-2 animate-fade-in-up" style={{ animationDelay: "0.1s" }}>
              {accountNotFound ? "No account is registered with this email." : "No worries! We'll help you reset it."}
            </p>
          </div>
        </div>

        {accountNotFound ? (
          <NoAccountComponent />
        ) : !isSubmitted ? (
          <Card className="border-border/50 shadow-elegant bg-card/95 backdrop-blur overflow-hidden animate-card-appear">
            <CardHeader className="pb-4 md:pb-6 animate-fade-in-down md:p-6 p-4">
              <CardTitle className="text-xl md:text-2xl text-center animate-text-shimmer">
                Reset Password
              </CardTitle>
            </CardHeader>

            <CardContent className="space-y-6 animate-fade-in-up md:p-6 p-4" style={{ animationDelay: "0.1s" }}>
              <form onSubmit={form.handleSubmit(handleForgotPassword)} className="space-y-4">
                <div className="space-y-2 animate-fade-in-up" style={{ animationDelay: "0s" }}>
                  <Label htmlFor="email" className="text-xs md:text-sm font-medium">
                    Email Address
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@example.com"
                    {...form.register("email")}
                    className="rounded-xl md:rounded-lg bg-secondary/50 border-border/50 h-12 md:h-11 placeholder:text-muted-foreground/60 transition-all duration-300 hover:bg-secondary/70 focus:scale-[1.02] focus:bg-secondary/80 text-base md:text-sm"
                  />
                  {form.formState.errors.email && (
                    <p className="text-xs text-destructive animate-shake">
                      {form.formState.errors.email.message}
                    </p>
                  )}
                  <p className="text-xs text-muted-foreground mt-2">
                    Enter the email address associated with your account.
                  </p>
                </div>

                <Button
                  type="submit"
                  className="w-full rounded-xl md:rounded-lg bg-gradient-primary hover:opacity-90 h-12 md:h-11 font-semibold transition-all duration-300 transform hover:scale-105 active:scale-95 animate-fade-in-up text-base md:text-sm"
                  style={{ animationDelay: "0.1s" }}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <Mail className="h-4 w-4 mr-2" />
                      Send Reset Link
                    </>
                  )}
                </Button>
              </form>

              <div className="pt-4 border-t border-border/50">
                <p className="text-center text-xs text-muted-foreground animate-fade-in-up" style={{ animationDelay: "0.2s" }}>
                  Remember your password?{" "}
                  <button
                    onClick={() => navigate("/auth")}
                    className="text-primary hover:text-primary/80 hover:underline transition-colors"
                  >
                    Sign in
                  </button>
                </p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card className="border-border/50 shadow-elegant bg-card/95 backdrop-blur overflow-hidden animate-card-appear">
            <CardContent className="space-y-6 p-6 md:p-8 animate-fade-in-up">
              <div className="text-center space-y-4">
                <div className="flex justify-center animate-float-gentle">
                  <CheckCircle className="h-16 w-16 text-green-500 animate-bounce" />
                </div>
                <div className="space-y-2">
                  <h2 className="text-xl md:text-2xl font-bold text-foreground animate-fade-in-down">
                    Email Sent!
                  </h2>
                  <p className="text-sm md:text-base text-muted-foreground animate-fade-in-up" style={{ animationDelay: "0.1s" }}>
                    Check your email for a link to reset your password. The link will expire in 1 hour.
                  </p>
                </div>
              </div>

              <div className="space-y-3 pt-4">
                <Button
                  onClick={() => navigate("/auth")}
                  className="w-full rounded-xl md:rounded-lg bg-gradient-primary hover:opacity-90 h-12 md:h-11 font-semibold transition-all duration-300 transform hover:scale-105 active:scale-95"
                >
                  Back to Sign In
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsSubmitted(false);
                    setAccountNotFound(false);
                    form.reset();
                  }}
                  className="w-full rounded-xl md:rounded-lg h-12 md:h-11 font-semibold transition-all duration-300"
                >
                  Try Another Email
                </Button>
              </div>

              <p className="text-center text-xs text-muted-foreground animate-fade-in-up" style={{ animationDelay: "0.2s" }}>
                Didn't receive the email? Check your spam folder or try again.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
