import { useState, useRef, useEffect, useCallback } from "react";
import { Bot, Loader2, Menu, AlertTriangle, Check, Briefcase, Shirt, Calendar, FileText, MapPin, UserCheck, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import pasoapLogo from "@/assets/pasoa-logo.png";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/features/auth";
import { PasoaMascot } from "@/features/shared/components/PasoaMascot";
import { toast } from "sonner";
import { useChatMessages } from "../hooks/useChatMessages";
import { useTypingIndicator } from "../hooks/useTypingIndicator";
import { ChatMessage } from "./ChatMessage";
import { ChatSidebar } from "./ChatSidebar";
import { ChatInput } from "./ChatInput";
import { useIsMobile } from "@/features/shared/hooks/useIsMobile";
import { cn } from "@/lib/utils";

const suggestedQuestions = [
  "What are the requirements for internship?",
  "How much is the organizational shirt?",
  "What is the schedule of CBA Main Event?",
  "How do I apply for leave of absence?",
  "Where can I get my school ID?",
];

// Question metadata with icons and colors
const questionMetadata: Record<string, { icon: React.ElementType; color: string; gradient: string }> = {
  "What are the requirements for internship?": {
    icon: Briefcase,
    color: "text-blue-400",
    gradient: "from-blue-500/20 to-blue-600/20 hover:from-blue-500/30 hover:to-blue-600/30 border-blue-500/40 hover:border-blue-500/60"
  },
  "How much is the organizational shirt?": {
    icon: Shirt,
    color: "text-purple-400",
    gradient: "from-purple-500/20 to-purple-600/20 hover:from-purple-500/30 hover:to-purple-600/30 border-purple-500/40 hover:border-purple-500/60"
  },
  "What is the schedule of CBA Main Event?": {
    icon: Calendar,
    color: "text-orange-400",
    gradient: "from-orange-500/20 to-orange-600/20 hover:from-orange-500/30 hover:to-orange-600/30 border-orange-500/40 hover:border-orange-500/60"
  },
  "How do I apply for leave of absence?": {
    icon: FileText,
    color: "text-green-400",
    gradient: "from-green-500/20 to-green-600/20 hover:from-green-500/30 hover:to-green-600/30 border-green-500/40 hover:border-green-500/60"
  },
  "Where can I get my school ID?": {
    icon: MapPin,
    color: "text-pink-400",
    gradient: "from-pink-500/20 to-pink-600/20 hover:from-pink-500/30 hover:to-pink-600/30 border-pink-500/40 hover:border-pink-500/60"
  },
};

export function ChatInterface() {
  const { user, profile } = useAuth();
  const isMobile = useIsMobile();
  const [isTyping, setIsTyping] = useState(false);
  const [mascotMood, setMascotMood] = useState<"happy" | "thinking" | "waving" | "idle">("waving");
  const [showSidebar, setShowSidebar] = useState(!isMobile);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const {
    conversations,
    setConversations,
    currentConversation,
    setCurrentConversation,
    messages,
    setMessages,
    isLoadingConversations,
    fetchFAQs,
    fetchMessages,
    createNewConversation,
    findBestMatch,
    validateMessage,
    getSmartResponse,
    getFallbackResponse,
    failedMatchCount,
    config,
  } = useChatMessages(user?.id);

  const { isOtherTyping, startTyping, stopTyping } = useTypingIndicator(
    currentConversation?.id,
    user?.id
  );

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  const incrementFaqMatchCount = async (faqId: string) => {
    try {
      const { data: currentFaq } = await supabase
        .from("faqs")
        .select("match_count")
        .eq("id", faqId)
        .single();

      if (currentFaq) {
        await supabase
          .from("faqs")
          .update({ match_count: (currentFaq.match_count || 0) + 1 })
          .eq("id", faqId);
      }
    } catch (error) {
      console.error("Error updating match count:", error);
    }
  };

  const uploadImage = async (imageDataUrl: string): Promise<string | null> => {
    if (!user) return null;
    
    try {
      const response = await fetch(imageDataUrl);
      const blob = await response.blob();
      const filename = `${user.id}/${Date.now()}.${blob.type.split('/')[1] || 'png'}`;
      
      const { data, error } = await supabase.storage
        .from("chat-images")
        .upload(filename, blob, {
          contentType: blob.type,
          upsert: false,
        });

      if (error) throw error;
      
      const { data: publicUrl } = supabase.storage
        .from("chat-images")
        .getPublicUrl(data.path);
      
      return publicUrl.publicUrl;
    } catch (error) {
      console.error("Error uploading image:", error);
      toast.error("Failed to upload image");
      return null;
    }
  };

  const sendMessage = async (content: string, imageDataUrl?: string) => {
    if ((!content.trim() && !imageDataUrl) || !user) return;

    if (content.trim()) {
      const validation = validateMessage(content);
      if (!validation.valid) {
        toast.error(validation.error);
        return;
      }
    }

    let conversation = currentConversation;
    
    if (!conversation) {
      conversation = await createNewConversation();
      if (!conversation) return;
    }

    setIsTyping(true);
    setMascotMood("thinking");
    stopTyping();

    try {
      let imageUrl: string | null = null;
      if (imageDataUrl) {
        imageUrl = await uploadImage(imageDataUrl);
      }

      const { data: userMsg, error: userMsgError } = await supabase
        .from("messages")
        .insert({
          conversation_id: conversation.id,
          content: content.trim() || (imageUrl ? "[Image]" : ""),
          sender_type: "user",
          sender_id: user.id,
          image_url: imageUrl,
        })
        .select()
        .single();

      if (userMsgError) throw userMsgError;
      
      setMessages((prev) => [...prev, userMsg]);

      // Check if conversation has an admin assigned - if so, don't send bot response
      // This includes both requires_admin=true AND assigned_admin_id being set
      if (conversation.requires_admin || conversation.assigned_admin_id) {
        setIsTyping(false);
        setMascotMood("idle");
        
        await supabase
          .from("conversations")
          .update({ updated_at: new Date().toISOString() })
          .eq("id", conversation.id);
        
        return;
      }

      const delay = config.MIN_TYPING_DELAY_MS + Math.random() * (config.MAX_TYPING_DELAY_MS - config.MIN_TYPING_DELAY_MS);
      await new Promise((resolve) => setTimeout(resolve, delay));

      let botResponse: string;
      let matchedFaqId: string | null = null;

      const smartResponse = getSmartResponse(content);
      
      if (smartResponse) {
        botResponse = smartResponse.response;
        setMascotMood("happy");
      } else {
        const { faq, confidence } = findBestMatch(content);

        if (faq && confidence >= config.MIN_CONFIDENCE_THRESHOLD) {
          botResponse = faq.answer;
          matchedFaqId = faq.id;
          setMascotMood("happy");
          incrementFaqMatchCount(faq.id);
        } else {
          botResponse = getFallbackResponse();
          setMascotMood("idle");
        }
      }

      const { data: botMsg, error: botMsgError } = await supabase
        .from("messages")
        .insert({
          conversation_id: conversation.id,
          content: botResponse,
          sender_type: "bot",
          matched_faq_id: matchedFaqId,
        })
        .select()
        .single();

      if (botMsgError) throw botMsgError;
      
      setMessages((prev) => [...prev, botMsg]);

      if (messages.length === 0 || messages.length === 1) {
        const title = content.length > 30 ? content.substring(0, 30) + "..." : content;
        await supabase
          .from("conversations")
          .update({ title, updated_at: new Date().toISOString() })
          .eq("id", conversation.id);
        
        setConversations((prev) =>
          prev.map((c) => (c.id === conversation.id ? { ...c, title } : c))
        );
      }
    } catch (error) {
      console.error("Error sending message:", error);
      toast.error("Failed to send message");
    } finally {
      setIsTyping(false);
      setTimeout(() => setMascotMood("idle"), 3000);
    }
  };

  const requestHumanAgent = async () => {
    if (!currentConversation || !user) {
      toast.error("Please start a conversation first");
      return;
    }

    if (currentConversation.requires_admin) {
      toast.info("You've already requested a human agent");
      return;
    }

    try {
      await supabase
        .from("conversations")
        .update({ requires_admin: true })
        .eq("id", currentConversation.id);

      setCurrentConversation({ ...currentConversation, requires_admin: true });
      setConversations((prev) =>
        prev.map((c) =>
          c.id === currentConversation.id ? { ...c, requires_admin: true } : c
        )
      );

      const { data: systemMsg } = await supabase.from("messages").insert({
        conversation_id: currentConversation.id,
        content: "🔔 You've requested to speak with a human agent. An administrator will respond shortly. The bot will no longer reply in this conversation until an admin takes over.",
        sender_type: "bot",
      }).select().single();

      if (systemMsg) {
        setMessages((prev) => [...prev, systemMsg]);
      }

      toast.success("Request sent! An admin will respond soon.");
    } catch (error) {
      console.error("Error requesting human agent:", error);
      toast.error("Failed to request human agent");
    }
  };

  const handleSelectConversation = (conv: typeof currentConversation) => {
    setCurrentConversation(conv);
    setShowSidebar(false);
  };

  const handleNewChat = async () => {
    // Check if current conversation has no messages - don't create new one
    if (currentConversation && messages.length === 0) {
      toast.info("Please send a message in this conversation first");
      return;
    }
    
    await createNewConversation();
    if (isMobile) setShowSidebar(false);
  };

  const handleTypingChange = useCallback((isTyping: boolean) => {
    if (isTyping) {
      startTyping();
    } else {
      stopTyping();
    }
  }, [startTyping, stopTyping]);

  // Determine conversation status for display
  const getStatusDisplay = () => {
    if (isTyping) return { text: "✍️ Typing...", color: "text-primary" };
    if (isOtherTyping) return { text: "👤 Admin is typing...", color: "text-green-500" };
    if (currentConversation?.assigned_admin_id) {
      return { text: "✅ Admin connected", color: "text-green-500" };
    }
    if (currentConversation?.requires_admin) {
      return { text: "🟠 Waiting for admin...", color: "text-orange-500" };
    }
    return { text: "🟢 Online • Ready to help", color: "text-green-500" };
  };

  const status = getStatusDisplay();

  return (
    <div className="flex flex-col w-full h-screen bg-gradient-to-b from-background via-background to-accent/5">
      {/* Overlay for bottom drawer */}
      {showSidebar && (
        <div 
          className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40"
          onClick={() => setShowSidebar(false)}
        />
      )}

      {/* Messages Container - ONLY scrollable section */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden w-full">
        <div className={cn(
          "space-y-2 py-2 sm:py-3 md:py-4",
          "px-2 sm:px-3 md:px-6 lg:px-12"
        )}>
          {messages.length === 0 && !isLoadingConversations && (
            <div className="flex items-center justify-center py-8 sm:py-12 md:py-16 px-2 sm:px-0">
              <Card className="w-full max-w-xs sm:max-w-md p-4 sm:p-5 md:p-7 border border-border/30 bg-gradient-to-br from-card/80 via-card/60 to-primary/8 backdrop-blur-sm shadow-md hover:shadow-lg transition-all duration-300">
                <div className="text-center space-y-3 sm:space-y-4 md:space-y-5">
                  <div className="flex justify-center transform hover:scale-110 transition-transform duration-300">
                    <PasoaMascot size="lg" mood="waving" />
                  </div>
                  <div>
                    <h3 className="font-bold text-base sm:text-lg md:text-xl mb-1 sm:mb-2 bg-gradient-to-r from-primary via-blue-500 to-blue-600 bg-clip-text text-transparent">
                      Welcome to Pasoa Hub!
                    </h3>
                    <p className="text-xs sm:text-sm text-muted-foreground/90 leading-relaxed">
                      I'm here to help with all your questions about CBA and campus life. What would you like to know?
                    </p>
                  </div>
                  <div className="space-y-2 sm:space-y-3 text-left bg-background/50 rounded-2xl p-3 sm:p-4 md:p-5 border border-border/40 backdrop-blur-sm">
                    <div className="flex items-start gap-2 sm:gap-3">
                      <span className="text-base sm:text-lg flex-shrink-0">💬</span>
                      <div className="min-w-0">
                        <p className="text-xs sm:text-sm font-bold text-foreground">Ask anything</p>
                        <p className="text-[10px] sm:text-xs text-muted-foreground/80">Up to {config.MAX_MESSAGE_LENGTH} characters</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-2 sm:gap-3">
                      <span className="text-base sm:text-lg flex-shrink-0">📸</span>
                      <div className="min-w-0">
                        <p className="text-xs sm:text-sm font-bold text-foreground">Attach images</p>
                        <p className="text-[10px] sm:text-xs text-muted-foreground/80">Up to {config.MAX_IMAGE_SIZE_MB}MB each</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-2 sm:gap-3">
                      <span className="text-base sm:text-lg flex-shrink-0">👤</span>
                      <div className="min-w-0">
                        <p className="text-xs sm:text-sm font-bold text-foreground">Talk to an admin</p>
                        <p className="text-[10px] sm:text-xs text-muted-foreground/80">Request human support anytime</p>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            </div>
          )}

          {messages.length > 0 && (
            <div className="space-y-2">
              {messages.map((message) => (
                <ChatMessage
                  key={message.id}
                  messageId={message.id}
                  content={message.content}
                  senderType={message.sender_type}
                  createdAt={message.created_at}
                  imageUrl={message.image_url}
                  userAvatarUrl={message.sender_type === "user" ? profile?.avatar_url || null : undefined}
                />
              ))}

              {/* Bot typing indicator */}
              {isTyping && (
                <div className="flex gap-2 sm:gap-3 animate-fade-up px-1 sm:px-0">
                  <div className="h-7 w-7 sm:h-8 sm:w-8 md:h-9 md:w-9 rounded-full bg-gradient-to-br from-primary to-blue-500 flex items-center justify-center flex-shrink-0 shadow-lg ring-2 ring-background">
                    <img src={pasoapLogo} alt="Pasoa Chatbot" className="h-3 sm:h-4 md:h-5 w-3 sm:w-4 md:w-5 object-contain" />
                  </div>
                  <div className="flex items-end gap-1 sm:gap-1.5 px-3 sm:px-4 py-2 sm:py-2.5 md:py-3 rounded-3xl bg-card border border-border/60 shadow-md backdrop-blur-sm">
                    <span className="w-2 sm:w-2.5 h-2 sm:h-2.5 rounded-full bg-primary animate-bounce" style={{ animationDelay: "0ms" }} />
                    <span className="w-2 sm:w-2.5 h-2 sm:h-2.5 rounded-full bg-primary animate-bounce" style={{ animationDelay: "150ms" }} />
                    <span className="w-2 sm:w-2.5 h-2 sm:h-2.5 rounded-full bg-primary animate-bounce" style={{ animationDelay: "300ms" }} />
                  </div>
                </div>
              )}

              {/* Admin typing indicator */}
              {isOtherTyping && !isTyping && (
                <div className="flex gap-2 sm:gap-3 animate-fade-up px-1 sm:px-0">
                  <div className="h-7 w-7 sm:h-8 sm:w-8 md:h-9 md:w-9 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center flex-shrink-0 shadow-lg ring-2 ring-background">
                    <UserCheck className="h-3 sm:h-4 md:h-5 w-3 sm:w-4 md:w-5 text-white" />
                  </div>
                  <div className="flex items-end gap-1 sm:gap-1.5 px-3 sm:px-4 py-2 sm:py-2.5 md:py-3 rounded-3xl bg-green-500/15 border border-green-500/50 shadow-md">
                    <span className="w-2 sm:w-2.5 h-2 sm:h-2.5 rounded-full bg-green-500 animate-bounce" style={{ animationDelay: "0ms" }} />
                    <span className="w-2 sm:w-2.5 h-2 sm:h-2.5 rounded-full bg-green-500 animate-bounce" style={{ animationDelay: "150ms" }} />
                    <span className="w-2 sm:w-2.5 h-2 sm:h-2.5 rounded-full bg-green-500 animate-bounce" style={{ animationDelay: "300ms" }} />
                  </div>
                </div>
              )}
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Suggested Questions - Fixed (not scrollable) */}
      {messages.length === 0 && !isLoadingConversations && (
        <div className="border-t border-border/30 bg-background/50 backdrop-blur-sm shrink-0 overflow-x-auto overflow-y-hidden">
          <div className="py-2 px-2 sm:px-3 md:px-6 lg:px-12">
            <div className="flex flex-wrap gap-1 sm:gap-1.5 md:gap-2">
              {suggestedQuestions.map((question, index) => (
                <button
                  key={`${question}-${index}`}
                  onClick={() => sendMessage(question)}
                  className="px-2 sm:px-2.5 md:px-3 py-1 sm:py-1.5 md:py-2 rounded-lg border border-border/50 text-[10px] sm:text-xs md:text-sm font-normal text-foreground/80 hover:text-foreground hover:border-border/80 transition-all duration-200 hover:bg-accent/30 active:scale-95 whitespace-nowrap"
                >
                  {question}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Input Area - Fixed (not scrollable) */}
      <div className="border-t border-border/30 bg-background/95 backdrop-blur-sm shrink-0 w-full overflow-hidden">
        <div className={cn(
          "px-2 sm:px-3 md:px-6 lg:px-12 py-1.5 sm:py-2 md:py-2"
        )}>
          <ChatInput
            onSendMessage={sendMessage}
            onNewChat={handleNewChat}
            onRequestHumanAgent={requestHumanAgent}
            onRefresh={fetchFAQs}
            onToggleHistory={() => setShowSidebar(!showSidebar)}
            onTypingChange={handleTypingChange}
            isTyping={isTyping}
            isHumanAgentRequested={currentConversation?.requires_admin}
            isAdminConnected={!!currentConversation?.assigned_admin_id}
            maxMessageLength={config.MAX_MESSAGE_LENGTH}
            isMobile={isMobile}
          />
        </div>
      </div>

      {/* Bottom Drawer - Chat History */}
      <div
        className={cn(
          "fixed bottom-0 left-0 right-0 bg-background border-t border-border/30 shadow-2xl transition-transform duration-300 z-50 rounded-t-2xl overflow-hidden",
          "h-[calc(100vh-5.5rem)] sm:h-[calc(100vh-6rem)] md:h-[calc(100vh-7rem)]",
          showSidebar ? "translate-y-0 pointer-events-auto" : "translate-y-full pointer-events-none"
        )}
      >
        <div className="flex flex-col h-full">
          {/* Drag Handle */}
          <div className="flex justify-center pt-2 sm:pt-2.5 pb-2 sm:pb-3">
            <div className="w-10 sm:w-12 h-1 sm:h-1.5 rounded-full bg-border/50" />
          </div>
          
          {/* History Header */}
          <div className="px-3 sm:px-4 pb-2 sm:pb-3 border-b border-border/20 flex items-center justify-between">
            <h3 className="font-semibold text-xs sm:text-sm">Chat History</h3>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 rounded-lg hover:bg-primary/20 transition-colors p-0"
              onClick={() => setShowSidebar(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Conversations List */}
          <ScrollArea className="flex-1">
            <ChatSidebar
              conversations={conversations}
              currentConversation={currentConversation}
              isLoading={isLoadingConversations}
              onSelectConversation={handleSelectConversation}
              onNewConversation={handleNewChat}
            />
          </ScrollArea>
        </div>
      </div>
    </div>
  );
}
