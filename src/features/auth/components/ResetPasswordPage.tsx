import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Eye, EyeOff, Loader2, Check, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { PasoaMascot } from "@/features/shared/components/PasoaMascot";
import { ThemeToggle } from "@/features/shared/components/ThemeToggle";
import "./auth-animations.css";

const resetPasswordSchema = z.object({
  password: z.string().min(6, "Password must be at least 6 characters"),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>;

export function ResetPasswordPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isReset, setIsReset] = useState(false);
  const [sessionExists, setSessionExists] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  const form = useForm<ResetPasswordFormData>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { password: "", confirmPassword: "" },
  });

  useEffect(() => {
    // Check if there's a valid session for password reset
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setSessionExists(!!session);
      
      if (!session) {
        // Check if we have a recovery session from the reset link
        const { data } = await supabase.auth.refreshSession();
        setSessionExists(!!data.session);
      }
    };

    checkSession();
  }, []);

  const handleResetPassword = async (data: ResetPasswordFormData) => {
    setIsLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: data.password,
      });

      if (error) {
        toast({
          title: "Error",
          description: error.message,
          variant: "destructive",
        });
      } else {
        setIsReset(true);
        toast({
          title: "Success!",
          description: "Your password has been reset successfully.",
        });
        
        // Redirect to sign in after 2 seconds
        setTimeout(() => {
          navigate("/auth");
        }, 2000);
      }
    } catch (error) {
      console.error("Reset password error:", error);
      toast({
        title: "Error",
        description: "Failed to reset password. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (!sessionExists && !isReset) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-accent/20 flex flex-col items-center justify-center overflow-hidden relative py-6 md:py-0">
        {/* Theme Toggle */}
        <div className="absolute top-4 md:top-6 right-4 md:right-6 z-50">
          <ThemeToggle />
        </div>

        <div className="absolute inset-0 -z-10">
          <div className="absolute top-10 left-10 w-80 h-80 bg-gradient-to-br from-primary/15 to-transparent rounded-full blur-3xl animate-pulse-slow" />
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-gradient-to-tl from-primary/10 to-transparent rounded-full blur-3xl animate-float" />
        </div>

        <div className="w-full max-w-md animate-fade-in-right">
          <Card className="border-border/50 shadow-elegant bg-card/95 backdrop-blur overflow-hidden animate-card-appear">
            <CardContent className="space-y-6 p-6 md:p-8 text-center animate-fade-in-up">
              <div className="space-y-4">
                <PasoaMascot size="lg" mood="idle" />
                <h2 className="text-xl md:text-2xl font-bold text-foreground">
                  Invalid Reset Link
                </h2>
                <p className="text-sm md:text-base text-muted-foreground">
                  This password reset link has expired or is invalid. Please request a new one.
                </p>
              </div>

              <Button
                onClick={() => navigate("/auth/forgot-password")}
                className="w-full rounded-xl md:rounded-lg bg-gradient-primary hover:opacity-90 h-12 md:h-11 font-semibold"
              >
                Request New Link
              </Button>

              <Button
                variant="outline"
                onClick={() => navigate("/auth")}
                className="w-full rounded-xl md:rounded-lg h-12 md:h-11 font-semibold"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Sign In
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

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

      <div className="w-full max-w-md animate-fade-in-right">
        {/* Header Section */}
        <div className="text-center space-y-4 mb-8 animate-fade-in-down">
          <div className="flex justify-center animate-float-gentle">
            <PasoaMascot size="lg" mood="happy" />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent animate-text-shimmer">
              Set New Password
            </h1>
            <p className="text-sm md:text-base text-muted-foreground mt-2 animate-fade-in-up" style={{ animationDelay: "0.1s" }}>
              Create a strong password for your account.
            </p>
          </div>
        </div>

        {!isReset ? (
          <Card className="border-border/50 shadow-elegant bg-card/95 backdrop-blur overflow-hidden animate-card-appear">
            <CardHeader className="pb-4 md:pb-6 animate-fade-in-down md:p-6 p-4">
              <CardTitle className="text-xl md:text-2xl text-center animate-text-shimmer">
                New Password
              </CardTitle>
            </CardHeader>

            <CardContent className="space-y-6 animate-fade-in-up md:p-6 p-4" style={{ animationDelay: "0.1s" }}>
              <form onSubmit={form.handleSubmit(handleResetPassword)} className="space-y-4">
                <div className="space-y-2 animate-fade-in-up" style={{ animationDelay: "0s" }}>
                  <Label htmlFor="password" className="text-xs md:text-sm font-medium">
                    New Password
                  </Label>
                  <div className="relative w-full">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      {...form.register("password")}
                      className="w-full rounded-xl md:rounded-lg bg-secondary/50 border-border/50 h-12 md:h-11 pr-12 placeholder:text-muted-foreground/60 transition-all duration-300 hover:bg-secondary/70 focus:scale-[1.02] focus:bg-secondary/80 text-base md:text-sm"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0.5 top-1/2 -translate-y-1/2 h-10 w-10 p-0 hover:bg-primary/15 transition-all duration-200 hover:scale-125 active:scale-95 rounded-lg flex items-center justify-center z-10 pointer-events-auto"
                      onClick={() => setShowPassword(!showPassword)}
                      title={showPassword ? "Hide password" : "Show password"}
                    >
                      {showPassword ? (
                        <EyeOff className="h-5 w-5 text-primary/70 hover:text-primary transition-colors" />
                      ) : (
                        <Eye className="h-5 w-5 text-primary/70 hover:text-primary transition-colors" />
                      )}
                    </Button>
                  </div>
                  {form.formState.errors.password && (
                    <p className="text-xs text-destructive animate-shake">
                      {form.formState.errors.password.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2 animate-fade-in-up" style={{ animationDelay: "0.1s" }}>
                  <Label htmlFor="confirmPassword" className="text-xs md:text-sm font-medium">
                    Confirm Password
                  </Label>
                  <div className="relative w-full">
                    <Input
                      id="confirmPassword"
                      type={showConfirm ? "text" : "password"}
                      placeholder="••••••••"
                      {...form.register("confirmPassword")}
                      className="w-full rounded-xl md:rounded-lg bg-secondary/50 border-border/50 h-12 md:h-11 pr-12 placeholder:text-muted-foreground/60 transition-all duration-300 hover:bg-secondary/70 focus:scale-[1.02] focus:bg-secondary/80 text-base md:text-sm"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0.5 top-1/2 -translate-y-1/2 h-10 w-10 p-0 hover:bg-primary/15 transition-all duration-200 hover:scale-125 active:scale-95 rounded-lg flex items-center justify-center z-10 pointer-events-auto"
                      onClick={() => setShowConfirm(!showConfirm)}
                      title={showConfirm ? "Hide password" : "Show password"}
                    >
                      {showConfirm ? (
                        <EyeOff className="h-5 w-5 text-primary/70 hover:text-primary transition-colors" />
                      ) : (
                        <Eye className="h-5 w-5 text-primary/70 hover:text-primary transition-colors" />
                      )}
                    </Button>
                  </div>
                  {form.formState.errors.confirmPassword && (
                    <p className="text-xs text-destructive animate-shake">
                      {form.formState.errors.confirmPassword.message}
                    </p>
                  )}
                </div>

                <Button
                  type="submit"
                  className="w-full rounded-xl md:rounded-lg bg-gradient-primary hover:opacity-90 h-12 md:h-11 font-semibold transition-all duration-300 transform hover:scale-105 active:scale-95 animate-fade-in-up text-base md:text-sm mt-6"
                  style={{ animationDelay: "0.2s" }}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      Resetting...
                    </>
                  ) : (
                    <>
                      <Check className="h-4 w-4 mr-2" />
                      Reset Password
                    </>
                  )}
                </Button>
              </form>

              <p className="text-center text-xs text-muted-foreground animate-fade-in-up" style={{ animationDelay: "0.3s" }}>
                Make sure your password is at least 6 characters long.
              </p>
            </CardContent>
          </Card>
        ) : (
          <Card className="border-border/50 shadow-elegant bg-card/95 backdrop-blur overflow-hidden animate-card-appear">
            <CardContent className="space-y-6 p-6 md:p-8 animate-fade-in-up">
              <div className="text-center space-y-4">
                <div className="flex justify-center animate-float-gentle">
                  <div className="h-16 w-16 rounded-full bg-green-500/20 flex items-center justify-center">
                    <Check className="h-8 w-8 text-green-500 animate-bounce" />
                  </div>
                </div>
                <div className="space-y-2">
                  <h2 className="text-xl md:text-2xl font-bold text-foreground animate-fade-in-down">
                    Password Reset!
                  </h2>
                  <p className="text-sm md:text-base text-muted-foreground animate-fade-in-up" style={{ animationDelay: "0.1s" }}>
                    Your password has been successfully reset. You'll be redirected to sign in shortly.
                  </p>
                </div>
              </div>

              <Button
                onClick={() => navigate("/auth")}
                className="w-full rounded-xl md:rounded-lg bg-gradient-primary hover:opacity-90 h-12 md:h-11 font-semibold transition-all duration-300 transform hover:scale-105 active:scale-95"
              >
                Go to Sign In
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
