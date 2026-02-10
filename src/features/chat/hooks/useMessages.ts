import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface Message {
  id: string;
  content: string;
  sender_type: string;
  sender_id?: string | null;
  created_at: string;
  matched_faq_id?: string | null;
  image_url?: string | null;
  sender_profile?: {
    id: string;
    first_name: string;
    last_name: string;
    avatar_url: string | null;
  } | null;
}

export interface Conversation {
  id: string;
  title: string | null;
  status: string;
  requires_admin: boolean;
  assigned_admin_id: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * useMessages Hook
 * Handles conversation and message fetching, creation, and real-time subscription
 * @param userId - The current user's ID
 */
export function useMessages(userId: string | undefined) {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentConversation, setCurrentConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoadingConversations, setIsLoadingConversations] = useState(true);

  /**
   * Fetch all conversations for the current user
   * Auto-selects the most recent active conversation with messages
   */
  const fetchConversations = useCallback(async () => {
    if (!userId) return;

    setIsLoadingConversations(true);
    try {
      const { data, error } = await supabase
        .from("conversations")
        .select("*")
        .eq("user_id", userId)
        .order("updated_at", { ascending: false });

      if (error) throw error;
      setConversations(data || []);

      // Auto-select most recent ACTIVE conversation with messages
      if (data && data.length > 0) {
        const activeConversations = data.filter(c => c.status !== "closed");

        if (activeConversations.length > 0) {
          const { data: recentConv } = await supabase
            .from("messages")
            .select("conversation_id")
            .in("conversation_id", activeConversations.map(c => c.id))
            .order("created_at", { ascending: false })
            .limit(1);

          if (recentConv && recentConv.length > 0) {
            const conv = activeConversations.find(c => c.id === recentConv[0].conversation_id);
            if (conv) {
              setCurrentConversation(conv);
            }
          }
        }
      }
    } catch (error) {
      console.error("Error fetching conversations:", error);
    } finally {
      setIsLoadingConversations(false);
    }
  }, [userId]);

  /**
   * Fetch messages for a specific conversation
   * @param conversationId - The conversation ID to fetch messages for
   */
  const fetchMessages = useCallback(async (conversationId: string) => {
    try {
      const { data, error } = await supabase
        .from("messages")
        .select(`
          id,
          content,
          sender_type,
          sender_id,
          created_at,
          matched_faq_id,
          image_url
        `)
        .eq("conversation_id", conversationId)
        .order("created_at", { ascending: true });

      if (error) throw error;
      
      // Fetch profiles for messages that have a sender_id
      const messagesWithProfiles = await Promise.all(
        (data || []).map(async (msg: any) => {
          let sender_profile = null;
          
          if (msg.sender_id) {
            try {
              const { data: profile } = await supabase
                .from("profiles")
                .select("id, first_name, last_name, avatar_url")
                .eq("id", msg.sender_id)
                .single();
              sender_profile = profile;
            } catch (err) {
              // Profile not found, keep as null
            }
          }
          
          return {
            ...msg,
            sender_profile,
          };
        })
      );
      
      setMessages(messagesWithProfiles);
    } catch (error) {
      console.error("Error fetching messages:", error);
    }
  }, []);

