import { useRef, useState, useCallback } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface SuggestionsCarouselProps {
  suggestions: string[];
  onSuggestionClick: (suggestion: string) => void;
  disabled?: boolean;
}

export function SuggestionsCarousel({
  suggestions,
  onSuggestionClick,
  disabled = false,
}: SuggestionsCarouselProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);
  const [clickedSuggestion, setClickedSuggestion] = useState<string | null>(null);
  const clickTimeoutRef = useRef<NodeJS.Timeout>();

  const checkScroll = () => {
    if (scrollContainerRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current;
      setCanScrollLeft(scrollLeft > 0);
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10);
    }
  };

  const scroll = (direction: "left" | "right") => {
    if (scrollContainerRef.current) {
      const scrollAmount = 300;
      scrollContainerRef.current.scrollBy({
        left: direction === "left" ? -scrollAmount : scrollAmount,
        behavior: "smooth",
      });

      // Check scroll state after animation
      setTimeout(checkScroll, 300);
    }
  };

  const handleSuggestionClick = useCallback(
    (suggestion: string) => {
      if (disabled || clickedSuggestion) return;

      setClickedSuggestion(suggestion);
      onSuggestionClick(suggestion);

      // Reset after a delay to prevent multiple clicks
      clickTimeoutRef.current = setTimeout(() => {
        setClickedSuggestion(null);
      }, 1000);
    },
    [disabled, clickedSuggestion, onSuggestionClick]
  );

  return (
    <div className="w-full space-y-2.5 sm:space-y-3">
      <p className="text-xs sm:text-sm font-semibold text-muted-foreground px-1 sm:px-2">
        💡 Suggested Questions:
      </p>
      
      {/* Carousel View - Unified for all screen sizes */}
      <div className="relative group">
        {/* Left Arrow */}
        {canScrollLeft && (
          <Button
            variant="ghost"
            size="icon"
            className={cn(
              "absolute left-0 top-1/2 -translate-y-1/2 z-10 h-8 w-8 rounded-full",
              "bg-background/80 backdrop-blur-sm border border-border/50",
              "hover:bg-background/90 hover:border-primary/50 opacity-0 group-hover:opacity-100 transition-opacity"
            )}
            onClick={() => scroll("left")}
            disabled={disabled}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
        )}

        {/* Carousel Container - Shows 2 items at a time */}
        <div
          ref={scrollContainerRef}
          onScroll={checkScroll}
          className="flex gap-2 overflow-x-auto scrollbar-hide scroll-smooth"
          style={{
            scrollBehavior: "smooth",
            WebkitOverflowScrolling: "touch",
            scrollbarWidth: "none",
            msOverflowStyle: "none",
            // Show exactly 2 items per visible area
            scrollSnapType: "x mandatory",
          } as React.CSSProperties}
        >
          {suggestions.map((suggestion, idx) => (
            <button
              key={idx}
              onClick={() => handleSuggestionClick(suggestion)}
              disabled={disabled || clickedSuggestion !== null}
              style={{
                // Each item takes 50% of container width minus half the gap
                flex: "0 0 calc(50% - 4px)",
                scrollSnapAlign: "start",
              } as React.CSSProperties}
              className={cn(
                "px-3 sm:px-4 py-2 sm:py-2.5 rounded-lg text-xs sm:text-sm",
                "bg-card border border-border/60",
                "text-foreground/80 line-clamp-2 text-left",
                "transition-all duration-200",
                "hover:bg-primary/10 hover:border-primary/50 hover:text-primary hover:shadow-md",
                "active:scale-95",
                "disabled:opacity-50 disabled:cursor-not-allowed",
                clickedSuggestion === suggestion && "bg-primary/20 border-primary/50 text-primary"
              )}
            >
              {suggestion}
            </button>
          ))}
        </div>

        {/* Right Arrow */}
        {canScrollRight && (
          <Button
            variant="ghost"
            size="icon"
            className={cn(
              "absolute right-0 top-1/2 -translate-y-1/2 z-10 h-8 w-8 rounded-full",
              "bg-background/80 backdrop-blur-sm border border-border/50",
              "hover:bg-background/90 hover:border-primary/50 opacity-0 group-hover:opacity-100 transition-opacity"
            )}
            onClick={() => scroll("right")}
            disabled={disabled}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* CSS to hide scrollbar */}
      <style>{`
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </div>
  );
}
