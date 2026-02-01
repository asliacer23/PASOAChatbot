import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Eye, EyeOff, Loader2, LogIn, UserPlus, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "../hooks/useAuth";
import { useLoginAttempts } from "../hooks/useLoginAttempts";
import { TermsAcceptance } from "./TermsAcceptance";
import { NoAccountComponent } from "./NoAccountComponent";
import { PasoaMascot } from "@/features/shared/components/PasoaMascot";
import { ThemeToggle } from "@/features/shared/components/ThemeToggle";
import { supabase } from "@/integrations/supabase/client";
import "./auth-animations.css";

const signInSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

const signUpSchema = z.object({
  firstName: z.string().min(2, "First name must be at least 2 characters"),
  lastName: z.string().min(2, "Last name must be at least 2 characters"),
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type SignInFormData = z.infer<typeof signInSchema>;
type SignUpFormData = z.infer<typeof signUpSchema>;

export function AuthPage() {
  const [showSignInPassword, setShowSignInPassword] = useState(false);
  const [showSignUpPassword, setShowSignUpPassword] = useState(false);
  const [showSignUpConfirm, setShowSignUpConfirm] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("signin");
  const [showTermsAcceptance, setShowTermsAcceptance] = useState(false);
  const [showEmailVerification, setShowEmailVerification] = useState(false);
  const [verificationEmail, setVerificationEmail] = useState("");
  const [redirectCountdown, setRedirectCountdown] = useState(15);
  const { signIn, signUp } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const { recordFailedAttempt, checkLoginStatus, clearLoginAttempts } = useLoginAttempts();

  // Auto-redirect to login after 15 seconds on email verification screen
  useEffect(() => {
    if (showEmailVerification) {
      const timer = setInterval(() => {
        setRedirectCountdown((prev) => {
          if (prev <= 1) {
            navigate("/auth");
            return 15;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [showEmailVerification, navigate]);

  const signInForm = useForm<SignInFormData>({
    resolver: zodResolver(signInSchema),
    defaultValues: { email: "", password: "" },
  });

  const signUpForm = useForm<SignUpFormData>({
    resolver: zodResolver(signUpSchema),
    defaultValues: { firstName: "", lastName: "", email: "", password: "", confirmPassword: "" },
  });

  const handleSignIn = async (data: SignInFormData) => {
    // Check if account is locked due to too many failed attempts
    const loginStatus = checkLoginStatus();
    if (loginStatus.isLocked) {
      const minutes = Math.ceil(loginStatus.remainingTime / 60);
      toast({
        title: "Account Locked",
        description: `Too many failed attempts. Please try again in ${minutes} minute${minutes > 1 ? "s" : ""}.`,
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    const { error } = await signIn(data.email, data.password);
    setIsLoading(false);

    if (error) {
      // Record the failed attempt
      const attemptStatus = recordFailedAttempt();
      
      if (attemptStatus.isLocked) {
        toast({
          title: "Account Locked",
          description: `Too many failed attempts. Please try again in ${Math.ceil(attemptStatus.remainingTime / 60)} minutes.`,
          variant: "destructive",
        });
      } else {
        const warningMessage = attemptStatus.attemptsRemaining <= 2 
          ? ` (${attemptStatus.attemptsRemaining} attempts remaining before lockout)`
          : "";
        
        toast({
          title: "Sign in failed",
          description: (error.message === "Invalid login credentials" 
            ? "Invalid email or password. Please try again."
            : error.message) + warningMessage,
          variant: "destructive",
        });
      }
    } else {
      // Clear failed attempts on successful login
      clearLoginAttempts();
      toast({
        title: "Welcome back!",
        description: "You have successfully signed in.",
      });
      navigate("/");
    }
  };

  const handleSignUp = async (data: SignUpFormData) => {
    // Show terms acceptance first
    setShowTermsAcceptance(true);
    // Store the signup data in localStorage temporarily
    localStorage.setItem("pendingSignupData", JSON.stringify(data));
  };

  const handleSignUpAfterTerms = async () => {
    const pendingData = localStorage.getItem("pendingSignupData");
    if (!pendingData) {
      toast({
        title: "Error",
        description: "Signup data was lost. Please try again.",
        variant: "destructive",
      });
      return;
    }

    const data = JSON.parse(pendingData) as SignUpFormData;
    setIsLoading(true);
    const { error } = await signUp(data.email, data.password, data.firstName, data.lastName);
    setIsLoading(false);
    localStorage.removeItem("pendingSignupData");

    if (error) {
      let message = error.message;
      if (error.message.includes("already registered")) {
        message = "An account with this email already exists. Please sign in instead.";
      }
      toast({
        title: "Sign up failed",
        description: message,
        variant: "destructive",
      });
    } else {
      // Show email verification screen
      setVerificationEmail(data.email);
      setShowEmailVerification(true);
      setShowTermsAcceptance(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/`,
        },
      });
      if (error) {
        toast({
          title: "Google sign in failed",
          description: error.message,
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Google sign in error:", error);
      toast({
        title: "Error",
        description: "Failed to sign in with Google",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {showEmailVerification ? (
        <div className="min-h-screen bg-gradient-to-br from-background via-background to-accent/20 flex flex-col items-center justify-center overflow-hidden relative p-4">
          {/* Theme Toggle */}
          <div className="absolute top-4 md:top-6 right-4 md:right-6 z-50">
            <ThemeToggle />
          </div>
          <div className="w-full max-w-2xl">
            <div className="flex flex-col items-center justify-center space-y-6">
              <div className="text-center space-y-4 animate-fade-in-down">
                <div className="flex justify-center animate-float-gentle">
                  <PasoaMascot size="lg" mood="happy" />
                </div>
                <div className="space-y-2">
                  <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent animate-text-shimmer">
                    Check Your Email
                  </h1>
                  <p className="text-sm md:text-base text-muted-foreground animate-fade-in-up" style={{ animationDelay: "0.1s" }}>
                    We've sent a verification link to
                  </p>
                  <p className="text-base md:text-lg font-semibold text-foreground animate-fade-in-up" style={{ animationDelay: "0.2s" }}>
                    {verificationEmail}
                  </p>
                </div>
              </div>

              <Card className="border-border/50 shadow-elegant bg-card/95 backdrop-blur overflow-hidden animate-card-appear w-full max-w-md">
                <CardContent className="space-y-6 p-6 md:p-8 text-center animate-fade-in-up">
                  <div className="space-y-4">
                    <div className="bg-primary/10 border border-primary/20 rounded-lg p-4 space-y-2">
                      <p className="text-sm font-medium text-foreground">What's next?</p>
                      <ul className="text-sm text-muted-foreground space-y-2 text-left">
                        <li>✓ Click the link in your email to verify your account</li>
                        <li>✓ The link will expire in 24 hours</li>
                        <li>✓ Check your spam folder if you don't see it</li>
                      </ul>
                    </div>

                    <div className="pt-2 space-y-3">
                      <Button
                        onClick={() => navigate("/auth")}
                        className="w-full rounded-xl md:rounded-lg bg-gradient-primary hover:opacity-90 h-12 md:h-11 font-semibold transition-all duration-300"
                      >
                        Back to Sign In
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => {
                          setShowEmailVerification(false);
                          setVerificationEmail("");
                          setRedirectCountdown(15);
                          setActiveTab("signup");
                        }}
                        className="w-full rounded-xl md:rounded-lg h-12 md:h-11 font-semibold transition-all duration-300"
                      >
                        Use Different Email
                      </Button>
                    </div>

                    <div className="pt-4 border-t border-border/50">
                      <p className="text-xs text-muted-foreground mb-2">
                        Redirecting to Sign In in{" "}
                        <span className="font-semibold text-primary">{redirectCountdown}s</span>
                      </p>
                      <div className="w-full h-1 bg-secondary rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-primary to-primary/60 transition-all duration-1000"
                          style={{
                            width: `${(redirectCountdown / 15) * 100}%`,
                          }}
                        />
                      </div>
                    </div>
                  </div>

                  <p className="text-xs text-muted-foreground">
                    Didn't receive the email? Check your spam folder or contact support.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      ) : showTermsAcceptance ? (
        <div className="min-h-screen bg-gradient-to-br from-background via-background to-accent/20 flex flex-col items-center justify-center overflow-hidden relative p-4">
          {/* Theme Toggle */}
          <div className="absolute top-4 md:top-6 right-4 md:right-6 z-50">
            <ThemeToggle />
          </div>
          <div className="w-full max-w-2xl">
            <TermsAcceptance
              onAccept={handleSignUpAfterTerms}
              onCancel={() => {
                setShowTermsAcceptance(false);
                setActiveTab("signup");
              }}
              isLoading={isLoading}
            />
          </div>
        </div>
      ) : (
        <div className="min-h-screen bg-gradient-to-br from-background via-background to-accent/20 flex flex-col items-center justify-center overflow-hidden relative">
      {/* Theme Toggle */}
      <div className="absolute top-4 md:top-6 right-4 md:right-6 z-50">
        <ThemeToggle />
      </div>

      {/* Animated background elements */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-10 left-10 w-80 h-80 bg-gradient-to-br from-primary/15 to-transparent rounded-full blur-3xl animate-pulse-slow" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-gradient-to-tl from-primary/10 to-transparent rounded-full blur-3xl animate-float" />
      </div>

      {/* Mobile Header */}
      <div className="md:hidden w-full px-4 pt-8 pb-6 text-center space-y-4 animate-fade-in-down sticky top-0 z-10 bg-gradient-to-b from-background to-transparent">
        <div className="flex justify-center animate-float-gentle">
          <PasoaMascot size="lg" mood={activeTab === "signin" ? "happy" : "waving"} />
        </div>
        <div className="space-y-1">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent animate-text-shimmer">
            PASOA Student Hub
          </h1>
          <p className="text-xs text-muted-foreground animate-fade-in-up" style={{ animationDelay: "0.1s" }}>
            Your one-stop student assistant
          </p>
        </div>
      </div>

      <div className="w-full max-w-6xl mx-auto px-4 md:py-0 py-0">
        <div className="grid md:grid-cols-2 gap-8 items-center">
          {/* Left Column - Welcome Section (Desktop only) */}
          <div className="hidden md:flex flex-col justify-center items-center space-y-8 py-12 animate-fade-in-left">
            {/* Mascot and Welcome Message */}
            <div className="space-y-6 text-center">
              <div className="flex justify-center animate-float-gentle">
                <PasoaMascot size="xl" mood={activeTab === "signin" ? "happy" : "waving"} />
              </div>
              
              {activeTab === "signin" ? (
                <div className="space-y-3 animate-fade-in-down">
                  <h2 className="text-5xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent leading-tight animate-text-shimmer">
                    Sign in to<br />PASOA Student Hub
                  </h2>
                  <p className="text-lg text-muted-foreground animate-fade-in-up" style={{ animationDelay: "0.2s" }}>
                    Your one-stop student assistant
                  </p>
                </div>
              ) : (
                <div className="space-y-3 animate-fade-in-down">
                  <h2 className="text-5xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent leading-tight animate-text-shimmer">
                    Welcome<br />PASOAnian!
                  </h2>
                  <p className="text-lg text-muted-foreground animate-fade-in-up" style={{ animationDelay: "0.2s" }}>
                    Join our student community today
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Right Column - Auth Forms */}
          <div className="w-full space-y-4 md:space-y-6 animate-fade-in-right md:mb-0 mb-8">
            <Card className="border-border/50 shadow-elegant bg-card/95 backdrop-blur overflow-hidden animate-card-appear md:rounded-2xl rounded-3xl md:w-full w-full">
              <CardHeader className="pb-4 md:pb-6 animate-fade-in-down md:p-6 p-4">
                <CardTitle className="text-xl md:text-2xl text-center animate-text-shimmer">
                  {activeTab === "signin" ? "Sign In" : "Create an Account"}
                </CardTitle>
              </CardHeader>

              <CardContent className="space-y-4 md:space-y-6 animate-fade-in-up md:p-6 p-4" style={{ animationDelay: "0.1s" }}>
                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                  <TabsList className="grid w-full grid-cols-2 bg-secondary/50 mb-4 md:mb-6 rounded-xl md:rounded-lg p-1">
                    <TabsTrigger value="signin" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-lg text-sm md:text-base py-2 transition-all duration-300 transform hover:scale-105">
                      <LogIn className="h-4 w-4 mr-1.5" />
                      <span className="hidden sm:inline">Sign In</span>
                      <span className="sm:hidden">In</span>
                    </TabsTrigger>
                    <TabsTrigger value="signup" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-lg text-sm md:text-base py-2 transition-all duration-300 transform hover:scale-105">
                      <UserPlus className="h-4 w-4 mr-1.5" />
                      <span className="hidden sm:inline">Sign Up</span>
                      <span className="sm:hidden">Up</span>
                    </TabsTrigger>
                  </TabsList>

                  {/* Sign In Tab */}
                  <TabsContent value="signin" className="space-y-3 md:space-y-4 mt-4">
                    {checkLoginStatus().isLocked && (
                      <Alert variant="destructive" className="bg-destructive/10 border-destructive/30 rounded-xl md:rounded-lg">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription className="text-xs md:text-sm">
                          Too many failed login attempts. Please try again in {Math.ceil(checkLoginStatus().remainingTime / 60)} minute{Math.ceil(checkLoginStatus().remainingTime / 60) > 1 ? "s" : ""}.
                        </AlertDescription>
                      </Alert>
                    )}
                    <form onSubmit={signInForm.handleSubmit(handleSignIn)} className="space-y-3 md:space-y-4">
                      <div className="space-y-2 animate-fade-in-up" style={{ animationDelay: "0s" }}>
                        <Label htmlFor="signin-email" className="text-xs md:text-sm font-medium">Email</Label>
                        <Input
                          id="signin-email"
                          type="email"
                          placeholder="you@example.com"
                          {...signInForm.register("email")}
                          className="rounded-xl md:rounded-lg bg-secondary/50 border-border/50 h-12 md:h-11 placeholder:text-muted-foreground/60 transition-all duration-300 hover:bg-secondary/70 focus:scale-[1.02] focus:bg-secondary/80 text-base md:text-sm"
                        />
                        {signInForm.formState.errors.email && (
                          <p className="text-xs text-destructive animate-shake">{signInForm.formState.errors.email.message}</p>
                        )}
                      </div>

                      <div className="space-y-2 animate-fade-in-up" style={{ animationDelay: "0.1s" }}>
                        <div className="flex justify-between items-center">
                          <Label htmlFor="signin-password" className="text-xs md:text-sm font-medium">Password</Label>
                          <button
                            type="button"
                            onClick={() => navigate("/auth/forgot-password")}
                            className="text-xs text-primary hover:text-primary/80 hover:underline transition-colors font-medium"
                          >
                            Forgot Password?
                          </button>
                        </div>
                        <div className="relative w-full">
                          <Input
                            id="signin-password"
                            type={showSignInPassword ? "text" : "password"}
                            placeholder="••••••••"
                            {...signInForm.register("password")}
                            className="w-full rounded-xl md:rounded-lg bg-secondary/50 border-border/50 h-12 md:h-11 pr-12 placeholder:text-muted-foreground/60 transition-all duration-300 hover:bg-secondary/70 focus:scale-[1.02] focus:bg-secondary/80 text-base md:text-sm"
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="absolute right-0.5 top-1/2 -translate-y-1/2 h-10 w-10 p-0 hover:bg-primary/15 transition-all duration-200 hover:scale-125 active:scale-95 rounded-lg flex items-center justify-center z-10 pointer-events-auto"
                            onClick={() => setShowSignInPassword(!showSignInPassword)}
                            title={showSignInPassword ? "Hide password" : "Show password"}
                          >
                            {showSignInPassword ? (
                              <EyeOff className="h-5 w-5 text-primary/70 hover:text-primary transition-colors" />
                            ) : (
                              <Eye className="h-5 w-5 text-primary/70 hover:text-primary transition-colors" />
                            )}
                          </Button>
                        </div>
                        {signInForm.formState.errors.password && (
                          <p className="text-xs text-destructive animate-shake">{signInForm.formState.errors.password.message}</p>
                        )}
                      </div>

                      <Button
                        type="submit"
                        className="w-full rounded-xl md:rounded-lg bg-gradient-primary hover:opacity-90 h-12 md:h-11 font-semibold transition-all duration-300 transform hover:scale-105 active:scale-95 animate-fade-in-up text-base md:text-sm"
                        style={{ animationDelay: "0.2s" }}
                        disabled={isLoading}
                      >
                        {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <LogIn className="h-4 w-4 mr-2" />}
                        Sign In
                      </Button>
                    </form>
                  </TabsContent>

                  {/* Sign Up Tab */}
                  <TabsContent value="signup" className="space-y-3 md:space-y-4 mt-4">
                    <form onSubmit={signUpForm.handleSubmit(handleSignUp)} className="space-y-3 md:space-y-4">
                      <div className="grid grid-cols-2 gap-2 md:gap-4">
                        <div className="space-y-2 animate-fade-in-up" style={{ animationDelay: "0s" }}>
                          <Label htmlFor="signup-firstname" className="text-xs md:text-sm font-medium">Name</Label>
                          <Input
                            id="signup-firstname"
                            placeholder="Juan"
                            {...signUpForm.register("firstName")}
                            className="rounded-xl md:rounded-lg bg-secondary/50 border-border/50 h-12 md:h-11 placeholder:text-muted-foreground/60 transition-all duration-300 hover:bg-secondary/70 focus:scale-[1.02] focus:bg-secondary/80 text-base md:text-sm"
                          />
                          {signUpForm.formState.errors.firstName && (
                            <p className="text-xs text-destructive animate-shake">{signUpForm.formState.errors.firstName.message}</p>
                          )}
                        </div>
                        <div className="space-y-2 animate-fade-in-up" style={{ animationDelay: "0.05s" }}>
                          <Label htmlFor="signup-lastname" className="text-xs md:text-sm font-medium">Last Name</Label>
                          <Input
                            id="signup-lastname"
                            placeholder="Dela Cruz"
                            {...signUpForm.register("lastName")}
                            className="rounded-xl md:rounded-lg bg-secondary/50 border-border/50 h-12 md:h-11 placeholder:text-muted-foreground/60 transition-all duration-300 hover:bg-secondary/70 focus:scale-[1.02] focus:bg-secondary/80 text-base md:text-sm"
                          />
                          {signUpForm.formState.errors.lastName && (
                            <p className="text-xs text-destructive animate-shake">{signUpForm.formState.errors.lastName.message}</p>
                          )}
                        </div>
                      </div>

                      <div className="space-y-2 animate-fade-in-up" style={{ animationDelay: "0.1s" }}>
                        <Label htmlFor="signup-email" className="text-xs md:text-sm font-medium">Email</Label>
                        <Input
                          id="signup-email"
                          type="email"
                          placeholder="you@example.com"
                          {...signUpForm.register("email")}
                          className="rounded-xl md:rounded-lg bg-secondary/50 border-border/50 h-12 md:h-11 placeholder:text-muted-foreground/60 transition-all duration-300 hover:bg-secondary/70 focus:scale-[1.02] focus:bg-secondary/80 text-base md:text-sm"
                        />
                        {signUpForm.formState.errors.email && (
                          <p className="text-xs text-destructive animate-shake">{signUpForm.formState.errors.email.message}</p>
                        )}
                      </div>

                      <div className="space-y-2 animate-fade-in-up" style={{ animationDelay: "0.15s" }}>
                        <Label htmlFor="signup-password" className="text-xs md:text-sm font-medium">Password</Label>
                        <div className="relative w-full">
                          <Input
                            id="signup-password"
                            type={showSignUpPassword ? "text" : "password"}
                            placeholder="••••••••"
                            {...signUpForm.register("password")}
                            className="w-full rounded-xl md:rounded-lg bg-secondary/50 border-border/50 h-12 md:h-11 pr-12 placeholder:text-muted-foreground/60 transition-all duration-300 hover:bg-secondary/70 focus:scale-[1.02] focus:bg-secondary/80 text-base md:text-sm"
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="absolute right-0.5 top-1/2 -translate-y-1/2 h-10 w-10 p-0 hover:bg-primary/15 transition-all duration-200 hover:scale-125 active:scale-95 rounded-lg flex items-center justify-center z-10 pointer-events-auto"
                            onClick={() => setShowSignUpPassword(!showSignUpPassword)}
                            title={showSignUpPassword ? "Hide password" : "Show password"}
                          >
                            {showSignUpPassword ? (
                              <EyeOff className="h-5 w-5 text-primary/70 hover:text-primary transition-colors" />
                            ) : (
                              <Eye className="h-5 w-5 text-primary/70 hover:text-primary transition-colors" />
                            )}
                          </Button>
                        </div>
                        {signUpForm.formState.errors.password && (
                          <p className="text-xs text-destructive animate-shake">{signUpForm.formState.errors.password.message}</p>
                        )}
                      </div>

                      <div className="space-y-2 animate-fade-in-up" style={{ animationDelay: "0.2s" }}>
                        <Label htmlFor="signup-confirm" className="text-xs md:text-sm font-medium">Confirm Password</Label>
                        <div className="relative w-full">
                          <Input
                            id="signup-confirm"
                            type={showSignUpConfirm ? "text" : "password"}
                            placeholder="••••••••"
                            {...signUpForm.register("confirmPassword")}
                            className="w-full rounded-xl md:rounded-lg bg-secondary/50 border-border/50 h-12 md:h-11 pr-12 placeholder:text-muted-foreground/60 transition-all duration-300 hover:bg-secondary/70 focus:scale-[1.02] focus:bg-secondary/80 text-base md:text-sm"
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="absolute right-0.5 top-1/2 -translate-y-1/2 h-10 w-10 p-0 hover:bg-primary/15 transition-all duration-200 hover:scale-125 active:scale-95 rounded-lg flex items-center justify-center z-10 pointer-events-auto"
                            onClick={() => setShowSignUpConfirm(!showSignUpConfirm)}
                            title={showSignUpConfirm ? "Hide password" : "Show password"}
                          >
                            {showSignUpConfirm ? (
                              <EyeOff className="h-5 w-5 text-primary/70 hover:text-primary transition-colors" />
                            ) : (
                              <Eye className="h-5 w-5 text-primary/70 hover:text-primary transition-colors" />
                            )}
                          </Button>
                        </div>
                        {signUpForm.formState.errors.confirmPassword && (
                          <p className="text-xs text-destructive animate-shake">{signUpForm.formState.errors.confirmPassword.message}</p>
                        )}
                      </div>

                      <Button
                        type="submit"
                        className="w-full rounded-xl md:rounded-lg bg-gradient-primary hover:opacity-90 h-12 md:h-11 font-semibold transition-all duration-300 transform hover:scale-105 active:scale-95 animate-fade-in-up text-base md:text-sm"
                        style={{ animationDelay: "0.25s" }}
                        disabled={isLoading}
                      >
                        {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <UserPlus className="h-4 w-4 mr-2" />}
                        Sign Up
                      </Button>
                    </form>
                  </TabsContent>
                </Tabs>

                {/* Divider */}
                <div className="relative animate-fade-in-up" style={{ animationDelay: "0.3s" }}>
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-border/50 animate-expand-horizontal"></div>
                  </div>
                  <div className="relative flex justify-center text-xs uppercase tracking-wide">
                    <span className="bg-card px-2 md:px-3 text-muted-foreground text-xs md:text-xs">Or continue with</span>
                  </div>
                </div>

                {/* Google OAuth Button */}
                <Button
                  type="button"
                  variant="outline"
                  className="w-full rounded-xl md:rounded-lg h-12 md:h-11 border-border/50 hover:bg-secondary/50 font-medium transition-all duration-300 transform hover:scale-105 active:scale-95 hover:shadow-lg animate-fade-in-up text-base md:text-sm"
                  style={{ animationDelay: "0.35s" }}
                  onClick={handleGoogleSignIn}
                  disabled={isLoading}
                >
                  <svg className="h-5 w-5 mr-2 transition-transform group-hover:rotate-12" viewBox="0 0 24 24">
                    <path
                      fill="currentColor"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="currentColor"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="currentColor"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    />
                    <path
                      fill="currentColor"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    />
                  </svg>
                  <span className="hidden sm:inline">
                    {isLoading ? "Signing in..." : "Google"}
                  </span>
                  <span className="sm:hidden">
                    {isLoading ? "..." : "Google"}
                  </span>
                </Button>

                <p className="text-center text-xs text-muted-foreground animate-fade-in-up leading-relaxed" style={{ animationDelay: "0.4s" }}>
                  By signing up, you agree to our <br className="md:hidden" />
                  <a href="/auth/terms" className="text-primary hover:underline">Terms of Service</a> and <a href="/auth/terms" className="text-primary hover:underline">Privacy Policy</a>.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
        </div>
        </div>
      )}
    </>
  );
}