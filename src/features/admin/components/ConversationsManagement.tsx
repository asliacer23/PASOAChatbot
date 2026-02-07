import { useState, useEffect, useRef } from "react";
import {
  MessageCircle,
  Search,
  User,
  Bot,
  Send,
  Clock,
  Loader2,
  ArrowLeft,
  MoreHorizontal,
  Lock,
  LockOpen,
  Smile,
  X,
  Trash2,
  Eye,
  CheckCircle,
  AlertTriangle,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/features/auth";
import { useTypingIndicator } from "@/features/chat/hooks/useTypingIndicator";
import { ReactionPicker } from "@/features/chat/components/ReactionPicker";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { format } from "date-fns";

interface Conversation {
  id: string;
  user_id: string;
  title: string | null;
  status: "active" | "closed";
  requires_admin: boolean;
  assigned_admin_id: string | null;
  created_at: string;
  updated_at: string;
  closed_at: string | null;
  profile?: {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
    avatar_url: string | null;
    student_id: string | null;
  };
  last_message?: string;
  unread_count?: number;
  message_count?: number;
}

interface Message {
  id: string;
  conversation_id: string;
  content: string;
  sender_type: "student" | "admin" | "bot";
  sender_id: string | null;
  sender_name?: string;
  is_read: boolean;
  created_at: string;
  image_url: string | null;
}

interface MessageReaction {
  id: string;
  message_id: string;
  user_id: string;
  reaction: string;
  created_at: string;
  profile?: {
    first_name: string;
    last_name: string;
  };
}

export function ConversationsManagement() {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [messageReactions, setMessageReactions] = useState<Record<string, MessageReaction[]>>({});
  const [userReactions, setUserReactions] = useState<Record<string, string | null>>({});
  const [showReactionPicker, setShowReactionPicker] = useState<string | null>(null);
  const [newMessage, setNewMessage] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<"all" | "active" | "closed">("all");
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [showCloseDialog, setShowCloseDialog] = useState(false);
  const [conversationToClose, setConversationToClose] = useState<Conversation | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { startTyping, stopTyping, isOtherTyping } = useTypingIndicator(
    selectedConversation?.id,
    user?.id
  );

  useEffect(() => {
    fetchConversations();
    
    const channel = supabase
      .channel("admin-conversations-v2")
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
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "message_reactions" },
        () => {
          if (selectedConversation) {
            fetchMessageReactions(selectedConversation.id);
          }
        }
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
          profile:profiles!conversations_user_id_fkey(id, first_name, last_name, email, avatar_url, student_id)
        `)
        .order("updated_at", { ascending: false });

      if (error) throw error;

      const conversationsWithDetails = await Promise.all(
        (data || []).map(async (conv) => {
          // Get last message
          const { data: messages } = await supabase
            .from("messages")
            .select("content")
            .eq("conversation_id", conv.id)
            .order("created_at", { ascending: false })
            .limit(1);

          // Get total message count
          const { count } = await supabase
            .from("messages")
            .select("*", { count: "exact" })
            .eq("conversation_id", conv.id);

          return {
            ...conv,
            last_message: messages?.[0]?.content || "No messages yet",
            message_count: count || 0,
          };
        })
      );

      setConversations(conversationsWithDetails as Conversation[]);
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
        .select(`
          *,
          sender:profiles(id, first_name, last_name)
        `)
        .eq("conversation_id", conversationId)
        .order("created_at", { ascending: true });

      if (error) throw error;

      const messagesWithNames = (data || []).map((msg: any) => ({
        ...msg,
        sender_name: msg.sender ? `${msg.sender.first_name} ${msg.sender.last_name}` : undefined,
      }));

      setMessages(messagesWithNames as Message[]);
      
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
      }, 100);

      // Fetch reactions for all messages
      await fetchMessageReactions(conversationId);
    } catch (error) {
      console.error("Error fetching messages:", error);
      toast.error("Failed to load messages");
    }
  };

  const fetchMessageReactions = async (conversationId: string) => {
    try {
      const { data, error } = await supabase
        .from("message_reactions")
        .select(`
          *,
          profile:profiles(first_name, last_name)
        `)
        .in("message_id", messages.map((m) => m.id));

      if (error && error.code !== "PGRST116") throw error;

      const reactionsMap: Record<string, MessageReaction[]> = {};
      const userReactionsMap: Record<string, string | null> = {};
      
      (data || []).forEach((reaction: any) => {
        if (!reactionsMap[reaction.message_id]) {
          reactionsMap[reaction.message_id] = [];
        }
        reactionsMap[reaction.message_id].push(reaction);
        
        // Track current user's reaction
        if (user && reaction.user_id === user.id) {
          userReactionsMap[reaction.message_id] = reaction.reaction;
        }
      });

      setMessageReactions(reactionsMap);
      setUserReactions(userReactionsMap);
    } catch (error) {
      console.error("Error fetching reactions:", error);
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
      const { error } = await supabase.from("messages").insert({
        conversation_id: selectedConversation.id,
        content: newMessage.trim(),
        sender_type: "admin",
        sender_id: user.id,
      });

      if (error) throw error;

      await supabase
        .from("conversations")
        .update({ 
          assigned_admin_id: user.id,
          updated_at: new Date().toISOString(),
        })
        .eq("id", selectedConversation.id);

      setSelectedConversation({
        ...selectedConversation,
        assigned_admin_id: user.id,
      });

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

  const handleCloseConversation = async () => {
    if (!conversationToClose || !user) return;

    try {
      const { error } = await supabase
        .from("conversations")
        .update({
          status: "closed",
          closed_at: new Date().toISOString(),
        })
        .eq("id", conversationToClose.id);

      if (error) throw error;

      await supabase.from("notifications").insert({
        user_id: conversationToClose.user_id,
        type: "chat_closed",
        title: "Chat Closed",
        message: "Your support chat has been closed by an admin",
        link: "/chat",
      });

      if (selectedConversation?.id === conversationToClose.id) {
        setSelectedConversation({ ...selectedConversation, status: "closed" });
      }

      toast.success("Conversation closed");
      setShowCloseDialog(false);
      setConversationToClose(null);
      fetchConversations();
    } catch (error) {
      console.error("Error closing conversation:", error);
      toast.error("Failed to close conversation");
    }
  };

  const handleReopenConversation = async (conversationId: string) => {
    try {
      const { error } = await supabase
        .from("conversations")
        .update({
          status: "active",
          closed_at: null,
        })
        .eq("id", conversationId);

      if (error) throw error;

      const conversation = conversations.find((c) => c.id === conversationId);
      if (conversation) {
        await supabase.from("notifications").insert({
          user_id: conversation.user_id,
          type: "chat_reopened",
          title: "Chat Reopened",
          message: "Your support chat has been reopened",
          link: "/chat",
        });
      }

      if (selectedConversation?.id === conversationId) {
        setSelectedConversation({ ...selectedConversation, status: "active" });
      }

      toast.success("Conversation reopened");
      fetchConversations();
    } catch (error) {
      console.error("Error reopening conversation:", error);
      toast.error("Failed to reopen conversation");
    }
  };

  const handleAddReaction = async (messageId: string, reaction: string) => {
    if (!user) return;

    try {
      const userCurrentReaction = userReactions[messageId];

      if (reaction === "") {
        // Remove all user reactions from this message
        await supabase
          .from("message_reactions")
          .delete()
          .eq("message_id", messageId)
          .eq("user_id", user.id);

        setUserReactions((prev) => ({
          ...prev,
          [messageId]: null,
        }));
      } else if (userCurrentReaction === reaction) {
        // Toggle off - same reaction clicked again
        await supabase
          .from("message_reactions")
          .delete()
          .eq("message_id", messageId)
          .eq("user_id", user.id)
          .eq("reaction", reaction);

        setUserReactions((prev) => ({
          ...prev,
          [messageId]: null,
        }));
      } else {
        // Different reaction or no reaction - upsert
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

        setUserReactions((prev) => ({
          ...prev,
          [messageId]: reaction,
        }));
      }

      setShowReactionPicker(null);
      await fetchMessageReactions(selectedConversation?.id || "");
    } catch (error) {
      console.error("Error adding reaction:", error);
      toast.error("Failed to add reaction");
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
    const email = conv.profile?.email.toLowerCase() || "";
    const studentId = conv.profile?.student_id?.toLowerCase() || "";
    
    const matchesSearch = 
      name.includes(searchLower) || 
      email.includes(searchLower) || 
      studentId.includes(searchLower);
    
    const matchesStatus = 
      filterStatus === "all" || conv.status === filterStatus;

    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (conv: Conversation) => {
    if (conv.status === "closed") {
      return (
        <Badge variant="secondary" className="text-xs gap-1">
          <Lock className="h-3 w-3" />
          Closed
        </Badge>
      );
    }
    if (conv.requires_admin && !conv.assigned_admin_id) {
      return (
        <Badge variant="destructive" className="text-xs gap-1">
          <AlertTriangle className="h-3 w-3" />
          Needs Help
        </Badge>
      );
    }
    if (conv.assigned_admin_id === user?.id) {
      return (
        <Badge variant="default" className="text-xs bg-blue-500/20 text-blue-500 border-blue-500/30 gap-1">
          <CheckCircle className="h-3 w-3" />
          Your Chats
        </Badge>
      );
    }
    return (
      <Badge variant="default" className="text-xs bg-green-500/20 text-green-500 border-green-500/30">
        Active
      </Badge>
    );
  };

  const groupedReactions = (messageId: string) => {
    const reactions = messageReactions[messageId] || [];
    const grouped: Record<string, number> = {};
    reactions.forEach((r) => {
      grouped[r.reaction] = (grouped[r.reaction] || 0) + 1;
    });
    return grouped;
  };

  const getReactionTooltip = (messageId: string, emoji: string) => {
    const reactions = messageReactions[messageId] || [];
    const names = reactions
      .filter((r) => r.reaction === emoji)
      .map((r) => `${r.profile?.first_name} ${r.profile?.last_name}`)
      .join(", ");
    return names;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <MessageCircle className="h-5 w-5 text-primary" />
            <h2 className="text-2xl md:text-3xl font-bold">Student Conversations</h2>
          </div>
          <p className="text-sm md:text-base text-muted-foreground">
            Manage student support chats and inquiries
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
        <Card className="border-border/50 bg-gradient-to-br from-blue-500/20 to-blue-600/20 hover:shadow-lg transition-all">
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-start justify-between">
              <div className="space-y-2">
                <p className="text-xs sm:text-sm text-muted-foreground font-medium">Total Conversations</p>
                <p className="text-2xl sm:text-3xl font-bold">{conversations.length}</p>
              </div>
              <div className="p-2 bg-blue-500/20 rounded-lg">
                <MessageCircle className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/50 bg-gradient-to-br from-green-500/20 to-green-600/20 hover:shadow-lg transition-all">
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-start justify-between">
              <div className="space-y-2">
                <p className="text-xs sm:text-sm text-muted-foreground font-medium">Active Chats</p>
                <p className="text-2xl sm:text-3xl font-bold text-green-600 dark:text-green-400">
                  {conversations.filter((c) => c.status === "active").length}
                </p>
              </div>
              <div className="p-2 bg-green-500/20 rounded-lg">
                <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/50 bg-gradient-to-br from-red-500/20 to-red-600/20 hover:shadow-lg transition-all">
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-start justify-between">
              <div className="space-y-2">
                <p className="text-xs sm:text-sm text-muted-foreground font-medium">Needs Attention</p>
                <p className="text-2xl sm:text-3xl font-bold text-red-600 dark:text-red-400">
                  {conversations.filter((c) => c.requires_admin && !c.assigned_admin_id).length}
                </p>
              </div>
              <div className="p-2 bg-red-500/20 rounded-lg">
                <AlertTriangle className="h-4 w-4 text-red-600 dark:text-red-400" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 h-[calc(100vh-24rem)]">
        {/* Conversations List */}
        <Card className={cn(
          "border-border/50 lg:col-span-1 overflow-hidden",
          selectedConversation && "hidden lg:block"
        )}>
          <CardHeader className="pb-3 border-b border-border/50">
            <CardTitle className="text-lg">Chats</CardTitle>
            <div className="relative mt-3">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name or ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 text-sm"
              />
            </div>
            <div className="flex gap-2 mt-3">
              {(["all", "active", "closed"] as const).map((status) => (
                <Button
                  key={status}
                  size="sm"
                  variant={filterStatus === status ? "default" : "outline"}
                  onClick={() => setFilterStatus(status)}
                  className="text-xs capitalize"
                >
                  {status}
                </Button>
              ))}
            </div>
          </CardHeader>
          <ScrollArea className="h-[calc(100%-10rem)]">
            <CardContent className="p-2 space-y-2">
              {filteredConversations.length === 0 ? (
                <p className="text-center text-muted-foreground py-8 text-sm">
                  No conversations found
                </p>
              ) : (
                filteredConversations.map((conv) => (
                  <div
                    key={conv.id}
                    onClick={() => handleSelectConversation(conv)}
                    className={cn(
                      "p-3 rounded-lg cursor-pointer transition-all hover:bg-accent/50",
                      selectedConversation?.id === conv.id && "bg-primary/10 border border-primary/30"
                    )}
                  >
                    <div className="flex items-start gap-3">
                      <Avatar className="h-10 w-10 shrink-0">
                        <AvatarImage src={conv.profile?.avatar_url || ""} />
                        <AvatarFallback className="bg-gradient-primary text-xs">
                          {conv.profile?.first_name?.[0]}{conv.profile?.last_name?.[0]}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <p className="font-medium text-sm truncate">
                            {conv.profile?.first_name} {conv.profile?.last_name}
                          </p>
                          {getStatusBadge(conv)}
                        </div>
                        {conv.profile?.student_id && (
                          <p className="text-xs text-muted-foreground">ID: {conv.profile.student_id}</p>
                        )}
                        <p className="text-xs text-muted-foreground truncate mt-1">
                          {conv.last_message}
                        </p>
                        <div className="flex items-center justify-between mt-1">
                          <p className="text-xs text-muted-foreground">
                            {conv.message_count} message{conv.message_count !== 1 ? "s" : ""}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {format(new Date(conv.updated_at), "MMM dd")}
                          </p>
                        </div>
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
          "border-border/50 lg:col-span-2 flex flex-col overflow-hidden",
          !selectedConversation && "hidden lg:flex"
        )}>
          {selectedConversation ? (
            <>
              {/* Header */}
              <CardHeader className="pb-3 border-b border-border/50">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 flex-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="lg:hidden"
                      onClick={() => setSelectedConversation(null)}
                    >
                      <ArrowLeft className="h-5 w-5" />
                    </Button>
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={selectedConversation.profile?.avatar_url || ""} />
                      <AvatarFallback className="bg-gradient-primary">
                        {selectedConversation.profile?.first_name?.[0]}
                        {selectedConversation.profile?.last_name?.[0]}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <p className="font-semibold">
                        {selectedConversation.profile?.first_name} {selectedConversation.profile?.last_name}
                      </p>
                      {selectedConversation.profile?.student_id && (
                        <p className="text-xs text-muted-foreground">
                          ID: {selectedConversation.profile.student_id}
                        </p>
                      )}
                      {isOtherTyping && (
                        <p className="text-xs text-green-600">Typing...</p>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      {selectedConversation.status === "active" ? (
                        <>
                          <DropdownMenuItem
                            onClick={() => {
                              setConversationToClose(selectedConversation);
                              setShowCloseDialog(true);
                            }}
                            className="text-destructive"
                          >
                            <Lock className="h-4 w-4 mr-2" />
                            Close Chat
                          </DropdownMenuItem>
                        </>
                      ) : (
                        <DropdownMenuItem
                          onClick={() => handleReopenConversation(selectedConversation.id)}
                        >
                          <LockOpen className="h-4 w-4 mr-2" />
                          Reopen Chat
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuSeparator />
                      <DropdownMenuItem>
                        <Eye className="h-4 w-4 mr-2" />
                        View Profile
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                {selectedConversation.status === "closed" && (
                  <div className="mt-3 p-2 bg-yellow-500/10 border border-yellow-500/20 rounded-lg flex items-center gap-2">
                    <Lock className="h-4 w-4 text-yellow-600" />
                    <p className="text-xs text-yellow-700 dark:text-yellow-400">
                      This chat has been closed. Students cannot send messages.
                    </p>
                  </div>
                )}
              </CardHeader>

              {/* Messages */}
              <ScrollArea className="flex-1 p-4">
                <div className="space-y-4">
                  {messages.map((message) => {
                    const reactions = groupedReactions(message.id);
                    const hasReactions = Object.keys(reactions).length > 0;

                    return (
                      <div key={message.id} className="group">
                        <div
                          className={cn(
                            "flex gap-3",
                            message.sender_type === "admin" && "flex-row-reverse"
                          )}
                        >
                          <Avatar className="h-8 w-8 shrink-0 mt-1">
                            {message.sender_type === "bot" ? (
                              <AvatarFallback className="bg-primary text-xs">🤖</AvatarFallback>
                            ) : message.sender_type === "admin" ? (
                              <AvatarFallback className="bg-green-500 text-white text-xs">A</AvatarFallback>
                            ) : (
                              <AvatarFallback className="bg-secondary text-xs">S</AvatarFallback>
                            )}
                          </Avatar>
                          <div
                            className={cn(
                              "max-w-[70%] space-y-2",
                              message.sender_type === "admin" && "items-end"
                            )}
                          >
                            {/* Sender Name Label */}
                            <p className="text-xs font-semibold px-3 text-muted-foreground">
                              {message.sender_type === "bot"
                                ? "Bot Support"
                                : message.sender_type === "admin"
                                ? `Admin - ${message.sender_name || "Support Team"}`
                                : `${selectedConversation.profile?.first_name} ${selectedConversation.profile?.last_name} (Student)`}
                            </p>

                            {/* Message Bubble */}
                            <div
                              className={cn(
                                "rounded-lg px-4 py-2",
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
                                  alt="Attachment"
                                  className="max-w-full rounded-md mb-2"
                                />
                              )}
                              <p className="text-sm whitespace-pre-wrap break-words">{message.content}</p>
                              <p className="text-xs opacity-70 mt-1">
                                {format(new Date(message.created_at), "HH:mm")}
                              </p>
                            </div>

                            {/* Reactions Display */}
                            {Object.keys(groupedReactions(message.id)).length > 0 && (
                              <div className="flex flex-wrap gap-0.5 px-3">
                                {Object.entries(groupedReactions(message.id)).map(([emoji, count]) => (
                                  <button
                                    key={emoji}
                                    onClick={() => handleAddReaction(message.id, emoji)}
                                    title={getReactionTooltip(message.id, emoji)}
                                    className={cn(
                                      "text-xs sm:text-sm px-2 py-1 rounded-full transition-all",
                                      "hover:scale-110 active:scale-95",
                                      userReactions[message.id] === emoji
                                        ? "bg-primary/15 ring-1 ring-primary/30"
                                        : "hover:bg-secondary/50 bg-secondary/30"
                                    )}
                                  >
                                    {emoji}
                                    {count > 1 && <span className="ml-0.5 text-[9px] font-medium">{count}</span>}
                                  </button>
                                ))}
                              </div>
                            )}

                            {/* Add Reaction Picker Button */}
                            <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                              {showReactionPicker === message.id ? (
                                <div className="mt-2">
                                  <ReactionPicker
                                    onReactionSelect={(reaction) => handleAddReaction(message.id, reaction)}
                                    currentReaction={userReactions[message.id] || undefined}
                                  />
                                </div>
                              ) : (
                                <button
                                  onClick={() => setShowReactionPicker(message.id)}
                                  className="text-xs sm:text-sm bg-secondary/50 hover:bg-primary/10 rounded-full px-2 py-1 transition-colors border border-border/30 hover:border-primary/30 flex items-center gap-1"
                                  title="Add reaction"
                                >
                                  <Smile className="h-3 w-3" />
                                  React
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}

                  {/* Typing Indicator */}
                  {isOtherTyping && (
                    <div className="flex gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className="bg-secondary text-xs">S</AvatarFallback>
                      </Avatar>
                      <div className="bg-secondary rounded-lg px-4 py-2">
                        <div className="flex gap-1">
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

              {/* Message Input */}
              {selectedConversation.status === "active" ? (
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
              ) : (
                <div className="p-4 bg-muted/50 border-t border-border/50">
                  <p className="text-xs text-muted-foreground text-center">
                    This chat is closed. Reopen to send messages.
                  </p>
                </div>
              )}
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

      {/* Close Dialog */}
      <Dialog open={showCloseDialog} onOpenChange={setShowCloseDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Close Chat</DialogTitle>
            <DialogDescription>
              Are you sure you want to close this chat? The student will not be able to send new messages until you reopen it.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCloseDialog(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleCloseConversation}>
              Close Chat
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
