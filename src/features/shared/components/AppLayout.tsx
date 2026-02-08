import { useState, useEffect } from "react";
import { Outlet } from "react-router-dom";
import { SideNavigation } from "./SideNavigation";
import { MobileHeader } from "./MobileHeader";
import { WebHeader } from "./WebHeader";
import { cn } from "@/lib/utils";

export function AppLayout() {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [navbarVisible, setNavbarVisible] = useState(window.innerWidth >= 768);

  useEffect(() => {
    // Check if mobile on mount and when window resizes
    const checkMobile = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      // Only auto-close sidebar when transitioning to mobile
      if (mobile) {
        setNavbarVisible(false);
      } else {
        // Auto-open on desktop
        setNavbarVisible(true);
      }
    };

    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  return (
    <div className="flex h-screen w-full bg-background overflow-hidden">
      {/* Mobile Sidebar Overlay Backdrop - Only show when sidebar is open on mobile */}
      {isMobile && navbarVisible && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40"
          onClick={() => setNavbarVisible(false)}
        />
      )}

      {/* Sidebar - Desktop Only with Smooth Animation */}
      <div
        className={cn(
          "hidden md:flex md:flex-col md:fixed md:left-0 md:top-0 md:bottom-0 md:z-30 transition-all duration-300 ease-in-out overflow-hidden",
          "md:bg-background md:border-r md:border-border/50 md:h-screen",
          navbarVisible ? "md:w-56 lg:w-64" : "md:w-0"
        )}
      >
        <SideNavigation />
      </div>

      {/* Mobile Sidebar Drawer - Fixed Overlay */}
      {isMobile && (
        <div
          className={cn(
            "fixed top-0 left-0 w-56 h-screen bg-background z-45 transition-transform duration-300 ease-in-out overflow-y-auto shadow-lg",
            navbarVisible ? "translate-x-0" : "-translate-x-full"
          )}
        >
          <SideNavigation onCloseSidebar={() => setNavbarVisible(false)} />
        </div>
      )}

      {/* Main Content Container */}
      <div className={cn("flex-1 flex flex-col w-full transition-all duration-300 ease-in-out", navbarVisible ? "md:ml-56 lg:ml-64" : "md:ml-0")}>
        {/* Headers */}
        <MobileHeader onToggleSidebar={() => setNavbarVisible(!navbarVisible)} />
        <WebHeader navbarVisible={navbarVisible} onToggleNavbar={() => setNavbarVisible(!navbarVisible)} />
        
        {/* Main Content - Scrollable Area */}
        <main className="flex-1 overflow-y-auto pt-14 md:pt-16 relative">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
