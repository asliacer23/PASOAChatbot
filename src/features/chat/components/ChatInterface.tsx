import { useState, useRef, useEffect, useCallback } from "react";
import { Bot, Loader2, Menu, AlertTriangle, Check, Briefcase, Shirt, Calendar, FileText, MapPin, UserCheck } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
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
  const { user } = useAuth();
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
    if (isMobile) setShowSidebar(false);
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
    <div className="flex flex-col md:flex-row w-full gap-0 relative bg-gradient-to-b from-background via-background to-accent/5 h-screen md:h-[calc(100vh-3.5rem)] lg:h-[calc(100vh-4rem)] overflow-hidden">
      {/* Mobile Overlay Backdrop */}
      {isMobile && showSidebar && (
        <div 
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-30 md:hidden"
          onClick={() => setShowSidebar(false)}
        />
      )}

      {/* Conversations Sidebar - Enhanced with smooth transitions */}
      <div
        className={cn(
          "fixed md:relative md:flex md:flex-col md:w-72 md:h-full md:border-r border-border/50 md:bg-gradient-to-b md:from-background md:to-background/90 md:overflow-hidden bg-background md:z-10 z-30 transition-all duration-300 ease-in-out",
          "w-72 h-screen md:h-full overflow-y-auto md:overflow-y-auto",
          isMobile && !showSidebar && "-translate-x-full",
          isMobile && showSidebar && "translate-x-0 shadow-2xl",
          !isMobile && "translate-x-0 md:overflow-y-auto"
        )}
      >
        <ChatSidebar
          conversations={conversations}
          currentConversation={currentConversation}
          isLoading={isLoadingConversations}
          onSelectConversation={handleSelectConversation}
          onNewConversation={handleNewChat}
        />
      </div>

      {/* Chat Area - Better desktop layout */}
      <div className={cn(
        "flex-1 flex flex-col min-w-0 bg-transparent relative z-20 w-full overflow-hidden",
        isMobile ? "h-[calc(100vh-7rem)]" : "h-full"
      )}>
        {/* Mobile Header with Toggle */}
        <div className="fixed top-0 left-0 right-0 md:hidden border-b border-border/30 backdrop-blur-md bg-background/98 z-50 flex items-center justify-between h-14 shadow-md px-3">
          <Button
            variant="ghost"
            size="sm"
            className="h-10 w-10 rounded-lg hover:bg-primary/20 hover:text-primary transition-all duration-200 p-0 active:scale-95"
            onClick={() => setShowSidebar(!showSidebar)}
            title="Show chat history"
          >
            <Menu className="h-5 w-5 text-primary" />
          </Button>
          
          <div className="flex-1 text-center">
            <h2 className="font-bold text-sm bg-gradient-to-r from-primary via-blue-500 to-blue-600 bg-clip-text text-transparent">
              Pasoa
            </h2>
          </div>
          
          <div className="w-10" />
        </div>

        {/* Messages Area */}
        <ScrollArea className={cn(
          "flex-1 overflow-hidden",
          isMobile && "pt-14 pb-20"
        )}>
          <div className={cn(
            "space-y-2 md:space-y-3 px-3 sm:px-4 md:px-6 md:px-8 lg:px-12 py-4 md:py-6 pb-2 md:pb-4 max-w-7xl mx-auto w-full"
          )}>
            {messages.length === 0 && !isLoadingConversations && (
              <div className="h-full flex items-center justify-center py-8 md:py-12">
                <Card className="w-full max-w-md p-5 sm:p-7 md:p-8 border border-border/30 bg-gradient-to-br from-card/80 via-card/60 to-primary/8 backdrop-blur-sm shadow-md hover:shadow-lg transition-all duration-300 hover:scale-[1.02]">
                  <div className="text-center space-y-4 sm:space-y-5 md:space-y-6">
                    <div className="flex justify-center transform hover:scale-110 transition-transform duration-300">
                      <PasoaMascot size="lg" mood="waving" />
                    </div>
                    <div>
                      <h3 className="font-bold text-base sm:text-lg md:text-xl mb-2 bg-gradient-to-r from-primary via-blue-500 to-blue-600 bg-clip-text text-transparent">
                        Welcome to Pasoa Hub!
                      </h3>
                      <p className="text-xs sm:text-sm text-muted-foreground/90 leading-relaxed">
                        I'm here to help with all your questions about CBA and campus life. What would you like to know?
                      </p>
                    </div>
                    <div className="space-y-2.5 text-left bg-background/50 rounded-2xl p-4 sm:p-5 border border-border/40 backdrop-blur-sm">
                      <div className="flex items-start gap-3 sm:gap-3.5">
                        <span className="text-lg flex-shrink-0">💬</span>
                        <div className="min-w-0">
                          <p className="text-xs sm:text-sm font-bold text-foreground">Ask anything</p>
                          <p className="text-[10px] sm:text-xs text-muted-foreground/80">Up to {config.MAX_MESSAGE_LENGTH} characters</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3 sm:gap-3.5">
                        <span className="text-lg flex-shrink-0">📸</span>
                        <div className="min-w-0">
                          <p className="text-xs sm:text-sm font-bold text-foreground">Attach images</p>
                          <p className="text-[10px] sm:text-xs text-muted-foreground/80">Up to {config.MAX_IMAGE_SIZE_MB}MB each</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3 sm:gap-3.5">
                        <span className="text-lg flex-shrink-0">👤</span>
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
              <div className="space-y-1.5 md:space-y-2.5">
                {messages.map((message) => (
                  <ChatMessage
                    key={message.id}
                    messageId={message.id}
                    content={message.content}
                    senderType={message.sender_type}
                    createdAt={message.created_at}
                    imageUrl={message.image_url}
                  />
                ))}

                {/* Bot typing indicator */}
                {isTyping && (
                  <div className="flex gap-3 animate-fade-up px-2 sm:px-3 md:px-0">
                    <div className="h-8 md:h-9 w-8 md:w-9 rounded-full bg-gradient-to-br from-primary to-blue-500 flex items-center justify-center flex-shrink-0 shadow-lg ring-2 ring-background">
                      <Bot className="h-4 md:h-5 w-4 md:w-5 text-primary-foreground" />
                    </div>
                    <div className="flex items-end gap-1.5 px-4 py-2.5 md:py-3 rounded-3xl bg-card border border-border/60 shadow-md backdrop-blur-sm">
                      <span className="w-2.5 h-2.5 rounded-full bg-primary animate-bounce" style={{ animationDelay: "0ms" }} />
                      <span className="w-2.5 h-2.5 rounded-full bg-primary animate-bounce" style={{ animationDelay: "150ms" }} />
                      <span className="w-2.5 h-2.5 rounded-full bg-primary animate-bounce" style={{ animationDelay: "300ms" }} />
                    </div>
                  </div>
                )}

                {/* Admin typing indicator */}
                {isOtherTyping && !isTyping && (
                  <div className="flex gap-3 animate-fade-up px-2 sm:px-3 md:px-0">
                    <div className="h-8 md:h-9 w-8 md:w-9 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center flex-shrink-0 shadow-lg ring-2 ring-background">
                      <UserCheck className="h-4 md:h-5 w-4 md:w-5 text-white" />
                    </div>
                    <div className="flex items-end gap-1.5 px-4 py-2.5 md:py-3 rounded-3xl bg-green-500/15 border border-green-500/50 shadow-md">
                      <span className="w-2.5 h-2.5 rounded-full bg-green-500 animate-bounce" style={{ animationDelay: "0ms" }} />
                      <span className="w-2.5 h-2.5 rounded-full bg-green-500 animate-bounce" style={{ animationDelay: "150ms" }} />
                      <span className="w-2.5 h-2.5 rounded-full bg-green-500 animate-bounce" style={{ animationDelay: "300ms" }} />
                    </div>
                  </div>
                )}
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>

        {/* Suggested Questions - Auto-Scrolling Carousel */}
        {messages.length === 0 && !isLoadingConversations && (
          <div className="border-t border-border/30 bg-background">
            <div className="py-2 md:py-3 space-y-2 md:space-y-3">
              {/* Single Line Auto-Scrolling Carousel */}
              <div className="relative overflow-hidden">
                {/* Scrollable Container */}
                <div className="overflow-hidden">
                  <div className="flex gap-3 px-3 sm:px-4 md:px-6 md:px-8 lg:px-12 py-1 md:py-2 animate-carousel">
                    {/* Double the questions for seamless loop */}
                    {[...suggestedQuestions, ...suggestedQuestions].map((question, index) => {
                      const metadata = questionMetadata[question];
                      const Icon = metadata?.icon || Menu;
                      
                      return (
                        <button
                          key={`${question}-${index}`}
                          onClick={() => sendMessage(question)}
                          className={cn(
                            "group relative flex-shrink-0 px-3 sm:px-3.5 py-2 md:py-2.5 rounded-xl border transition-all duration-300 overflow-hidden",
                            "hover:shadow-sm active:scale-95 whitespace-nowrap w-max text-[11px] md:text-xs font-medium",
                            metadata?.gradient || "from-primary/20 to-blue-500/20 border-primary/40 hover:border-primary/60 hover:from-primary/30 hover:to-blue-500/30",
                            "bg-gradient-to-br hover:shadow-md"
                          )}
                        >
                          {/* Animated background shimmer */}
                          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                          
                          <div className="relative z-10 flex items-center gap-1 sm:gap-1.5">
                            <Icon className={cn("h-3 w-3 md:h-3.5 md:w-3.5 flex-shrink-0 transition-transform group-hover:scale-110 duration-300", metadata?.color || "text-primary")} />
                            <span className="text-foreground group-hover:text-primary transition-colors font-medium">
                              {question}
                            </span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
                
                {/* Fade gradients */}
                <div className="absolute left-0 top-0 bottom-0 w-4 sm:w-8 md:w-16 bg-gradient-to-r from-background to-transparent pointer-events-none" />
                <div className="absolute right-0 top-0 bottom-0 w-4 sm:w-8 md:w-16 bg-gradient-to-l from-background to-transparent pointer-events-none" />
              </div>
            </div>
          </div>
        )}

        {/* Input - Mobile Optimized with Fixed Positioning */}
        <div className={cn(
          "border-t border-border/30 bg-background",
          isMobile ? "fixed bottom-16 left-0 right-0 z-40 pt-2 px-3 sm:px-4 pb-3 md:bottom-0 md:pt-3 md:px-6 md:px-8 lg:px-12 md:pb-4" : "md:pt-3 md:px-6 md:px-8 lg:px-12"
        )}>
          <ChatInput
            onSendMessage={sendMessage}
            onNewChat={handleNewChat}
            onRequestHumanAgent={requestHumanAgent}
            onRefresh={fetchFAQs}
            onTypingChange={handleTypingChange}
            isTyping={isTyping}
            isHumanAgentRequested={currentConversation?.requires_admin}
            isAdminConnected={!!currentConversation?.assigned_admin_id}
            maxMessageLength={config.MAX_MESSAGE_LENGTH}
          />
        </div>
      </div>
    </div>
  );
}
