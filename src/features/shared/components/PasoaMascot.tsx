import { cn } from "@/lib/utils";
import pasoaLogo from "@/assets/pasoa-logo.png";
interface PasoaMascotProps {
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  mood?: "happy" | "thinking" | "waving" | "idle";
  className?: string;
  animate?: boolean;
  showImage?: boolean;
}

export function PasoaMascot({ 
  size = "md", 
  mood = "idle", 
  className,
  animate = true,
  showImage = true
}: PasoaMascotProps) {
  const sizeClasses = {
    xs: "w-8 h-8",
    sm: "w-12 h-12",
    md: "w-20 h-20",
    lg: "w-32 h-32",
    xl: "w-48 h-48",
  };

  if (showImage) {
    return (
      <div
        className={cn(
          "relative flex items-center justify-center",
          sizeClasses[size],
          animate && mood === "waving" && "animate-wave-slow",
          animate && mood === "thinking" && "animate-pulse-slow",
          animate && mood === "happy" && "animate-bounce-gentle",
          animate && mood === "idle" && "animate-float",
          className
        )}
      >
        <img 
          src={pasoaLogo} 
          alt="Pasoa Mascot" 
          className="w-full h-full object-contain drop-shadow-lg"
        />
        {/* Thinking bubble for thinking mood */}
        {mood === "thinking" && (
          <div className="absolute -right-2 -top-2 flex flex-col items-end gap-0.5">
            <div className="w-2 h-2 rounded-full bg-primary/60 animate-pulse" />
            <div className="w-1.5 h-1.5 rounded-full bg-primary/40 animate-pulse delay-75" />
            <div className="w-1 h-1 rounded-full bg-primary/20 animate-pulse delay-150" />
          </div>
        )}
      </div>
    );
  }

  // Fallback CSS mascot
  return (
    <div
      className={cn(
        "relative flex items-center justify-center",
        sizeClasses[size],
        animate && "animate-float",
        className
      )}
    >
      <div className="relative w-full h-full">
        <div className="absolute inset-0 rounded-full bg-gradient-to-br from-primary via-primary/80 to-primary/60 shadow-elegant">
          <div className="absolute inset-1 rounded-full bg-gradient-to-br from-white/20 to-transparent" />
          
          <div className="absolute -top-[15%] left-[15%] w-[25%] h-[30%] bg-gradient-to-br from-primary to-primary/80 rounded-tl-full rounded-tr-full rotate-[-20deg] shadow-soft">
            <div className="absolute inset-[20%] bg-gradient-to-br from-pink-300 to-pink-400 rounded-tl-full rounded-tr-full" />
          </div>
          <div className="absolute -top-[15%] right-[15%] w-[25%] h-[30%] bg-gradient-to-br from-primary to-primary/80 rounded-tl-full rounded-tr-full rotate-[20deg] shadow-soft">
            <div className="absolute inset-[20%] bg-gradient-to-br from-pink-300 to-pink-400 rounded-tl-full rounded-tr-full" />
          </div>
          
          <div className="absolute inset-0 flex flex-col items-center justify-center pt-[10%]">
            <div className="flex gap-[20%] mb-[5%]">
              <div className={cn(
                "w-[15%] aspect-square rounded-full bg-foreground relative",
                mood === "happy" && "scale-y-50 rounded-t-none"
              )}>
                {mood !== "happy" && (
                  <div className="absolute top-[20%] left-[20%] w-[30%] aspect-square rounded-full bg-white" />
                )}
              </div>
              <div className={cn(
                "w-[15%] aspect-square rounded-full bg-foreground relative",
                mood === "happy" && "scale-y-50 rounded-t-none"
              )}>
                {mood !== "happy" && (
                  <div className="absolute top-[20%] left-[20%] w-[30%] aspect-square rounded-full bg-white" />
                )}
              </div>
            </div>
            
            <div className="w-[8%] h-[6%] rounded-full bg-pink-400" />
            
            <div className="flex items-center justify-center mt-[2%]">
              {mood === "happy" ? (
                <div className="w-[20%] h-[8%] border-b-2 border-foreground rounded-b-full" />
              ) : mood === "thinking" ? (
                <div className="w-[10%] h-[10%] rounded-full border-2 border-foreground" />
              ) : (
                <div className="w-[15%] h-[4%] bg-foreground rounded-full" />
              )}
            </div>

            <div className="absolute left-[12%] top-[55%] w-[12%] h-[8%] rounded-full bg-pink-300/50" />
            <div className="absolute right-[12%] top-[55%] w-[12%] h-[8%] rounded-full bg-pink-300/50" />
          </div>
        </div>
        
        {mood === "waving" && (
          <div className="absolute -right-[20%] top-[30%] text-2xl animate-wave origin-bottom-left">
            👋
          </div>
        )}
        
        {mood === "thinking" && (
          <div className="absolute -right-[30%] -top-[20%] flex flex-col items-end gap-1">
            <div className="w-3 h-3 rounded-full bg-muted-foreground/30" />
            <div className="w-2 h-2 rounded-full bg-muted-foreground/20" />
            <div className="w-1.5 h-1.5 rounded-full bg-muted-foreground/10" />
          </div>
        )}
      </div>

      <div className="absolute -bottom-[10%] left-1/2 -translate-x-1/2 w-[60%] h-[10%] rounded-full bg-foreground/10 blur-sm" />
    </div>
  );
}
