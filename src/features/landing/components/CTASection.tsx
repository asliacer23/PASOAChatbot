import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight, Sparkles, Heart } from "lucide-react";

export function CTASection() {
  const navigate = useNavigate();

  return (
    <section className="relative py-16 md:py-28 overflow-hidden">
      {/* Background Gradient Orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-72 h-72 bg-purple-500/30 rounded-full blur-3xl animate-blob" />
        <div className="absolute bottom-0 right-1/4 w-72 h-72 bg-violet-500/20 rounded-full blur-3xl animate-blob animation-delay-2000" />
      </div>

      <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Main Card */}
        <div className="rounded-3xl border border-border/40 bg-card/40 backdrop-blur-lg p-8 md:p-16 text-center space-y-8 hover:border-purple-500/50 transition-all duration-300 shadow-2xl">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-purple-500/10 border border-purple-500/30 mx-auto">
            
            <span className="text-sm font-medium text-purple-600">
              Limited Time Offer
            </span>
          </div>

          {/* Headline */}
          <div className="space-y-4">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold leading-tight">
              <span className="block text-foreground mb-2">
                Join the PASOA Student
              </span>
              <span className="block bg-gradient-to-r from-purple-600 via-violet-600 to-indigo-600 bg-clip-text text-transparent">
                Community Today
              </span>
            </h2>
            <p className="text-sm sm:text-base md:text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              Get instant access to announcements, events, real-time chat support, and everything you need to succeed at PASOA. Join hundreds of your classmates already on PASOA Hub.
            </p>
          </div>

          {/* Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
            <Button
              size="lg"
              onClick={() => navigate("/auth")}
              className="rounded-xl bg-gradient-to-r from-purple-600 to-violet-600 hover:shadow-2xl hover:shadow-purple-500/50 transition-all duration-300 hover:scale-105 text-base font-semibold group"
            >
              Create Account
              <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
            </Button>
            <Button
              size="lg"
              variant="outline"
              onClick={() => navigate("/auth")}
              className="rounded-xl border-2 text-base font-semibold hover:bg-accent"
            >
              Sign In
            </Button>
          </div>

          {/* Trust Message */}
          <div className="pt-4 border-t border-border/40">
            <p className="text-sm text-muted-foreground">
              ✓ Free to join • ✓ Privacy compliant (RA 10173)
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
