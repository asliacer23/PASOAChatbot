import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "@/features/auth";

export interface MessageReaction {
  id: string;
  message_id: string;
  user_id: string;
  reaction: string; // emoji or reaction string
  created_at: string;
}

/**
 * useReactions Hook
 * Handles adding, removing, and fetching emoji reactions for messages
 * @param messageId - The message ID to manage reactions for
 */
export function useReactions(messageId: string) {
  const { user } = useAuth();
  const [reactions, setReactions] = useState<Map<string, { count: number; users: string[] }>>(new Map());
  const [userReaction, setUserReaction] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  /**
   * Fetch all reactions for the current message
   */
  const fetchReactions = useCallback(async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from("message_reactions")
        .select("reaction, user_id, created_at")
        .eq("message_id", messageId);

      if (error) {
        console.error("Error fetching reactions:", error);
        return;
      }

      if (data) {
        const reactionMap = new Map<string, { count: number; users: string[] }>();
        
        data.forEach((r: any) => {
          const existing = reactionMap.get(r.reaction) || { count: 0, users: [] };
          existing.count += 1;
          if (!existing.users.includes(r.user_id)) {
            existing.users.push(r.user_id);
          }
          reactionMap.set(r.reaction, existing);
        });

        setReactions(reactionMap);

        // Set current user's reaction
        const userReact = data.find((r: any) => r.user_id === user?.id);
        setUserReaction(userReact?.reaction || null);
      }
    } catch (error) {
      console.error("Error fetching reactions:", error);
    } finally {
      setIsLoading(false);
    }
  }, [messageId, user?.id]);

  /**
   * Add or remove a reaction for the current user
   * Users can only have one reaction per message (toggling replaces it)
   */
  const toggleReaction = useCallback(
    async (reaction: string) => {
      if (!user) {
        toast.error("Please log in to react");
        return;
      }

      try {
        if (reaction === "") {
          // Remove reaction
          await supabase
            .from("message_reactions")
            .delete()
            .eq("message_id", messageId)
            .eq("user_id", user.id);
        } else if (userReaction === reaction) {
          // Same reaction clicked - toggle off
          await supabase
            .from("message_reactions")
            .delete()
            .eq("message_id", messageId)
            .eq("user_id", user.id);
        } else {
          // Different reaction - upsert
          await supabase
            .from("message_reactions")
            .upsert(
              {
                message_id: messageId,
                user_id: user.id,
                reaction: reaction,
              },
              { onConflict: "message_id,user_id" }
            );
        }

        // Refresh reactions
        await fetchReactions();
        toast.success(reaction ? `Reaction ${reaction} added!` : "Reaction removed!");
      } catch (error) {
        console.error("Error handling reaction:", error);
        toast.error("Failed to handle reaction");
      }
    },
    [user, messageId, userReaction, fetchReactions]
  );

  /**
   * Get reaction counts grouped by emoji
   */
  const getReactionCounts = useCallback((): Map<string, number> => {
    const counts = new Map<string, number>();
    reactions.forEach((data, emoji) => {
      counts.set(emoji, data.count);
    });
    return counts;
  }, [reactions]);

  /**
   * Get total reaction count
   */
  const getTotalReactionCount = useCallback((): number => {
    return Array.from(reactions.values()).reduce((sum, r) => sum + r.count, 0);
  }, [reactions]);

  /**
   * Subscribe to real-time reaction updates
   */
  useEffect(() => {
    fetchReactions();

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
  }, [messageId, fetchReactions]);

  return {
    reactions,
    userReaction,
    isLoading,
    toggleReaction,
    fetchReactions,
    getReactionCounts,
    getTotalReactionCount,
  };
}