  /**
   * Create a new conversation
   * Prevents creating duplicate empty conversations (restriction #47)
   */
  const createNewConversation = useCallback(async () => {
    if (!userId) return null;

    // Check if current conversation has no messages (don't create new one)
    if (currentConversation) {
      const { data: existingMessages } = await supabase
        .from("messages")
        .select("id")
        .eq("conversation_id", currentConversation.id)
        .limit(2);

      if (existingMessages && existingMessages.length <= 1) {
        toast.info("Start chatting in your current conversation first!");
        return currentConversation;
      }
    }

    // Check if there's already an empty conversation (no user messages yet)
    for (const conv of conversations) {
      const { data: messages } = await supabase
        .from("messages")
        .select("id, sender_type")
        .eq("conversation_id", conv.id);

      // If conversation has no user messages (only bot greeting or empty), use it
      const hasUserMessages = messages && messages.some(msg => msg.sender_type === "user");
      if (!hasUserMessages) {
        setCurrentConversation(conv);
        setMessages([]);
        await fetchMessages(conv.id);
        toast.info("Switched to your empty conversation");
        return conv;
      }
    }

    try {
      const { data, error } = await supabase
        .from("conversations")
        .insert({
          user_id: userId,
          title: "New Conversation",
          status: "active",
        })
        .select()
        .single();

      if (error) throw error;

      setConversations((prev) => [data, ...prev]);
      setCurrentConversation(data);
      setMessages([]);

      await fetchMessages(data.id);
      return data;
    } catch (error) {
      console.error("Error creating conversation:", error);
      toast.error("Failed to create new chat");
      return null;
    }
  }, [userId, currentConversation, conversations, fetchMessages]);

  /**
   * Load conversations on mount or when userId changes
   */
  useEffect(() => {
    if (userId) {
      fetchConversations();
    }
  }, [userId, fetchConversations]);

