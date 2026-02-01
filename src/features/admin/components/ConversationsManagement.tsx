import { useState, useEffect, useRef } from "react";
import {
  MessageCircle,
  Search,
  User,
  Bot,
  Send,
  Clock,
  Loader2,
  UserCheck,
  ArrowLeft,
  Image,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/features/auth";
import { useTypingIndicator } from "@/features/chat/hooks/useTypingIndicator";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface Conversation {
  id: string;
  user_id: string;
  title: string | null;
  status: string;
  requires_admin: boolean;
  assigned_admin_id: string | null;
  created_at: string;
  updated_at: string;
  profile?: {
    first_name: string;
    last_name: string;
    email: string;
    avatar_url: string | null;
  };
  last_message?: string;
  unread_count?: number;
}

interface Message {
  id: string;
  conversation_id: string;
  content: string;
  sender_type: string;
  sender_id: string | null;
  is_read: boolean;
  created_at: string;
  image_url: string | null;
}

export function ConversationsManagement() {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { startTyping, stopTyping, isOtherTyping } = useTypingIndicator(
    selectedConversation?.id,
    user?.id
  );

  useEffect(() => {
    fetchConversations();
    
    // Subscribe to new messages
    const channel = supabase
      .channel("admin-conversations")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "messages" },
        () => {
          if (selectedConversation) {
            fetchMessages(selectedConversation.id);
          }
          fetchConversations();
        }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "conversations" },
        () => fetchConversations()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [selectedConversation?.id]);

  const fetchConversations = async () => {
    try {
      const { data, error } = await supabase
        .from("conversations")
        .select(`
          *,
          profile:profiles!conversations_user_id_fkey(first_name, last_name, email, avatar_url)
        `)
        .order("updated_at", { ascending: false });

      if (error) throw error;

      // Get last message for each conversation
      const conversationsWithLastMessage = await Promise.all(
        (data || []).map(async (conv) => {
          const { data: messages } = await supabase
            .from("messages")
            .select("content")
            .eq("conversation_id", conv.id)
            .order("created_at", { ascending: false })
            .limit(1);

          return {
            ...conv,
            last_message: messages?.[0]?.content || "No messages yet",
          };
        })
      );

      setConversations(conversationsWithLastMessage as Conversation[]);
    } catch (error) {
      console.error("Error fetching conversations:", error);
      toast.error("Failed to load conversations");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchMessages = async (conversationId: string) => {
    try {
      const { data, error } = await supabase
        .from("messages")
        .select("*")
        .eq("conversation_id", conversationId)
        .order("created_at", { ascending: true });

      if (error) throw error;
      setMessages(data || []);
      
      // Scroll to bottom
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
      }, 100);
    } catch (error) {
      console.error("Error fetching messages:", error);
    }
  };

  const handleSelectConversation = async (conversation: Conversation) => {
    setSelectedConversation(conversation);
    await fetchMessages(conversation.id);
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedConversation || !user) return;

    setIsSending(true);
    stopTyping();
    
    try {
      // Insert admin message
      const { error } = await supabase.from("messages").insert({
        conversation_id: selectedConversation.id,
        content: newMessage.trim(),
        sender_type: "admin",
        sender_id: user.id,
      });

      if (error) throw error;

      // IMPORTANT: When admin replies, mark conversation as no longer requiring admin
      // and assign the admin. This prevents bot from responding.
      await supabase
        .from("conversations")
        .update({ 
          assigned_admin_id: user.id,
          updated_at: new Date().toISOString(),
          // Keep requires_admin true so bot doesn't respond
          // but now has an assigned admin
        })
        .eq("id", selectedConversation.id);

      // Update local state
      setSelectedConversation({
        ...selectedConversation,
        assigned_admin_id: user.id,
      });

      // Create notification for user
      await supabase.from("notifications").insert({
        user_id: selectedConversation.user_id,
        type: "chat_reply",
        title: "New reply from support",
        message: "An admin has responded to your message",
        link: "/chat",
      });

      setNewMessage("");
      await fetchMessages(selectedConversation.id);
      toast.success("Message sent");
    } catch (error) {
      console.error("Error sending message:", error);
      toast.error("Failed to send message");
    } finally {
      setIsSending(false);
    }
  };

  const handleAssignToMe = async (conversationId: string) => {
    if (!user) return;
    
    try {
      const { error } = await supabase
        .from("conversations")
        .update({ 
          assigned_admin_id: user.id,
          requires_admin: true // Ensure bot doesn't respond
        })
        .eq("id", conversationId);

      if (error) throw error;

      // Update local state
      if (selectedConversation?.id === conversationId) {
        setSelectedConversation({
          ...selectedConversation,
          assigned_admin_id: user.id,
          requires_admin: true,
        });
      }
      
      toast.success("Conversation assigned to you");
      fetchConversations();
    } catch (error) {
      toast.error("Failed to assign conversation");
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewMessage(e.target.value);
    if (e.target.value.length > 0) {
      startTyping();
    } else {
      stopTyping();
    }
  };

  const filteredConversations = conversations.filter((conv) => {
    const searchLower = searchQuery.toLowerCase();
    const name = `${conv.profile?.first_name} ${conv.profile?.last_name}`.toLowerCase();
    return name.includes(searchLower) || conv.profile?.email.toLowerCase().includes(searchLower);
  });

  const getStatusBadge = (conv: Conversation) => {
    if (conv.requires_admin && !conv.assigned_admin_id) {
      return <Badge variant="destructive" className="text-xs">Needs Help</Badge>;
    }
    if (conv.assigned_admin_id === user?.id) {
      return <Badge variant="default" className="text-xs bg-blue-500/20 text-blue-500">Assigned to You</Badge>;
    }
    if (conv.assigned_admin_id) {
      return <Badge variant="secondary" className="text-xs">Assigned</Badge>;
    }
    if (conv.status === "closed") {
      return <Badge variant="secondary" className="text-xs">Closed</Badge>;
    }
    return <Badge variant="default" className="text-xs bg-green-500/20 text-green-500">Active</Badge>;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 h-[calc(100vh-12rem)]">
      {/* Conversations List */}
      <Card className={cn(
        "border-border/50 lg:col-span-1",
        selectedConversation && "hidden lg:block"
      )}>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <MessageCircle className="h-5 w-5" />
            Conversations
          </CardTitle>
          <div className="relative mt-2">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search conversations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
        </CardHeader>
        <ScrollArea className="h-[calc(100%-8rem)]">
          <CardContent className="p-2 space-y-2">
            {filteredConversations.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                No conversations found
              </p>
            ) : (
              filteredConversations.map((conv) => (
                <div
                  key={conv.id}
                  onClick={() => handleSelectConversation(conv)}
                  className={cn(
                    "p-3 rounded-xl cursor-pointer transition-colors",
                    selectedConversation?.id === conv.id
                      ? "bg-primary/10 border border-primary/30"
                      : "hover:bg-accent/50"
                  )}
                >
                  <div className="flex items-start gap-3">
                    <div className="h-10 w-10 rounded-full bg-gradient-primary flex items-center justify-center shrink-0 overflow-hidden">
                      {conv.profile?.avatar_url ? (
                        <img src={conv.profile.avatar_url} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-sm font-medium text-primary-foreground">
                          {conv.profile?.first_name?.[0]}{conv.profile?.last_name?.[0]}
                        </span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <p className="font-medium text-sm truncate">
                          {conv.profile?.first_name} {conv.profile?.last_name}
                        </p>
                        {getStatusBadge(conv)}
                      </div>
                      <p className="text-xs text-muted-foreground truncate mt-1">
                        {conv.last_message}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {new Date(conv.updated_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </ScrollArea>
      </Card>

      {/* Chat View */}
      <Card className={cn(
        "border-border/50 lg:col-span-2 flex flex-col",
        !selectedConversation && "hidden lg:flex"
      )}>
        {selectedConversation ? (
          <>
            <CardHeader className="pb-3 border-b border-border/50">
              <div className="flex items-center gap-3">
                <Button
                  variant="ghost"
                  size="icon"
                  className="lg:hidden"
                  onClick={() => setSelectedConversation(null)}
                >
                  <ArrowLeft className="h-5 w-5" />
                </Button>
                <div className="h-10 w-10 rounded-full bg-gradient-primary flex items-center justify-center overflow-hidden">
                  {selectedConversation.profile?.avatar_url ? (
                    <img src={selectedConversation.profile.avatar_url} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-sm font-medium text-primary-foreground">
                      {selectedConversation.profile?.first_name?.[0]}
                      {selectedConversation.profile?.last_name?.[0]}
                    </span>
                  )}
                </div>
                <div className="flex-1">
                  <p className="font-medium">
                    {selectedConversation.profile?.first_name}{" "}
                    {selectedConversation.profile?.last_name}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {isOtherTyping ? "Typing..." : selectedConversation.profile?.email}
                  </p>
                </div>
                {!selectedConversation.assigned_admin_id && (
                  <Button
                    size="sm"
                    onClick={() => handleAssignToMe(selectedConversation.id)}
                    className="bg-gradient-primary"
                  >
                    <UserCheck className="h-4 w-4 mr-2" />
                    Assign to Me
                  </Button>
                )}
                {selectedConversation.assigned_admin_id === user?.id && (
                  <Badge variant="default" className="bg-blue-500">
                    <UserCheck className="h-3 w-3 mr-1" />
                    Assigned to You
                  </Badge>
                )}
              </div>
            </CardHeader>

            <ScrollArea className="flex-1 p-4">
              <div className="space-y-4">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={cn(
                      "flex gap-3",
                      message.sender_type === "admin" && "flex-row-reverse"
                    )}
                  >
                    <div
                      className={cn(
                        "h-8 w-8 rounded-full flex items-center justify-center shrink-0",
                        message.sender_type === "bot"
                          ? "bg-gradient-primary"
                          : message.sender_type === "admin"
                          ? "bg-green-500"
                          : "bg-secondary"
                      )}
                    >
                      {message.sender_type === "bot" ? (
                        <Bot className="h-4 w-4 text-primary-foreground" />
                      ) : message.sender_type === "admin" ? (
                        <UserCheck className="h-4 w-4 text-white" />
                      ) : (
                        <User className="h-4 w-4" />
                      )}
                    </div>
                    <div
                      className={cn(
                        "max-w-[70%] rounded-xl px-4 py-2",
                        message.sender_type === "admin"
                          ? "bg-primary text-primary-foreground"
                          : message.sender_type === "bot"
                          ? "bg-accent"
                          : "bg-secondary"
                      )}
                    >
                      {message.image_url && (
                        <img
                          src={message.image_url}
                          alt="Attached"
                          className="max-w-full rounded-lg mb-2"
                        />
                      )}
                      <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                      <p className="text-xs opacity-70 mt-1">
                        {new Date(message.created_at).toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                ))}
                
                {/* Typing indicator */}
                {isOtherTyping && (
                  <div className="flex gap-3">
                    <div className="h-8 w-8 rounded-full bg-secondary flex items-center justify-center">
                      <User className="h-4 w-4" />
                    </div>
                    <div className="bg-secondary rounded-xl px-4 py-2">
                      <div className="flex gap-1 items-center">
                        <span className="w-2 h-2 rounded-full bg-muted-foreground animate-bounce" style={{ animationDelay: "0ms" }} />
                        <span className="w-2 h-2 rounded-full bg-muted-foreground animate-bounce" style={{ animationDelay: "150ms" }} />
                        <span className="w-2 h-2 rounded-full bg-muted-foreground animate-bounce" style={{ animationDelay: "300ms" }} />
                      </div>
                    </div>
                  </div>
                )}
                
                <div ref={messagesEndRef} />
              </div>
            </ScrollArea>

            <form onSubmit={handleSendMessage} className="p-4 border-t border-border/50">
              <div className="flex gap-2">
                <Input
                  value={newMessage}
                  onChange={handleInputChange}
                  placeholder="Type your reply..."
                  className="flex-1"
                />
                <Button type="submit" disabled={isSending || !newMessage.trim()}>
                  {isSending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </form>
          </>
        ) : (
          <CardContent className="flex-1 flex items-center justify-center">
            <div className="text-center text-muted-foreground">
              <MessageCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Select a conversation to view messages</p>
            </div>
          </CardContent>
        )}
      </Card>
    </div>
  );
}
