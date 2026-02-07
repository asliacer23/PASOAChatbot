import { cn } from "@/lib/utils";

// Minimal formal reactions - just the essentials
const reactions = ["👍", "❤️", "😂"];

interface ReactionPickerProps {
  onReactionSelect: (reaction: string) => void;
  currentReaction?: string | null;
  disabled?: boolean;
}

export function ReactionPicker({ 
  onReactionSelect, 
  currentReaction,
  disabled = false,
}: ReactionPickerProps) {
  const handleReactionClick = (reaction: string) => {
    // Toggle: if clicking same reaction, remove it; otherwise change it
    if (currentReaction === reaction) {
      onReactionSelect(""); // Remove reaction
    } else {
      onReactionSelect(reaction); // Add or change reaction
    }
  };
  
  return (
    <div className="flex gap-1 bg-background border border-border/50 rounded-full px-2 py-1.5 shadow-sm animate-scale-up">
      {reactions.map((reaction) => (
        <button
          key={reaction}
          disabled={disabled}
          onClick={() => handleReactionClick(reaction)}
          className={cn(
            "text-base transition-all px-1 py-0 rounded-full",
            "hover:scale-120 active:scale-90",
            "disabled:opacity-50 disabled:cursor-not-allowed",
            currentReaction === reaction 
              ? "scale-110" 
              : "hover:opacity-70"
          )}
          title={`React with ${reaction}`}
        >
          {reaction}
        </button>
      ))}
    </div>
  );
}
