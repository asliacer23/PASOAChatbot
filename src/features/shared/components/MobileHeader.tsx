import { ThemeToggle } from "./ThemeToggle";
import { NotificationCenter } from "./NotificationCenter";
import { PasoaMascot } from "./PasoaMascot";

interface MobileHeaderProps {
  title?: string;
  navbarVisible?: boolean;
  onToggleNavbar?: () => void;
}

export function MobileHeader({ title = "Pasoa Student Hub" }: MobileHeaderProps) {
  return (
    <header className="fixed top-0 left-0 right-0 z-40 flex items-center justify-between h-14 px-3 sm:px-4 border-b border-border/30 bg-background/95 backdrop-blur-md shadow-sm md:hidden">
      <div className="flex items-center gap-2 min-w-0">
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
