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
        className="fixed bottom-0 left-0 right-0 z-50 border-t border-border/30 bg-background/95 backdrop-blur-lg md:hidden shadow-lg"
        {...props}
      >
        <div className="flex items-center justify-around h-auto min-h-[3.5rem] max-w-full px-1">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === "/"}
              onMouseEnter={() => setActiveHover(item.to)}
              onMouseLeave={() => setActiveHover(null)}
              className={cn(
                "relative flex flex-col items-center justify-center gap-0.5 px-1.5 py-1 text-muted-foreground transition-all duration-200 ease-out hover:text-primary min-h-12 flex-1 group",
                "active:scale-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
              )}
              activeClassName="text-primary"
            >
              {/* Icon with animated background */}
              <div className={cn(
                "relative z-10 p-0.5 rounded-lg transition-all duration-200 ease-out",
                "group-hover:bg-primary/10 group-[&.active]:bg-primary/15"
              )}>
                <item.icon className="h-5 w-5 transition-transform duration-200 group-hover:scale-110 group-[&.active]:scale-110" />
              </div>

              {/* Label - More compact */}
              <span className="relative z-10 text-[9px] font-medium transition-all duration-200 leading-tight">
                {item.label}
              </span>

              {/* Active indicator dot */}
              <div className={cn(
                "absolute bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full transition-all duration-200",
                "group-[&.active]:bg-primary group-[&.active]:scale-100 w-0 scale-0"
              )} />
            </NavLink>
          ))}
        </div>
      </nav>
    );
  }
);

BottomNavigation.displayName = "BottomNavigation";
