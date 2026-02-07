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
  X,
  Trash2,
  Eye,
  CheckCircle,
  AlertTriangle,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/features/auth";
import { useTypingIndicator } from "@/features/chat/hooks/useTypingIndicator";
import { MessageBubble } from "@/features/shared/components/MessageBubble";
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
  sender_avatar_url?: string | null;
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
    } catch (error) {
      console.error("Error fetching messages:", error);
      toast.error("Failed to load messages");
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
        <Badge variant="secondary" className="text-xs gap-1 bg-slate-500/15 text-slate-600 dark:text-slate-400 border-slate-500/30 hover:shadow-md transition-all">
          <Lock className="h-3 w-3" />
          Closed
        </Badge>
      );
    }
    if (conv.requires_admin && !conv.assigned_admin_id) {
      return (
        <Badge variant="destructive" className="text-xs gap-1 bg-red-500/20 text-red-600 dark:text-red-400 border-red-500/30 animate-pulse hover:shadow-md transition-all">
          <AlertTriangle className="h-3 w-3" />
          Urgent
        </Badge>
      );
    }
    if (conv.assigned_admin_id === user?.id) {
      return (
        <Badge variant="default" className="text-xs bg-blue-500/20 text-blue-600 dark:text-blue-400 border-blue-500/30 gap-1 hover:shadow-md transition-all">
          <CheckCircle className="h-3 w-3" />
          Assigned
        </Badge>
      );
    }
    return (
      <Badge variant="default" className="text-xs bg-green-500/20 text-green-600 dark:text-green-400 border-green-500/30 hover:shadow-md transition-all">
        Active
      </Badge>
    );
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
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between pb-2">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/15 rounded-xl">
              <MessageCircle className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h2 className="text-2xl md:text-3xl font-bold">Student Conversations</h2>
              <p className="text-xs md:text-sm text-muted-foreground mt-0.5">Manage and support student inquiries</p>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 sm:gap-5 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
        <Card className="border-border/50 bg-gradient-to-br from-blue-500/15 via-blue-500/5 to-transparent hover:shadow-lg hover:border-blue-500/30 transition-all duration-300 cursor-pointer group">
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div className="space-y-3">
                <p className="text-xs sm:text-sm text-muted-foreground font-semibold uppercase tracking-wider">Total Conversations</p>
                <p className="text-3xl sm:text-4xl font-bold text-blue-600 dark:text-blue-400 group-hover:scale-110 transition-transform">
                  {conversations.length}
                </p>
              </div>
              <div className="p-3 bg-blue-500/20 rounded-xl group-hover:scale-110 transition-transform">
                <MessageCircle className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/50 bg-gradient-to-br from-green-500/15 via-green-500/5 to-transparent hover:shadow-lg hover:border-green-500/30 transition-all duration-300 cursor-pointer group">
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div className="space-y-3">
                <p className="text-xs sm:text-sm text-muted-foreground font-semibold uppercase tracking-wider">Active Chats</p>
                <p className="text-3xl sm:text-4xl font-bold text-green-600 dark:text-green-400 group-hover:scale-110 transition-transform">
                  {conversations.filter((c) => c.status === "active").length}
                </p>
              </div>
              <div className="p-3 bg-green-500/20 rounded-xl group-hover:scale-110 transition-transform">
                <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/50 bg-gradient-to-br from-red-500/15 via-red-500/5 to-transparent hover:shadow-lg hover:border-red-500/30 transition-all duration-300 cursor-pointer group">
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div className="space-y-3">
                <p className="text-xs sm:text-sm text-muted-foreground font-semibold uppercase tracking-wider">Needs Attention</p>
                <p className="text-3xl sm:text-4xl font-bold text-red-600 dark:text-red-400 group-hover:scale-110 transition-transform">
                  {conversations.filter((c) => c.requires_admin && !c.assigned_admin_id).length}
                </p>
              </div>
              <div className="p-3 bg-red-500/20 rounded-xl group-hover:scale-110 transition-transform">
                <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 h-[calc(100vh-22rem)]">
        {/* Conversations List */}
        <Card className={cn(
          "border-border/50 lg:col-span-1 overflow-hidden shadow-lg",
          selectedConversation && "hidden lg:block"
        )}>
          <CardHeader className="pb-4 border-b border-border/50 bg-gradient-to-br from-primary/5 to-primary/10">
            <CardTitle className="text-lg font-bold">Active Chats</CardTitle>
            <div className="relative mt-4">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name or ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 text-sm border-primary/20 focus:border-primary/50 transition-colors"
              />
            </div>
            <div className="flex gap-2 mt-4">
              {(["all", "active", "closed"] as const).map((status) => (
                <Button
                  key={status}
                  size="sm"
                  variant={filterStatus === status ? "default" : "outline"}
                  onClick={() => setFilterStatus(status)}
                  className="text-xs capitalize font-medium transition-all hover:shadow-md"
                >
                  {status === "all" ? "All" : status === "active" ? "Active" : "Closed"}
                </Button>
              ))}
            </div>
          </CardHeader>
          <ScrollArea className="h-[calc(100%-10rem)]">
            <CardContent className="p-3 space-y-2">
              {filteredConversations.length === 0 ? (
                <div className="text-center text-muted-foreground py-12 text-sm">
                  <MessageCircle className="h-8 w-8 mx-auto mb-3 opacity-40" />
                  No conversations found
                </div>
              ) : (
                filteredConversations.map((conv) => (
                  <div
                    key={conv.id}
                    onClick={() => handleSelectConversation(conv)}
                    className={cn(
                      "p-3.5 rounded-xl cursor-pointer transition-all duration-200 hover:shadow-md border border-transparent",
                      "hover:bg-accent/60 hover:border-primary/20",
                      selectedConversation?.id === conv.id && "bg-primary/10 border border-primary/40 shadow-md"
                    )}
                  >
                    <div className="flex items-start gap-3">
                      <Avatar className="h-11 w-11 shrink-0 ring-2 ring-primary/20">
                        <AvatarImage src={conv.profile?.avatar_url || ""} />
                        <AvatarFallback className="bg-gradient-to-br from-primary to-purple-600 text-white text-xs font-bold">
                          {conv.profile?.first_name?.[0]}{conv.profile?.last_name?.[0]}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2 mb-1">
                          <p className="font-semibold text-sm truncate">
                            {conv.profile?.first_name} {conv.profile?.last_name}
                          </p>
                          {getStatusBadge(conv)}
                        </div>
                        {conv.profile?.student_id && (
                          <p className="text-xs text-muted-foreground mb-1">ID: {conv.profile.student_id}</p>
                        )}
                        <p className="text-xs text-muted-foreground truncate mb-2 line-clamp-2">
                          {conv.last_message}
                        </p>
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-muted-foreground bg-secondary/30 px-2 py-0.5 rounded-full">
                            {conv.message_count} msg
                          </span>
                          <p className="text-xs text-muted-foreground">
                            {format(new Date(conv.updated_at), "HH:mm")}
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
          "border-border/50 lg:col-span-3 flex flex-col overflow-hidden shadow-lg",
          !selectedConversation && "hidden lg:flex"
        )}>
          {selectedConversation ? (
            <>
              {/* Header */}
              <CardHeader className="pb-4 border-b border-border/50 bg-gradient-to-r from-primary/5 via-primary/3 to-transparent">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 flex-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="lg:hidden hover:bg-secondary/50 rounded-lg"
                      onClick={() => setSelectedConversation(null)}
                    >
                      <ArrowLeft className="h-5 w-5" />
                    </Button>
                    <Avatar className="h-12 w-12 ring-2 ring-primary/20">
                      <AvatarImage src={selectedConversation.profile?.avatar_url || ""} />
                      <AvatarFallback className="bg-gradient-to-br from-primary to-purple-600 text-white font-bold">
                        {selectedConversation.profile?.first_name?.[0]}
                        {selectedConversation.profile?.last_name?.[0]}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <p className="font-bold text-base">
                        {selectedConversation.profile?.first_name} {selectedConversation.profile?.last_name}
                      </p>
                      {selectedConversation.profile?.student_id && (
                        <p className="text-xs text-muted-foreground">
                          ID: {selectedConversation.profile.student_id}
                        </p>
                      )}
                      {isOtherTyping && (
                        <div className="flex items-center gap-1">
                          <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                          <p className="text-xs text-green-600 dark:text-green-400 font-medium">Typing...</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="hover:bg-secondary/50 rounded-lg">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-56">
                      {selectedConversation.status === "active" ? (
                        <>
                          <DropdownMenuItem
                            onClick={() => {
                              setConversationToClose(selectedConversation);
                              setShowCloseDialog(true);
                            }}
                            className="text-destructive focus:text-destructive focus:bg-destructive/10 cursor-pointer"
                          >
                            <Lock className="h-4 w-4 mr-2" />
                            Close Chat
                          </DropdownMenuItem>
                        </>
                      ) : (
                        <DropdownMenuItem
                          onClick={() => handleReopenConversation(selectedConversation.id)}
                          className="cursor-pointer"
                        >
                          <LockOpen className="h-4 w-4 mr-2" />
                          Reopen Chat
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuSeparator />
                      <DropdownMenuItem className="cursor-pointer">
                        <Eye className="h-4 w-4 mr-2" />
                        View Profile
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                {selectedConversation.status === "closed" && (
                  <div className="mt-4 p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg flex items-center gap-2">
                    <Lock className="h-4 w-4 text-amber-600 dark:text-amber-400 flex-shrink-0" />
                    <p className="text-xs text-amber-700 dark:text-amber-300 font-medium">
                      This chat has been closed. Students cannot send messages.
                    </p>
                  </div>
                )}
              </CardHeader>

              {/* Messages */}
              <ScrollArea className="flex-1 p-3 sm:p-5">
                <div className="space-y-3 sm:space-y-4 pr-4">
                  {messages.map((message) => {
                    let senderName = "Student";
                    let senderAvatar: string | null | undefined = undefined;
                    
                    if (message.sender_type === "bot") {
                      senderName = "PASOA Bot";
                    } else if (message.sender_type === "admin") {
                      if (message.sender_name) {
                        senderName = message.sender_name;
                        senderAvatar = undefined;
                      } else {
                        senderName = "Support Team";
                      }
                    } else if (message.sender_type === "student") {
                      senderName = selectedConversation?.profile
                        ? `${selectedConversation.profile.first_name} ${selectedConversation.profile.last_name}`
                        : "Student";
                      senderAvatar = selectedConversation?.profile?.avatar_url;
                    }
                    
                    return (
                      <MessageBubble
                        key={message.id}
                        message={message}
                        isOwn={message.sender_type === "admin"}
                        senderName={senderName}
                        userAvatar={senderAvatar}
                        isBot={message.sender_type === "bot"}
                      />
                    );
                  })}

                  {/* Typing Indicator */}
                  {isOtherTyping && (
                    <div className="flex gap-3">
                      <Avatar className="h-8 w-8 hidden sm:flex">
                        <AvatarFallback className="bg-secondary text-xs">S</AvatarFallback>
                      </Avatar>
                      <div className="bg-secondary/60 rounded-2xl px-4 py-3 flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-muted-foreground animate-bounce" style={{ animationDelay: "0ms" }} />
                        <span className="w-2 h-2 rounded-full bg-muted-foreground animate-bounce" style={{ animationDelay: "150ms" }} />
                        <span className="w-2 h-2 rounded-full bg-muted-foreground animate-bounce" style={{ animationDelay: "300ms" }} />
                      </div>
                    </div>
                  )}

                  <div ref={messagesEndRef} />
                </div>
              </ScrollArea>

              {/* Message Input */}
              {selectedConversation.status === "active" ? (
                <form onSubmit={handleSendMessage} className="p-5 border-t border-border/50 bg-gradient-to-t from-background to-transparent">
                  <div className="flex gap-2 items-end">
                    <Input
                      value={newMessage}
                      onChange={handleInputChange}
                      placeholder="Type your reply..."
                      className="flex-1 border-primary/30 focus:border-primary/60 rounded-xl shadow-sm transition-all"
                    />
                    <Button 
                      type="submit" 
                      disabled={isSending || !newMessage.trim()}
                      className="rounded-xl hover:shadow-md transition-all shadow-sm"
                    >
                      {isSending ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Send className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </form>
              ) : (
                <div className="p-5 bg-gradient-to-t from-amber-500/5 to-transparent border-t border-amber-500/20">
                  <p className="text-xs text-center text-muted-foreground font-medium">
                    This chat is closed. Reopen it to send messages.
                  </p>
                </div>
              )}
            </>
          ) : (
            <CardContent className="flex-1 flex flex-col items-center justify-center bg-gradient-to-br from-primary/5 to-primary/3">
              <div className="text-center text-muted-foreground space-y-3">
                <div className="p-4 bg-primary/10 rounded-full w-fit mx-auto">
                  <MessageCircle className="h-8 w-8 text-primary/60" />
                </div>
                <div>
                  <p className="font-semibold">No Chat Selected</p>
                  <p className="text-xs">Select a conversation to view and manage messages</p>
                </div>
              </div>
            </CardContent>
          )}
        </Card>
      </div>

      {/* Close Dialog */}
      <Dialog open={showCloseDialog} onOpenChange={setShowCloseDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="text-xl">Close Chat</DialogTitle>
            <DialogDescription className="text-sm pt-2">
              Are you sure you want to close this chat? The student will not be able to send new messages until you reopen it.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setShowCloseDialog(false)} className="rounded-lg">
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleCloseConversation}
              className="rounded-lg hover:shadow-lg transition-all"
            >
              <Lock className="h-4 w-4 mr-2" />
              Close Chat
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
