import { useState, useEffect } from "react";
import { Bot, User, UserCheck, Smile, Heart, Frown, Angry, ThumbsUp, ThumbsDown } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/features/auth";
import { toast } from "sonner";

interface ChatMessageProps {
  messageId: string;
  content: string;
  senderType: string;
  createdAt: string;
  imageUrl?: string | null;
}

type ReactionType = "happy" | "sad" | "angry" | "heart" | "thumbsup" | "thumbsdown";

interface Reaction {
  id: string;
  message_id: string;
  user_id: string;
  reaction: ReactionType;
}

const reactionIcons: Record<ReactionType, { icon: React.ElementType; color: string; label: string }> = {
  happy: { icon: Smile, color: "text-yellow-500", label: "Happy" },
  sad: { icon: Frown, color: "text-blue-500", label: "Sad" },
  angry: { icon: Angry, color: "text-red-500", label: "Angry" },
  heart: { icon: Heart, color: "text-pink-500", label: "Love" },
  thumbsup: { icon: ThumbsUp, color: "text-green-500", label: "Like" },
  thumbsdown: { icon: ThumbsDown, color: "text-orange-500", label: "Dislike" },
};

export function ChatMessage({ messageId, content, senderType, createdAt, imageUrl }: ChatMessageProps) {
  const { user } = useAuth();
  const [reactions, setReactions] = useState<Reaction[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    fetchReactions();
    
    // Subscribe to reaction changes
    const channel = supabase
      .channel(`reactions-${messageId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "message_reactions",
          filter: `message_id=eq.${messageId}`,
        },
        () => fetchReactions()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [messageId]);

  const fetchReactions = async () => {
    try {
      // Direct query to the new table - cast as any to bypass type checking
      // until types are regenerated
      const { data, error } = await (supabase as any)
        .from("message_reactions")
        .select("id, message_id, user_id, reaction, created_at")
        .eq("message_id", messageId);
      
      if (error) {
        // Table might not exist yet, silently fail
        return;
      }
      setReactions((data || []) as Reaction[]);
    } catch (error) {
      // Silently fail if table doesn't exist
      console.log("Reactions not available yet");
    }
  };

  const handleReaction = async (reactionType: ReactionType) => {
    if (!user) {
      toast.error("Please log in to react");
      return;
    }

    setIsLoading(true);
    try {
      // Check if user already has this reaction
      const existingReaction = reactions.find(
        (r) => r.user_id === user.id && r.reaction === reactionType
      );

      if (existingReaction) {
        // Remove reaction
        await (supabase as any)
          .from("message_reactions")
          .delete()
          .eq("id", existingReaction.id);
      } else {
        // Add reaction (remove any existing reaction first)
        const userExistingReaction = reactions.find((r) => r.user_id === user.id);
        if (userExistingReaction) {
          await (supabase as any)
            .from("message_reactions")
            .delete()
            .eq("id", userExistingReaction.id);
        }

        await (supabase as any).from("message_reactions").insert({
          message_id: messageId,
          user_id: user.id,
          reaction: reactionType,
        });
      }

      // Refresh reactions
      await fetchReactions();
      setIsOpen(false);
    } catch (error) {
      console.error("Error handling reaction:", error);
      toast.error("Failed to add reaction");
    } finally {
      setIsLoading(false);
    }
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  const userReaction = user ? reactions.find((r) => r.user_id === user.id)?.reaction : null;

  // Group reactions by type
  const reactionCounts = reactions.reduce((acc, r) => {
    acc[r.reaction] = (acc[r.reaction] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div
      className={cn(
        "flex gap-2 md:gap-3 animate-fade-up group px-2 sm:px-3 md:px-0",
        senderType === "user" ? "flex-row-reverse justify-start" : "justify-start"
      )}
    >
      <div
        className={cn(
          "h-8 md:h-9 w-8 md:w-9 rounded-full flex items-center justify-center shrink-0 shadow-lg transition-all duration-200 ring-2 ring-background",
          senderType === "bot"
            ? "bg-gradient-to-br from-primary to-blue-500"
            : senderType === "admin"
            ? "bg-gradient-to-br from-green-500 to-emerald-600"
            : "bg-gradient-to-br from-secondary to-secondary/80"
        )}
      >
        {senderType === "bot" ? (
          <Bot className="h-4 md:h-5 w-4 md:w-5 text-primary-foreground" />
        ) : senderType === "admin" ? (
          <UserCheck className="h-4 md:h-5 w-4 md:w-5 text-white" />
        ) : (
          <User className="h-4 md:h-5 w-4 md:w-5 text-secondary-foreground" />
        )}
      </div>
      <div className="flex flex-col gap-1 md:gap-1.5 max-w-xs md:max-w-sm lg:max-w-md">
        <Card
          className={cn(
            "px-3.5 md:px-4 py-2.5 md:py-3 border rounded-3xl transition-all duration-200 shadow-md hover:shadow-lg hover:scale-[1.02] transform",
            senderType === "user"
              ? "bg-gradient-to-br from-primary via-primary to-blue-600 text-primary-foreground border-primary/60 rounded-br-lg ml-auto"
              : senderType === "admin"
              ? "bg-gradient-to-br from-green-500/15 to-emerald-500/15 border-green-500/50 rounded-bl-lg"
              : "bg-gradient-to-br from-card to-card/80 border-border/60 rounded-bl-lg backdrop-blur-sm"
          )}
        >
          {imageUrl && (
            <img 
              src={imageUrl} 
              alt="Uploaded image" 
              className="max-w-full h-auto rounded-2xl mb-2 md:mb-2.5 max-h-52 object-contain shadow-md hover:shadow-lg transition-all duration-200 border border-border/30"
            />
          )}
          <p className={cn(
            "text-xs md:text-sm leading-relaxed whitespace-pre-wrap break-words",
            senderType === "user" ? "text-primary-foreground font-medium" : "text-foreground font-normal"
          )}>
            {content}
          </p>
          <p className={cn(
            "text-[8px] md:text-xs opacity-70 mt-1 md:mt-1.5 transition-opacity duration-200",
            senderType === "user" ? "text-primary-foreground/70" : "text-muted-foreground/80"
          )}>
            {formatTime(createdAt)}
          </p>
        </Card>
        
        {/* Reactions display and picker - Hidden on mobile, shown on hover on desktop */}
        <div className="flex items-center gap-1 ml-1 flex-wrap opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          {/* Show existing reactions */}
          {Object.entries(reactionCounts).map(([reaction, count]) => {
            const reactionInfo = reactionIcons[reaction as ReactionType];
            if (!reactionInfo) return null;
            const Icon = reactionInfo.icon;
            return (
              <Button
                key={reaction}
                variant="ghost"
                size="sm"
                className={cn(
                  "h-6 md:h-7 px-1.5 md:px-2 gap-1 text-[10px] md:text-xs rounded-full border border-border/50 transition-all duration-200",
                  userReaction === reaction 
                    ? "bg-accent border-accent text-accent-foreground scale-105" 
                    : "hover:bg-accent/50"
                )}
                onClick={() => handleReaction(reaction as ReactionType)}
                disabled={isLoading}
              >
                <Icon className={cn("h-3 md:h-3.5 w-3 md:w-3.5", reactionInfo.color)} />
                <span className="font-medium">{count}</span>
              </Button>
            );
          })}

          {/* Add reaction button */}
          <Popover open={isOpen} onOpenChange={setIsOpen}>
            <PopoverTrigger asChild>
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-6 md:h-7 w-6 md:w-7 rounded-full text-muted-foreground hover:text-foreground hover:bg-accent/50 transition-all duration-200 border border-border/50"
              >
                <Smile className="h-3 md:h-3.5 w-3 md:w-3.5" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-2 md:p-3" align="start">
              <div className="flex gap-1 md:gap-2">
                {Object.entries(reactionIcons).map(([key, { icon: Icon, color, label }]) => (
                  <Button
                    key={key}
                    variant="ghost"
                    size="icon"
                    className={cn(
                      "h-8 md:h-9 w-8 md:w-9 hover:scale-125 transition-all duration-200 rounded-lg hover:bg-accent active:scale-95 md:active:scale-100",
                      userReaction === key && "bg-accent scale-110"
                    )}
                    onClick={() => handleReaction(key as ReactionType)}
                    disabled={isLoading}
                    title={label}
                  >
                    <Icon className={cn("h-4 md:h-5 w-4 md:w-5", color)} />
                  </Button>
                ))}
              </div>
            </PopoverContent>
          </Popover>
        </div>
      </div>
    </div>
  );
}
