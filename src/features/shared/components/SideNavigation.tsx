import { useLocation, useNavigate } from "react-router-dom";
import {
  Home,
  MessageCircle,
  HelpCircle,
  Bell,
  User,
  Settings,
  LayoutDashboard,
  Users,
  FileText,
  BarChart3,
  LogOut,
  Calendar,
  X,
  Tags,
} from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/features/auth";
import { PasoaMascot } from "./PasoaMascot";
import { useIsMobile } from "@/hooks/use-mobile";

const studentNavItems = [
  { to: "/dashboard", icon: Home, label: "Home" },
  { to: "/announcements", icon: Bell, label: "Announcements" },
  { to: "/chat", icon: MessageCircle, label: "Chatbot" },
  { to: "/faq", icon: HelpCircle, label: "FAQ Center" },
  { to: "/events", icon: Calendar, label: "Events" },
  { to: "/profile", icon: User, label: "Profile" },
];

const adminNavItems = [
  { to: "/admin", icon: LayoutDashboard, label: "Dashboard" },
  { to: "/admin/announcements", icon: Bell, label: "Announcements" },
  { to: "/admin/users", icon: Users, label: "Users" },
  { to: "/admin/conversations", icon: MessageCircle, label: "Conversations" },
  { to: "/admin/events", icon: Calendar, label: "Events" },
  { to: "/admin/faq", icon: HelpCircle, label: "FAQ Management" },
  { to: "/admin/categories", icon: Tags, label: "Categories" },
  { to: "/admin/reports", icon: BarChart3, label: "Reports" },
];

export function SideNavigation({ onCloseSidebar }: { onCloseSidebar?: () => void }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { isAdmin, signOut, profile } = useAuth();
  const isMobile = useIsMobile();
  const isAdminRoute = location.pathname.startsWith("/admin");

  const navItems = isAdminRoute ? adminNavItems : studentNavItems;

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  return (
    <aside
      className={cn(
        "flex flex-col h-screen border-r border-border bg-sidebar w-full"
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between h-14 lg:h-16 px-3 lg:px-4 border-b border-sidebar-border">
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="flex items-center gap-2 rounded-md px-1.5 py-1 transition-colors hover:bg-sidebar-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring"
          title="Refresh page"
        >
          <PasoaMascot size="xs" mood="happy" animate={false} />
          <span className="font-semibold text-sidebar-foreground text-sm lg:text-base">PASOA Student Hub</span>
        </button>
        {isMobile && (
          <Button
            variant="ghost"
            size="icon"
            onClick={onCloseSidebar}
            className="h-8 w-8 rounded-xl hover:bg-sidebar-accent -mr-2 md:hidden"
            title="Close sidebar"
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* User Info */}
      {profile && (
        <div className="px-3 lg:px-4 py-2.5 lg:py-3 border-b border-sidebar-border">
          <NavLink
            to="/profile"
            onClick={onCloseSidebar}
            className="flex items-center gap-2 lg:gap-3 rounded-xl px-2 py-1.5 transition-all duration-200 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring"
            activeClassName="bg-sidebar-accent text-sidebar-accent-foreground"
          >
            <div className="h-8 w-8 lg:h-9 lg:w-9 rounded-full bg-gradient-primary flex items-center justify-center shrink-0 overflow-hidden">
              {profile.avatar_url ? (
                <img
                  src={profile.avatar_url}
                  alt={`${profile.first_name} ${profile.last_name}`}
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-xs lg:text-sm font-medium text-primary-foreground">
                  {profile.first_name[0]}{profile.last_name[0]}
                </span>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs lg:text-sm font-medium truncate">
                {profile.first_name} {profile.last_name}
              </p>
              <p className="text-[10px] lg:text-xs text-muted-foreground truncate">
                {isAdmin ? "Administrator" : "Student"}
              </p>
            </div>
          </NavLink>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 py-3 lg:py-4 overflow-hidden">
        <ul className="space-y-0.5 lg:space-y-1 px-2">
          {navItems.map((item) => (
            <li key={item.to}>
              <NavLink
                to={item.to}
                end={item.to === "/dashboard" || item.to === "/admin"}
                onClick={onCloseSidebar}
                className={cn(
                  "flex items-center gap-2 lg:gap-3 px-2.5 lg:px-3 py-2 lg:py-2.5 rounded-xl text-sidebar-foreground transition-all duration-300 ease-out hover:bg-sidebar-accent hover:text-sidebar-accent-foreground hover:scale-105 hover:shadow-md hover:font-bold text-xs lg:text-sm active:scale-95"
                )}
                activeClassName="bg-sidebar-accent text-sidebar-primary font-medium shadow-soft"
              >
                <item.icon className="h-4 w-4 lg:h-5 lg:w-5 shrink-0 transition-transform duration-300 group-hover:scale-110" />
                <span>{item.label}</span>
              </NavLink>
            </li>
          ))}
        </ul>

        {/* Admin/Student Switch */}
        {isAdmin && (
          <>
            <Separator className="my-3 lg:my-4 mx-2" />
            <div className="px-2">
              <NavLink
                to={isAdminRoute ? "/dashboard" : "/admin"}
                onClick={onCloseSidebar}
                className={cn(
                  "flex items-center gap-2 lg:gap-3 px-2.5 lg:px-3 py-2 lg:py-2.5 rounded-xl text-muted-foreground transition-all duration-300 ease-out hover:bg-sidebar-accent hover:text-sidebar-accent-foreground hover:scale-105 hover:shadow-md hover:font-bold text-xs lg:text-sm active:scale-95"
                )}
                activeClassName=""
              >
                {isAdminRoute ? (
                  <>
                    <Home className="h-4 w-4 lg:h-5 lg:w-5 transition-transform duration-300" />
                    <span>Student View</span>
                  </>
                ) : (
                  <>
                    <LayoutDashboard className="h-4 w-4 lg:h-5 lg:w-5 transition-transform duration-300" />
                    <span>Admin Panel</span>
                  </>
                )}
              </NavLink>
            </div>
          </>
        )}
      </nav>

      {/* Footer */}
      <div className="border-t border-sidebar-border p-2 space-y-1.5 lg:space-y-2">
        {/* Sign Out Button */}
        <Button
          variant="ghost"
          size="default"
          onClick={handleSignOut}
          className={cn(
            "w-full rounded-xl text-muted-foreground hover:text-destructive hover:bg-destructive/10 text-xs lg:text-sm justify-start h-8 lg:h-9 transition-all duration-300 ease-out hover:scale-105 hover:shadow-md hover:font-bold active:scale-95"
          )}
        >
          <LogOut className="h-4 w-4 transition-transform duration-300" />
          <span className="ml-2">Sign Out</span>
        </Button>
      </div>
    </aside>
  );
}


