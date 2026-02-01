import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

interface TypingUser {
  user_id: string;
  is_typing: boolean;
  updated_at: string;
}

export function useTypingIndicator(conversationId: string | undefined, userId: string | undefined) {
  const [typingUsers, setTypingUsers] = useState<TypingUser[]>([]);
  const [isOtherTyping, setIsOtherTyping] = useState(false);

  // Update typing status
  const setTyping = useCallback(async (isTyping: boolean) => {
    if (!conversationId || !userId) return;

    try {
      // Upsert typing status
      await supabase
        .from("typing_status")
        .upsert({
          conversation_id: conversationId,
          user_id: userId,
          is_typing: isTyping,
          updated_at: new Date().toISOString(),
        }, {
          onConflict: "conversation_id,user_id",
        });
    } catch (error) {
      console.error("Error updating typing status:", error);
    }
  }, [conversationId, userId]);

  // Start typing
  const startTyping = useCallback(() => {
    setTyping(true);
  }, [setTyping]);

  // Stop typing
  const stopTyping = useCallback(() => {
    setTyping(false);
  }, [setTyping]);

  // Subscribe to typing status changes
  useEffect(() => {
    if (!conversationId || !userId) return;

    // Fetch initial typing status
    const fetchTypingStatus = async () => {
      try {
        const { data } = await supabase
          .from("typing_status")
          .select("*")
          .eq("conversation_id", conversationId)
          .neq("user_id", userId)
          .eq("is_typing", true);

        if (data) {
          setTypingUsers(data);
          setIsOtherTyping(data.length > 0);
        }
      } catch (error) {
        console.error("Error fetching typing status:", error);
      }
    };

    fetchTypingStatus();

    // Subscribe to realtime changes
    const channel = supabase
      .channel(`typing-${conversationId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "typing_status",
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          const newStatus = payload.new as TypingUser;
          
          // Ignore our own typing status
          if (newStatus.user_id === userId) return;

          if (payload.eventType === "DELETE") {
            setTypingUsers((prev) => prev.filter((u) => u.user_id !== (payload.old as any).user_id));
          } else {
            setTypingUsers((prev) => {
              const exists = prev.find((u) => u.user_id === newStatus.user_id);
              if (exists) {
                return prev.map((u) => u.user_id === newStatus.user_id ? newStatus : u);
              }
              return [...prev, newStatus];
            });
          }
        }
      )
      .subscribe();

    return () => {
      // Clean up typing status when leaving
      setTyping(false);
      supabase.removeChannel(channel);
    };
  }, [conversationId, userId, setTyping]);

  // Update isOtherTyping based on typingUsers
  useEffect(() => {
    const activeTypers = typingUsers.filter((u) => u.is_typing && u.user_id !== userId);
    setIsOtherTyping(activeTypers.length > 0);
    
    // Auto-clear stale typing indicators (older than 10 seconds)
    const checkStale = () => {
      const now = Date.now();
      const staleThreshold = 10000; // 10 seconds
      
      setTypingUsers((prev) => 
        prev.filter((u) => {
          const updatedAt = new Date(u.updated_at).getTime();
          return now - updatedAt < staleThreshold;
        })
      );
    };

    const interval = setInterval(checkStale, 5000);
    return () => clearInterval(interval);
  }, [typingUsers, userId]);

  return {
    isOtherTyping,
    typingUsers,
    startTyping,
    stopTyping,
  };
}
