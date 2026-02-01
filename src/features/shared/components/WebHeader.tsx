import { Button } from "@/components/ui/button";
import { ThemeToggle } from "./ThemeToggle";
import { NotificationCenter } from "./NotificationCenter";
import { Menu } from "lucide-react";
import { cn } from "@/lib/utils";

interface WebHeaderProps {
  navbarVisible?: boolean;
  onToggleNavbar?: () => void;
}

export function WebHeader({ navbarVisible = true, onToggleNavbar }: WebHeaderProps) {
  return (
    <header className={cn(
      "fixed top-0 right-0 z-30 hidden md:flex items-center justify-between h-14 lg:h-16 px-4 lg:px-6 border-b border-border bg-card/95 backdrop-blur-lg transition-all duration-300 ease-in-out",
      navbarVisible ? "md:left-56 lg:left-64" : "md:left-0 lg:left-0"
    )}>
      <Button
        variant="ghost"
        size="icon"
        onClick={onToggleNavbar}
        className="h-8 w-8 rounded-xl hover:bg-sidebar-accent flex-shrink-0"
        title={navbarVisible ? "Hide navbar" : "Show navbar"}
      >
        <Menu className="h-4 w-4" />
      </Button>
      <div className="flex items-center gap-2 lg:gap-3 ml-auto flex-shrink-0">
        <NotificationCenter />
        <ThemeToggle />
      </div>
    </header>
  );
}
