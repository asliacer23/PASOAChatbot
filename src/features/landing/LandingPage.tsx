import { useEffect, useState } from "react";
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
import { GoogleAuthModal } from "./components/GoogleAuthModal";

export function LandingPage() {
  const { user, isLoading, isAdmin } = useAuth();
  const [showGoogleModal, setShowGoogleModal] = useState(false);

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

  // Show Google Auth modal only once per session
  useEffect(() => {
    // Only show modal if user is not authenticated and we haven't shown it yet this session
    if (!user && !isLoading) {
      const hasShownModal = sessionStorage.getItem("googleAuthModalShown");
      if (!hasShownModal) {
        const timer = setTimeout(() => {
          setShowGoogleModal(true);
          sessionStorage.setItem("googleAuthModalShown", "true");
        }, 500); // Small delay for better UX
        return () => clearTimeout(timer);
      }
    }
  }, [user, isLoading]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // If authenticated, navigate to the appropriate dashboard
  if (user) {
    return <Navigate to={isAdmin ? "/admin" : "/dashboard"} replace />;
  }

  return (
    <div className="min-h-screen bg-background overflow-hidden">
      {/* Navigation */}
      <LandingNavigation />

      {/* Sections */}
      <main className="relative">
        {/* Hero */}


        {/* Features */}
        <FeaturesSection />

        {/* Chatbot Demo */}


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

      {/* Google Auth Modal */}
      <GoogleAuthModal
        isOpen={showGoogleModal}
        onClose={() => setShowGoogleModal(false)}
      />
    </div>
  );
}
