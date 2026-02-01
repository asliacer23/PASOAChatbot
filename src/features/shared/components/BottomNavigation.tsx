import React, { useState } from "react";
import { Home, MessageCircle, HelpCircle, Bell, User, Calendar } from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { cn } from "@/lib/utils";

const navItems = [
  { to: "/", icon: Home, label: "Home" },
  { to: "/chat", icon: MessageCircle, label: "Chat" },
  { to: "/events", icon: Calendar, label: "Events" },
  { to: "/announcements", icon: Bell, label: "Updates" },
  { to: "/profile", icon: User, label: "Profile" },
];

export const BottomNavigation = React.forwardRef<HTMLElement, React.HTMLAttributes<HTMLElement>>(
  (props, ref) => {
    const [activeHover, setActiveHover] = useState<string | null>(null);

    return (
      <nav 
        ref={ref}
        className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-card/95 backdrop-blur-lg md:hidden shadow-2xl"
        {...props}
      >
        <div className="flex items-center justify-around h-14 sm:h-16 max-w-full">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === "/"}
              onMouseEnter={() => setActiveHover(item.to)}
              onMouseLeave={() => setActiveHover(null)}
              className={cn(
                "relative flex flex-col items-center justify-center gap-0.5 px-2 sm:px-3 py-1.5 text-muted-foreground transition-all duration-300 ease-out hover:text-primary min-h-[56px] sm:min-h-[64px] flex-1 group",
                "active:scale-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:ring-offset-1 focus-visible:ring-offset-background"
              )}
              activeClassName="text-primary"
            >
              {/* Background highlight on active/hover */}
              <div className={cn(
                "absolute inset-0 rounded-t-lg transition-all duration-300 ease-out opacity-0 group-hover:opacity-100",
                activeHover === item.to && "opacity-100",
                "group-[&.active]:opacity-100 bg-gradient-to-b from-primary/10 to-transparent"
              )} />
              
              {/* Icon with animated background */}
              <div className={cn(
                "relative z-10 p-1.5 rounded-lg transition-all duration-300 ease-out",
                "group-hover:bg-primary/20 group-[&.active]:bg-primary/20"
              )}>
                <item.icon className="h-5 w-5 sm:h-5 sm:w-5 transition-transform duration-300 group-hover:scale-110 group-[&.active]:scale-110" />
              </div>

              {/* Label */}
              <span className="relative z-10 text-[9px] sm:text-xs font-semibold transition-all duration-300 leading-tight">
                {item.label}
              </span>

              {/* Active indicator line */}
              <div className={cn(
                "absolute bottom-0 left-1/2 -translate-x-1/2 h-0.5 rounded-t-full transition-all duration-300 ease-out",
                "group-[&.active]:w-6 group-[&.active]:bg-gradient-to-r group-[&.active]:from-primary/60 group-[&.active]:to-primary w-0 bg-muted"
              )} />
            </NavLink>
          ))}
        </div>
      </nav>
    );
  }
);

BottomNavigation.displayName = "BottomNavigation";
