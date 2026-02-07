import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ReactionPicker } from "./ReactionPicker";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/features/auth";
import logo from "@/assets/pasoa-logo.png";

interface ChatMessageProps {
  message: {
    id: string;
    content: string;
    sender_type: string;
    image_url?: string | null;
    created_at: string;
    sender_profile?: {
      id: string;
      first_name: string;
      last_name: string;
      avatar_url: string | null;
    } | null;
  };
  isOwn: boolean;
  senderName: string;
  userAvatar?: string | null;
  onReactionAdd?: (messageId: string, reaction: string) => void;
  isBot?: boolean;
}

export function ChatMessage({
  message,
  isOwn,
  senderName,
  userAvatar,
  onReactionAdd,
  isBot: isBotProp,
}: ChatMessageProps) {
  const { user } = useAuth();
  const [showReactions, setShowReactions] = useState(false);
  const [reactions, setReactions] = useState<Map<string, { count: number; users: string[] }>>(new Map());
  const [userReaction, setUserReaction] = useState<string | null>(null);
  const [isLoadingReactions, setIsLoadingReactions] = useState(false);

  const isBot = isBotProp || message.sender_type === "bot";
  const isAdmin = message.sender_type === "admin";
  const totalReactions = Array.from(reactions.values()).reduce((a, b) => a + b.count, 0);
  
  // Restriction: Self messages cannot be reacted to
  const canReact = !isOwn;

  // Fetch reactions from database
  useEffect(() => {
    const fetchReactions = async () => {
      try {
        setIsLoadingReactions(true);
        const { data, error } = await supabase
          .from("message_reactions")
          .select("reaction, user_id")
          .eq("message_id", message.id);

        if (error) throw error;

        if (data) {
          const reactionMap = new Map<string, { count: number; users: string[] }>();
          
          data.forEach((reaction) => {
            const existing = reactionMap.get(reaction.reaction) || { count: 0, users: [] };
            existing.count += 1;
            existing.users.push(reaction.user_id);
            reactionMap.set(reaction.reaction, existing);
          });

          setReactions(reactionMap);

          // Check if current user has reacted
          if (user) {
            const userReacted = data.find((r) => r.user_id === user.id);
            setUserReaction(userReacted?.reaction ?? null);
          }
        }
      } catch (error) {
        console.error("Error fetching reactions:", error);
      } finally {
        setIsLoadingReactions(false);
      }
    };

    fetchReactions();

    // Subscribe to real-time reaction updates
    const channel = supabase
      .channel(`reactions:${message.id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "message_reactions",
          filter: `message_id=eq.${message.id}`,
        },
        (payload) => {
          if (payload.eventType === "INSERT" || payload.eventType === "UPDATE") {
            const reaction = payload.new.reaction;
            const userId = payload.new.user_id;
            
            setReactions((prev) => {
              const newReactions = new Map(prev);
              const existing = newReactions.get(reaction) || { count: 0, users: [] };
              
              if (!existing.users.includes(userId)) {
                existing.count += 1;
                existing.users.push(userId);
                newReactions.set(reaction, existing);
              }
              
              return newReactions;
            });

            if (user?.id === userId) {
              setUserReaction(reaction);
            }
          } else if (payload.eventType === "DELETE") {
            const reaction = payload.old.reaction;
            const userId = payload.old.user_id;

            setReactions((prev) => {
              const newReactions = new Map(prev);
              const existing = newReactions.get(reaction);
              
              if (existing) {
                existing.count = Math.max(0, existing.count - 1);
                existing.users = existing.users.filter((id) => id !== userId);
                
                if (existing.count === 0) {
                  newReactions.delete(reaction);
                } else {
                  newReactions.set(reaction, existing);
                }
              }
              
              return newReactions;
            });

            if (user?.id === userId) {
              setUserReaction(null);
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [message.id, user]);

  const getSenderColor = () => {
    if (isOwn) return "bg-primary/10 border-primary/30";
    if (isAdmin) return "bg-green-500/15 border-green-500/40 shadow-sm";
    return "bg-muted/50 border-border/30";
  };

  const getSenderBadge = () => {
    if (isBot) return "PASOA Bot";
    if (isAdmin) return `Support Team • ${senderName}`;
    return "You";
  };

  const getBadgeColor = () => {
    if (isBot) return "bg-blue-500/20 text-blue-700 dark:text-blue-300";
    if (isAdmin) return "bg-green-500/25 text-green-700 dark:text-green-400 font-semibold";
    return "bg-primary/20 text-primary";
  };

  return (
    <div className={cn("flex gap-1.5 sm:gap-3 group", isOwn ? "flex-row-reverse" : "flex-row")}>
      {/* Avatar */}
      <div className="flex-shrink-0 w-7 h-7 sm:w-10 sm:h-10 rounded-full flex items-center justify-center text-xs sm:text-sm font-bold bg-gradient-to-br">
        {isBot ? (
          <img
            src={logo}
            alt="PASOA Bot"
            className="w-full h-full rounded-full object-cover"
          />
        ) : userAvatar ? (
          <img
            src={userAvatar}
            alt={senderName}
            className="w-full h-full rounded-full object-cover"
          />
        ) : (
          <div className={cn(
            "w-full h-full rounded-full flex items-center justify-center",
            isAdmin ? "bg-green-500" : "bg-primary"
          )}>
            <span className="text-white text-xs">
              {senderName.charAt(0).toUpperCase()}
            </span>
          </div>
        )}
      </div>

      {/* Message Content */}
      <div className={cn("flex flex-col gap-0.5 sm:gap-1 max-w-xs sm:max-w-xl", isOwn ? "items-end" : "items-start")}>
        {/* Sender Badge */}
        <div className={cn(
          "text-[10px] sm:text-xs px-2 py-0.5 rounded-full font-medium",
          getBadgeColor()
        )}>
          {getSenderBadge()}
        </div>

        {/* Message with reactions container */}
        <div className="flex flex-col gap-0">
          {/* Message Bubble */}
          <div
            className={cn(
              "rounded-2xl px-3 sm:px-4 py-2 sm:py-2.5 border transition-all text-sm sm:text-base leading-relaxed",
              getSenderColor(),
              "hover:shadow-md"
            )}
          >
            {/* Image if exists */}
            {message.image_url && (
              <img
                src={message.image_url}
                alt="message image"
                className="max-w-[150px] sm:max-w-[250px] rounded-lg mb-2"
              />
            )}

            {/* Text Content */}
            <p className="text-foreground break-words">
              {message.content}
            </p>

            {/* Timestamp */}
            <p className="text-[10px] sm:text-xs text-muted-foreground mt-0.5 sm:mt-1 text-right">
              {new Date(message.created_at).toLocaleTimeString("en-US", {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </p>
          </div>

          {/* Reactions Display */}
          {totalReactions > 0 && (
            <div className={cn("flex flex-wrap gap-0.5 mt-1.5", isOwn ? "justify-end" : "justify-start")}>
              {Array.from(reactions.entries()).map(([emoji, { count, users }]) => (
                <button
                  key={emoji}
                  onClick={() => setShowReactions(!showReactions)}
                  className={cn(
                    "text-xs px-1.5 py-0.5 rounded-full transition-all",
                    "hover:scale-110 active:scale-95",
                    userReaction === emoji 
                      ? "bg-primary/15 ring-1 ring-primary/30" 
                      : "hover:bg-secondary/50"
                  )}
                  title={`${users.length} reaction${count > 1 ? "s" : ""}`}
                >
                  {emoji}
                  {count > 1 && <span className="ml-0.5 text-[9px] font-medium">{count}</span>}
                </button>
              ))}
            </div>
          )}

          {/* Minimalist add reaction button - show on hover if can react */}
          {canReact && !showReactions && (
            <div className="opacity-0 group-hover:opacity-100 transition-opacity mt-1">
              <button
                onClick={() => setShowReactions(true)}
                className="text-xs text-muted-foreground hover:text-primary transition-colors"
                title="Add reaction"
              >
                + react
              </button>
            </div>
          )}
        </div>

        {/* Reaction Picker */}
        {showReactions && canReact && (
          <ReactionPicker
            onReactionSelect={(reaction) => {
              onReactionAdd?.(message.id, reaction);
              setShowReactions(false);
            }}
            currentReaction={userReaction || undefined}
          />
        )}
      </div>
    </div>
  );
}
