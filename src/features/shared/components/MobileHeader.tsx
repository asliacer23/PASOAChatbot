import { ThemeToggle } from "./ThemeToggle";
import { NotificationCenter } from "./NotificationCenter";
import { PasoaMascot } from "./PasoaMascot";
import { Button } from "@/components/ui/button";
import { Menu } from "lucide-react";

interface MobileHeaderProps {
  title?: string;
  onToggleSidebar?: () => void;
}

export function MobileHeader({ title = "PASOA Student Hub", onToggleSidebar }: MobileHeaderProps) {
  return (
    <header className="fixed top-0 left-0 right-0 z-35 flex items-center justify-between h-14 px-3 sm:px-4 border-b border-border/30 bg-background/95 backdrop-blur-md shadow-sm md:hidden">
      <div className="flex items-center gap-2 min-w-0">
        <Button
          variant="ghost"
          size="icon"
          onClick={onToggleSidebar}
          className="h-8 w-8 rounded-lg hover:bg-accent -ml-1"
          title="Toggle menu"
        >
          <Menu className="h-4 w-4" />
        </Button>
        <PasoaMascot size="xs" mood="happy" animate={false} />
        <span className="font-semibold text-foreground text-sm truncate">{title}</span>
      </div>
      <div className="flex items-center gap-1.5">
        <NotificationCenter />
        <ThemeToggle />
      </div>
    </header>
  );
}