  /**
   * Subscribe to real-time message updates for current conversation
   */
  useEffect(() => {
    if (currentConversation) {
      fetchMessages(currentConversation.id);

      const channel = supabase
        .channel(`conversation-${currentConversation.id}`)
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "messages",
            filter: `conversation_id=eq.${currentConversation.id}`,
          },
          async (payload) => {
            const newMsg = payload.new as any;
            // Don't duplicate user messages (they're added immediately on send)
            if (newMsg.sender_type !== "user") {
              // Fetch profile data for admin/bot messages
              let sender_profile = null;
              if (newMsg.sender_id) {
                const { data: profile } = await supabase
                  .from("profiles")
                  .select("id, first_name, last_name, avatar_url")
                  .eq("id", newMsg.sender_id)
                  .single();
                sender_profile = profile;
              }
              
              const msgWithProfile: Message = {
                ...newMsg,
                sender_profile,
              };
              
              setMessages((prev) => {
                if (prev.some(m => m.id === newMsg.id)) return prev;
                return [...prev, msgWithProfile];
              });
            }
          }
        )
        .on(
          "postgres_changes",
          {
            event: "UPDATE",
            schema: "public",
            table: "conversations",
            filter: `id=eq.${currentConversation.id}`,
          },
          (payload) => {
            const updatedConv = payload.new as any;
            // Update current conversation if admin gets assigned
            if (updatedConv.assigned_admin_id !== currentConversation.assigned_admin_id) {
              setCurrentConversation((prev) => prev ? { ...prev, ...updatedConv } : null);
            }
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [currentConversation?.id, fetchMessages]);

  /**
   * Reopen a closed conversation
   * @param conversationId - The conversation ID to reopen
   */
  const reopenConversation = useCallback(async (conversationId: string) => {
    try {
      const { error } = await supabase
        .from("conversations")
        .update({ 
          status: "active",
          requires_admin: false,
          assigned_admin_id: null,
          updated_at: new Date().toISOString()
        })
        .eq("id", conversationId);

      if (error) throw error;

      setConversations((prev) =>
        prev.map((conv) =>
          conv.id === conversationId
            ? { ...conv, status: "active", requires_admin: false, assigned_admin_id: null }
            : conv
        )
      );

      if (currentConversation?.id === conversationId) {
        setCurrentConversation((prev) =>
          prev ? { ...prev, status: "active", requires_admin: false, assigned_admin_id: null } : null
        );
      }

      toast.success("Conversation reopened!");
      return true;
    } catch (error) {
      console.error("Error reopening conversation:", error);
      toast.error("Failed to reopen conversation");
      return false;
    }
  }, [currentConversation?.id]);

  /**
   * Close a conversation
   * @param conversationId - The conversation ID to close
   */
  const closeConversation = useCallback(async (conversationId: string) => {
    try {
      const { error } = await supabase
        .from("conversations")
        .update({ 
          status: "closed",
          closed_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq("id", conversationId);

      if (error) throw error;

      setConversations((prev) =>
        prev.map((conv) =>
          conv.id === conversationId
            ? { ...conv, status: "closed" }
            : conv
        )
      );

      if (currentConversation?.id === conversationId) {
        setCurrentConversation((prev) =>
          prev ? { ...prev, status: "closed" } : null
        );
      }

      toast.success("Conversation closed!");
      return true;
    } catch (error) {
      console.error("Error closing conversation:", error);
      toast.error("Failed to close conversation");
      return false;
    }
  }, [currentConversation?.id]);

  /**
   * Delete a conversation
   * @param conversationId - The conversation ID to delete
   */
  const deleteConversation = useCallback(async (conversationId: string) => {
    try {
      const { error } = await supabase
        .from("conversations")
        .delete()
        .eq("id", conversationId)
        .eq("user_id", userId);

      if (error) throw error;

      setConversations((prev) => prev.filter((conv) => conv.id !== conversationId));

      if (currentConversation?.id === conversationId) {
        setCurrentConversation(null);
        setMessages([]);
      }

      toast.success("Conversation deleted!");
      return true;
    } catch (error) {
      console.error("Error deleting conversation:", error);
      toast.error("Failed to delete conversation");
      return false;
    }
  }, [userId, currentConversation?.id]);

  /**
   * Archive a conversation
   * @param conversationId - The conversation ID to archive
   */
  const archiveConversation = useCallback(async (conversationId: string) => {
    try {
      const { error } = await supabase
        .from("conversations")
        .update({ 
          status: "archived",
          updated_at: new Date().toISOString()
        })
        .eq("id", conversationId);

      if (error) throw error;

      setConversations((prev) =>
        prev.map((conv) =>
          conv.id === conversationId
            ? { ...conv, status: "archived" }
            : conv
        )
      );

      if (currentConversation?.id === conversationId) {
        setCurrentConversation((prev) =>
          prev ? { ...prev, status: "archived" } : null
        );
      }

      toast.success("Conversation archived!");
      return true;
    } catch (error) {
      console.error("Error archiving conversation:", error);
      toast.error("Failed to archive conversation");
      return false;
    }
  }, [currentConversation?.id]);

  /**
   * Request human support/admin for a conversation
   * @param conversationId - The conversation ID to request support for
   */
  const requestAdminSupport = useCallback(async (conversationId: string) => {
    try {
      // Update conversation to mark it as requiring admin
      const { error: updateError } = await supabase
        .from("conversations")
        .update({ 
          requires_admin: true,
          updated_at: new Date().toISOString()
        })
        .eq("id", conversationId);

      if (updateError) throw updateError;

      // Add a bot message to the conversation
      const { error: messageError } = await supabase
        .from("messages")
        .insert({
          conversation_id: conversationId,
          content: "I've connected you with a human support representative. They will assist you shortly.",
          sender_type: "bot",
          sender_id: null,
          created_at: new Date().toISOString(),
        });

      if (messageError) throw messageError;

      setConversations((prev) =>
        prev.map((conv) =>
          conv.id === conversationId
            ? { ...conv, requires_admin: true }
            : conv
        )
      );

      if (currentConversation?.id === conversationId) {
        setCurrentConversation((prev) =>
          prev ? { ...prev, requires_admin: true } : null
        );
      }

      toast.success("Support request sent! An admin will respond shortly.");
      return true;
    } catch (error) {
      console.error("Error requesting admin support:", error);
      toast.error("Failed to request support");
      return false;
    }
  }, [currentConversation?.id]);

  return {
    conversations,
    setConversations,
    currentConversation,
    setCurrentConversation,
    messages,
    setMessages,
    isLoadingConversations,
    fetchConversations,
    fetchMessages,
    createNewConversation,
    reopenConversation,
    closeConversation,
    deleteConversation,
    archiveConversation,
    requestAdminSupport,
  };
}
