import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { InteractiveChatbot } from "./InteractiveChatbot";

export function HeroSection() {
  const navigate = useNavigate();

  return (
    <section className="relative overflow-hidden">
      {/* Background Gradient Orbs */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-500/30 rounded-full blur-3xl animate-blob" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-violet-500/20 rounded-full blur-3xl animate-blob animation-delay-2000" />
        <div className="absolute top-1/2 left-1/2 w-60 h-60 bg-indigo-500/20 rounded-full blur-3xl animate-blob animation-delay-4000" />
      </div>

      {/* Content */}
      <div className="relative z-10 w-full px-4 sm:px-6 lg:px-8 py-8 sm:py-12 md:py-32">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-12 items-center">
          {/* Left Content */}
          <div className="space-y-4 sm:space-y-6 md:space-y-8 order-1">
            {/* Headlines */}
            <div className="space-y-3 sm:space-y-5">
              <h1 className="text-3xl sm:text-4xl md:text-7xl font-black leading-tight tracking-tight">
                <span className="block text-foreground drop-shadow-lg">Your Digital Home for</span>
                <span className="block bg-gradient-to-r from-purple-600 via-violet-600 to-indigo-600 bg-clip-text text-transparent drop-shadow-lg font-black">
                  PASOA Students
                </span>
              </h1>

              <p className="text-sm sm:text-base md:text-xl text-muted-foreground max-w-md leading-relaxed font-medium">
                Announcements, Events, Chat Support, and Everything You Need — All in One Place. Stay connected with your college community 24/7.
              </p>
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 pt-3 sm:pt-6">
              <Button
                size="lg"
                onClick={() => navigate("/auth")}
                className="rounded-lg md:rounded-xl bg-gradient-to-r from-purple-600 to-violet-600 hover:shadow-2xl hover:shadow-purple-500/50 transition-all duration-300 hover:scale-105 text-sm md:text-base font-bold group"
              >
                Get Started
                <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
              </Button>
              <Button
                size="lg"
                variant="outline"
                onClick={() => navigate("/auth")}
                className="rounded-lg md:rounded-xl border-2 hover:bg-accent text-sm md:text-base font-bold"
              >
                Sign In
              </Button>
            </div>

            {/* Trust Badges */}
            <div className="flex flex-col sm:flex-row gap-6 sm:gap-8 pt-4 sm:pt-8 border-t border-border/40">
              <div>
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
                  Trusted by
                </p>
                <p className="text-sm sm:text-base font-bold text-foreground mt-2">
                  PASOA Students
                </p>
              </div>
              <div>
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
                  Privacy
                </p>
                <p className="text-sm sm:text-base font-bold text-foreground mt-2">
                  RA 10173 Compliant
                </p>
              </div>
            </div>
          </div>

          {/* Right Visual - Interactive Chatbot */}
          <div className="flex items-center justify-center order-2 w-full">
            <div className="w-full h-64 sm:h-80 md:h-[500px] bg-gradient-to-br from-purple-500/10 to-violet-500/10 rounded-xl md:rounded-2xl border border-purple-200/30 backdrop-blur-sm p-2 sm:p-3 md:p-6">
              <InteractiveChatbot />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
