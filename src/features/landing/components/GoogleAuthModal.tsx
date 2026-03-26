import { useState } from "react";
import { Loader2, X } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { PasoaMascot } from "@/features/shared/components/PasoaMascot";

interface GoogleAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function GoogleAuthModal({ isOpen, onClose }: GoogleAuthModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

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
        setIsLoading(false);
      }
    } catch (error) {
      console.error("Google sign in error:", error);
      toast({
        title: "Error",
        description: "Failed to sign in with Google",
        variant: "destructive",
      });
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="border-border/50 shadow-elegant bg-card/95 backdrop-blur w-[90vw] max-w-md rounded-2xl flex flex-col [&>button]:hidden mx-auto">
        <button
          onClick={onClose}
          className="absolute right-3 md:right-4 top-3 md:top-4 z-50 group inline-flex items-center justify-center rounded-full w-10 h-10 bg-gradient-to-br from-destructive/80 to-destructive hover:from-destructive hover:to-destructive/90 text-white shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-110 active:scale-95 border border-destructive/50 hover:border-destructive"
          aria-label="Close modal"
          title="Close"
        >
          <X className="h-5 w-5 group-hover:rotate-90 transition-transform duration-300" />
        </button>

        <DialogHeader className="space-y-4 pt-2 px-2 md:px-0">
          <div className="flex justify-center animate-float-gentle">
            <PasoaMascot size="lg" mood="happy" />
          </div>
          <div className="text-center space-y-2">
            <DialogTitle className="text-xl md:text-2xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent break-words">
              Welcome, PASOAnian!
            </DialogTitle>
            <DialogDescription className="text-xs md:text-sm text-muted-foreground px-2 md:px-0">
              Sign in with your gmail account to get started with PASOA Student Hub.
            </DialogDescription>
          </div>
        </DialogHeader>

        <div className="space-y-4 py-4 px-2 md:px-0">
          <Button
            onClick={handleGoogleSignIn}
            disabled={isLoading}
            className="w-full rounded-xl h-12 md:h-12 bg-gradient-to-r from-blue-500 to-blue-600 hover:opacity-90 font-semibold transition-all duration-300 transform hover:scale-105 active:scale-95 text-white text-sm md:text-base"
          >
            <svg className="h-5 w-5 mr-2 flex-shrink-0" viewBox="0 0 24 24">
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
              {isLoading ? "Signing in..." : "Continue with Google"}
            </span>
            <span className="sm:hidden">
              {isLoading ? "Signing in..." : "Google"}
            </span>
          </Button>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border/50"></div>
            </div>
            <div className="relative flex justify-center text-xs uppercase tracking-wide">
              <span className="bg-card px-3 text-muted-foreground">or</span>
            </div>
          </div>

          <Button
            onClick={onClose}
            variant="outline"
            className="w-full rounded-xl h-12 md:h-12 border-border/50 hover:bg-secondary/50 font-medium transition-all duration-300 text-sm md:text-base"
          >
            Explore First
          </Button>
        </div>

        <p className="text-center text-xs md:text-xs text-muted-foreground px-4 md:px-6 pb-4 md:pb-2 leading-relaxed">
          By signing in, you agree to our <br className="sm:hidden" />
          <span className="hidden sm:inline">Terms of Service and Privacy Policy</span>
          <span className="sm:hidden">Terms of Service and Privacy Policy</span>
        </p>
      </DialogContent>
    </Dialog>
  );
}
