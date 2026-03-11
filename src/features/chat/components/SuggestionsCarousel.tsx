import { useState, useCallback, useRef, useEffect } from "react";
import { cn } from "@/lib/utils";
import { formatSuggestionLabel } from "@/features/chat/lib/textProcessing";

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
  const [clickedSuggestion, setClickedSuggestion] = useState<string | null>(null);
  const clickTimeoutRef = useRef<NodeJS.Timeout>();

  const handleSuggestionClick = useCallback(
    (suggestion: string) => {
      if (disabled || clickedSuggestion) return;

      setClickedSuggestion(suggestion);
      // Call the callback directly
      onSuggestionClick(suggestion);

      // Reset after a delay
      clickTimeoutRef.current = setTimeout(() => {
        setClickedSuggestion(null);
      }, 500);
    },
    [disabled, clickedSuggestion, onSuggestionClick]
  );

  useEffect(() => {
    return () => {
      if (clickTimeoutRef.current) {
        clearTimeout(clickTimeoutRef.current);
      }
    };
  }, []);

  if (!suggestions || suggestions.length === 0) {
    return null;
  }

  return (
    <div className="w-full space-y-1.5">
      <p className="text-[11px] sm:text-xs font-medium text-muted-foreground/80 px-0">
        
      </p>

      {/* Responsive Grid - 1 col on mobile, 2 on sm, 3 on md+ */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-1.5 sm:gap-2">
        {suggestions.map((suggestion, idx) => {
          const displayLabel = formatSuggestionLabel(suggestion, 58);
          return (
            <button
              key={idx}
              onClick={() => handleSuggestionClick(suggestion)}
              disabled={disabled || clickedSuggestion !== null}
              className={cn(
                "px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-lg text-[11px] sm:text-xs",
                "bg-muted/50 border border-border/60",
                "text-foreground/75 line-clamp-2 text-left font-medium",
                "transition-all duration-150 ease-out",
                "hover:bg-primary/10 hover:border-primary/50 hover:text-primary active:scale-95",
                "disabled:opacity-50 disabled:cursor-not-allowed",
                "focus:outline-none focus:ring-1 focus:ring-primary/50",
                clickedSuggestion === suggestion && "bg-primary/20 border-primary/50 text-primary"
              )}
              title={suggestion}
            >
              {displayLabel}
            </button>
          );
        })}
      </div>
    </div>
  );
}


