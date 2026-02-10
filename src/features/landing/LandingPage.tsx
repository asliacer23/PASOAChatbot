import { useEffect } from "react";
import { Navigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/features/auth";
import { LandingNavigation } from "./components/LandingNavigation";
import { HeroSection } from "./components/HeroSection";
import { FeaturesSection } from "./components/FeaturesSection";
import { ChatbotDemoSection } from "./components/ChatbotDemoSection";
import { HowItWorksSection } from "./components/HowItWorksSection";
import { AnnouncementsPreviewSection } from "./components/AnnouncementsPreviewSection";
import { EventsPreviewSection } from "./components/EventsPreviewSection";
import { CTASection } from "./components/CTASection";
import { LandingFooter } from "./components/LandingFooter";

export function LandingPage() {
  const { user, isLoading } = useAuth();

  // Smooth scroll behavior for hash links
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash;
      if (hash) {
        const element = document.getElementById(hash.slice(1));
        if (element) {
          setTimeout(() => {
            element.scrollIntoView({ behavior: "smooth", block: "start" });
          }, 100);
        }
      }
    };

    window.addEventListener("hashchange", handleHashChange);
    // Handle initial hash on page load
    handleHashChange();

    return () => window.removeEventListener("hashchange", handleHashChange);
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // If authenticated, navigate to the app dashboard
  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="min-h-screen bg-background overflow-hidden">
      {/* Navigation */}
      <LandingNavigation />

      {/* Sections */}
      <main className="relative">
        {/* Hero */}
        <HeroSection />

        {/* Features */}
        <FeaturesSection />

        {/* Chatbot Demo */}
        <ChatbotDemoSection />

        {/* How It Works */}
        <HowItWorksSection />

        {/* Announcements Preview */}
        <AnnouncementsPreviewSection />

        {/* Events Preview */}
        <EventsPreviewSection />

        {/* CTA */}
        <CTASection />
      </main>

      {/* Footer */}
      <LandingFooter />
    </div>
  );
}
