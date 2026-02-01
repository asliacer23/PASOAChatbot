import { useState, useEffect } from "react";
import { Outlet } from "react-router-dom";
import { SideNavigation } from "./SideNavigation";
import { BottomNavigation } from "./BottomNavigation";
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
    <div className="flex min-h-screen w-full bg-background overflow-hidden">
      {/* Mobile Sidebar Overlay Backdrop - Only show when sidebar is open on mobile */}
      {isMobile && navbarVisible && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-30"
          onClick={() => setNavbarVisible(false)}
        />
      )}

      {/* Sidebar - Desktop Only with Collapse Animation (Fixed Position) */}
      {!isMobile && (
        <div
          className={cn(
            "fixed left-0 top-0 h-screen flex flex-col z-20 transition-all duration-300 ease-in-out overflow-hidden",
            "bg-background border-r border-border/50",
            navbarVisible ? "md:w-56 lg:w-64" : "md:w-0 lg:w-0"
          )}
        >
          {navbarVisible && <SideNavigation />}
        </div>
      )}

      {/* Mobile Sidebar Drawer - Fixed Overlay */}
      {isMobile && (
        <div
          className={cn(
            "fixed top-0 left-0 w-56 h-screen bg-background z-40 transition-transform duration-300 ease-in-out overflow-y-auto",
            navbarVisible ? "translate-x-0" : "-translate-x-full"
          )}
        >
          <SideNavigation onCloseSidebar={() => setNavbarVisible(false)} />
        </div>
      )}

      {/* Main Content Area with margin for fixed sidebar and padding for fixed header */}
      <div className={cn(
        "flex-1 flex flex-col min-h-screen w-full overflow-hidden transition-all duration-300 ease-in-out",
        !isMobile && navbarVisible ? "md:ml-56 lg:ml-64" : ""
      )}>
        {!isMobile && (
          <WebHeader navbarVisible={navbarVisible} onToggleNavbar={() => setNavbarVisible(!navbarVisible)} />
        )}
        {isMobile && (
          <MobileHeader navbarVisible={navbarVisible} onToggleNavbar={() => setNavbarVisible(!navbarVisible)} />
        )}
        <main className={cn(
          "flex-1 overflow-y-auto pb-20 md:pb-0 transition-all duration-300 ease-in-out",
          isMobile ? "mt-14" : "pt-14 lg:pt-16"
        )}>
          <Outlet />
        </main>
        {isMobile && <BottomNavigation />}
      </div>
    </div>
  );
}
