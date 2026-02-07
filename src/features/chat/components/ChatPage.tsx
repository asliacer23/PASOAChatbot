import { useState, useRef, useEffect, useCallback } from "react";
import { Bot, Loader2, Menu, AlertTriangle, Plus, X, Send } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/features/auth";
import { PasoaMascot } from "@/features/shared/components/PasoaMascot";
import { toast } from "sonner";
import { useMessages } from "../hooks/useMessages";
import { useSmartResponses } from "../hooks/useSmartResponses";
import { useMessageValidation } from "../hooks/useMessageValidation";
import { useTypingIndicator } from "../hooks/useTypingIndicator";
import { ChatMessage } from "./ChatMessage";
import { ChatInputArea } from "./ChatInputArea";
import { ConversationSidebar } from "./ConversationSidebar";
import { cn } from "@/lib/utils";

const suggestedQuestions = [
  "What are the requirements for internship?",
  "How much is the organizational shirt?",
  "What is the schedule of CBA Main Event?",
  "How do I apply for leave of absence?",
  "Where can I get my school ID?",
];

const config = {
  minTypingDelay: 500,
  maxTypingDelay: 1500,
  minConfidenceThreshold: 0.5,
  maxMessageLength: 1000,
  maxImageSizeMB: 5,
};

export function ChatPage() {
  const { user, profile } = useAuth();
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [showSidebar, setShowSidebar] = useState(!isMobile);
  const [isTyping, setIsTyping] = useState(false);
  const [mascotMood, setMascotMood] = useState<"happy" | "thinking" | "waving" | "idle">("waving");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Handle responsive sidebar
  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      if (mobile) {
        setShowSidebar(false);
      } else {
        setShowSidebar(true);
      }
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Fetch conversations and messages
  const {
    conversations,
    setConversations,
    currentConversation,
    setCurrentConversation,
    messages,
    setMessages,
    isLoadingConversations,
    fetchMessages,
    createNewConversation,
    requestAdminSupport,
  } = useMessages(user?.id);

  // AI responses
  const {
    faqs,
    failedMatchCount,
    fetchFAQs,
    getSmartResponse,
    getFallbackResponse,
    findBestMatch,
  } = useSmartResponses();

  // Message validation
  const {
    validateMessage,
    recordMessageTime,
  } = useMessageValidation();

  // Typing indicator
  const { isOtherTyping, startTyping, stopTyping } = useTypingIndicator(
    currentConversation?.id,
    user?.id
  );

  // Auto-scroll to latest message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Fetch FAQs on mount
  useEffect(() => {
    fetchFAQs();
  }, [fetchFAQs]);

  // Handle sending message
  const handleSendMessage = async (content: string, imageFile?: File) => {
    if (!currentConversation || !user) {
      const newConv = await createNewConversation();
      if (newConv) {
        setCurrentConversation(newConv);
        await handleSendMessage(content, imageFile);
      }
      return;
    }

    if (!validateMessage(content)) {
      toast.error("Message must be between 1 and " + config.maxMessageLength + " characters");
      return;
    }

    try {
      setIsTyping(true);
      setMascotMood("thinking");

      // Upload image if provided
      let imageUrl = null;
      if (imageFile) {
        const fileExt = imageFile.name.split(".").pop();
        const fileName = `${user.id}/${currentConversation.id}/${Date.now()}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from("chat-images")
          .upload(fileName, imageFile);

        if (uploadError) throw uploadError;

        const { data: publicUrl } = supabase.storage
          .from("chat-images")
          .getPublicUrl(fileName);

        imageUrl = publicUrl.publicUrl;
      }

      // Save user message
      const { data: userMsg, error: userMsgError } = await supabase
        .from("messages")
        .insert({
          conversation_id: currentConversation.id,
          content,
          sender_type: "user",
          image_url: imageUrl,
        })
        .select()
        .single();

      if (userMsgError) throw userMsgError;

      setMessages((prev) => [...prev, userMsg]);
      recordMessageTime();

      // Check if conversation requires admin
      if (currentConversation.requires_admin || currentConversation.assigned_admin_id) {
        setIsTyping(false);
        setMascotMood("idle");

        await supabase
          .from("conversations")
          .update({ updated_at: new Date().toISOString() })
          .eq("id", currentConversation.id);

        return;
      }

      // Generate bot response
      const delay = config.minTypingDelay + Math.random() * (config.maxTypingDelay - config.minTypingDelay);
      await new Promise((resolve) => setTimeout(resolve, delay));

      let botResponse: string;
      let matchedFaqId: string | null = null;

      const smartResponse = getSmartResponse(content);

      if (smartResponse) {
        botResponse = smartResponse.response;
        setMascotMood("happy");
      } else {
        const { faq, confidence } = findBestMatch(content);

        if (faq && confidence >= config.minConfidenceThreshold) {
          botResponse = faq.answer;
          matchedFaqId = faq.id;
          setMascotMood("happy");
        } else {
          botResponse = getFallbackResponse();
          setMascotMood("idle");
        }
      }

      // Save bot message
      const { data: botMsg, error: botMsgError } = await supabase
        .from("messages")
        .insert({
          conversation_id: currentConversation.id,
          content: botResponse,
          sender_type: "bot",
          matched_faq_id: matchedFaqId,
        })
        .select()
        .single();

      if (botMsgError) throw botMsgError;

      setMessages((prev) => [...prev, botMsg]);

      // Update conversation title
      if (messages.length < 2) {
        const title = content.length > 30 ? content.substring(0, 30) + "..." : content;
        await supabase
          .from("conversations")
          .update({ title, updated_at: new Date().toISOString() })
          .eq("id", currentConversation.id);

        setConversations((prev) =>
          prev.map((c) => (c.id === currentConversation.id ? { ...c, title } : c))
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

  // Request human agent
  const handleRequestAgent = async () => {
    if (!currentConversation) {
      toast.error("Please start a conversation first");
      return;
    }

    if (currentConversation.requires_admin) {
      toast.info("You've already requested a human agent");
      return;
    }

    try {
      setIsTyping(true);
      setMascotMood("thinking");

      // Add initial bot message about the request
      const { data: notificationMsg, error: notificationError } = await supabase
        .from("messages")
        .insert({
          conversation_id: currentConversation.id,
          content: `You're requesting to speak with a human support agent. Our team will assist you shortly. Below is a summary of your conversation so far.`,
          sender_type: "bot",
        })
        .select()
        .single();

      if (notificationError) throw notificationError;

      setMessages((prev) => [...prev, notificationMsg]);

      // Small delay for effect
      await new Promise((resolve) => setTimeout(resolve, 800));

      // Add waiting message
      const { data: waitingMsg, error: waitingError } = await supabase
        .from("messages")
        .insert({
          conversation_id: currentConversation.id,
          content: `⏳ Please wait while we connect you with an available support member. Thank you for your patience!`,
          sender_type: "bot",
        })
        .select()
        .single();

      if (waitingError) throw waitingError;

      setMessages((prev) => [...prev, waitingMsg]);

      // Request admin support in background
      await requestAdminSupport(currentConversation.id);
      
      toast.success("Human support requested! Please wait for a response.");
    } catch (error) {
      console.error("Error requesting agent:", error);
      toast.error("Failed to request human support");
    } finally {
      setIsTyping(false);
      setMascotMood("idle");
    }
  };

  // Handle new conversation
  const handleNewChat = async () => {
    const newConv = await createNewConversation();
    if (newConv) {
      setCurrentConversation(newConv);
      setMessages([]);
    }
  };

  // Handle reaction to message
  const handleReactionAdd = async (messageId: string, reaction: string) => {
    if (!user) return;

    try {
      if (reaction === "") {
        // Remove reaction
        await supabase
          .from("message_reactions")
          .delete()
          .eq("message_id", messageId)
          .eq("user_id", user.id);
        
        // Also log the action
        await supabase.from("activity_logs").insert({
          user_id: user.id,
          action: "reaction_removed",
          entity_type: "message",
          entity_id: messageId,
        });
      } else {
        // Upsert reaction (insert or update if exists)
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
        
        // Also log the action
        await supabase.from("activity_logs").insert({
          user_id: user.id,
          action: "reaction_added",
          entity_type: "message",
          entity_id: messageId,
          details: { reaction },
        });

        toast.success(`Reaction ${reaction} added!`);
      }
    } catch (error) {
      console.error("Error recording reaction:", error);
      toast.error("Failed to save reaction");
    }
  };

  // Handle select conversation
  const handleSelectConversation = async (conversation: any) => {
    setCurrentConversation(conversation);
    await fetchMessages(conversation.id);
    if (isMobile) {
      setShowSidebar(false);
    }
  };

  return (
    <div className="flex h-full w-full relative bg-gradient-to-b from-background via-background to-accent/5">
      {/* Mobile Sidebar Overlay */}
      {isMobile && showSidebar && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-20 md:hidden"
          onClick={() => setShowSidebar(false)}
        />
      )}

      {/* Sidebar - Conversations */}
      <div
        className={cn(
          "fixed inset-y-0 left-0 w-56 sm:w-64 bg-card/80 backdrop-blur-sm border-r border-border/50 transition-transform duration-300 z-30 md:relative md:z-0 md:translate-x-0 overflow-hidden md:w-72 lg:w-80",
          isMobile && !showSidebar ? "-translate-x-full" : "translate-x-0"
        )}
      >
        <ConversationSidebar
          conversations={conversations}
          currentConversation={currentConversation}
          onSelectConversation={handleSelectConversation}
          onNewConversation={handleNewChat}
          isLoading={isLoadingConversations}
          onClose={() => setShowSidebar(false)}
        />
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Chat Header */}
        <div className="flex items-center justify-between h-14 sm:h-16 px-2 sm:px-4 border-b border-border/30 bg-card/50 backdrop-blur-sm">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden h-8 w-8"
              onClick={() => setShowSidebar(!showSidebar)}
            >
              <Menu className="h-4 w-4 sm:h-5 sm:w-5" />
            </Button>

            <div className="min-w-0 flex-1">
              <h2 className="text-xs sm:text-sm font-semibold truncate">
                {currentConversation?.title || "Start a new conversation"}
              </h2>
              <div className="flex items-center gap-1.5 mt-0.5">
                {currentConversation?.assigned_admin_id ? (
                  <>
                    <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
                    <p className="text-[9px] sm:text-xs text-green-600 dark:text-green-400 font-medium">
                      Support connected
                    </p>
                  </>
                ) : currentConversation?.requires_admin ? (
                  <>
                    <div className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
                    <p className="text-[9px] sm:text-xs text-blue-600 dark:text-blue-400 font-medium">
                      Waiting for support
                    </p>
                  </>
                ) : (
                  <>
                    <div className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                    <p className="text-[9px] sm:text-xs text-amber-600 dark:text-amber-400">
                      Bot assistance
                    </p>
                  </>
                )}
              </div>
            </div>
          </div>

          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 sm:h-10 sm:w-10"
            onClick={handleNewChat}
            title="Start new chat"
          >
            <Plus className="h-4 w-4 sm:h-5 sm:w-5" />
          </Button>
        </div>

        {/* Messages Area */}
        <ScrollArea className="flex-1 overflow-hidden">
          <div className="flex flex-col h-full px-2 sm:px-4 py-2 sm:py-4 space-y-2 sm:space-y-4">
            {messages.length === 0 && !isLoadingConversations && (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center space-y-3 sm:space-y-4 max-w-sm px-2">
                  <div className="flex justify-center">
                    <PasoaMascot size="lg" mood="waving" />
                  </div>
                  <div>
                    <h3 className="text-base sm:text-lg font-bold mb-1 sm:mb-2">Welcome to PASOA Hub!</h3>
                    <p className="text-xs sm:text-sm text-muted-foreground mb-3 sm:mb-4">
                      I'm here to help with all your questions about CBA and campus life. What would you like to know?
                    </p>
                  </div>

                  {/* Suggested Questions */}
                  <div className="space-y-1.5 sm:space-y-2 mt-4 sm:mt-6">
                    {suggestedQuestions.map((question, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleSendMessage(question)}
                        className="w-full text-left px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-lg border border-border/50 text-xs sm:text-sm hover:bg-primary/10 hover:border-primary/50 transition-colors"
                      >
                        {question}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {messages.map((message) => {
              let senderName = "You";
              let senderAvatar: string | null | undefined = undefined;
              
              if (message.sender_type === "bot") {
                senderName = "PASOA Bot";
              } else if (message.sender_type === "admin") {
                if (message.sender_profile) {
                  senderName = `Admin - ${message.sender_profile.last_name}`;
                  senderAvatar = message.sender_profile.avatar_url;
                } else {
                  senderName = "Support Team";
                }
              } else if (message.sender_type === "user") {
                senderAvatar = profile?.avatar_url;
                senderName = profile?.first_name + " " + profile?.last_name;
              }
              
              return (
                <ChatMessage
                  key={message.id}
                  message={message}
                  isOwn={message.sender_type === "user"}
                  senderName={senderName}
                  userAvatar={senderAvatar}
                  onReactionAdd={handleReactionAdd}
                  isBot={message.sender_type === "bot"}
                />
              );
            })}

            {isTyping && (
              <div className="flex gap-1.5 sm:gap-2 items-end">
                <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                  <Bot className="w-3 h-3 sm:w-4 sm:h-4 text-primary" />
                </div>
                <div className="space-y-0.5 sm:space-y-1">
                  <div className="flex gap-1">
                    <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-primary rounded-full animate-bounce" />
                    <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-primary rounded-full animate-bounce delay-100" />
                    <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-primary rounded-full animate-bounce delay-200" />
                  </div>
                  <p className="text-[10px] sm:text-xs text-muted-foreground">PASOA Bot is typing...</p>
                </div>
              </div>
            )}

            {isOtherTyping && !isTyping && (
              <div className="flex gap-1.5 sm:gap-2 items-end">
                <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-green-500/20 flex items-center justify-center flex-shrink-0">
                  <span className="text-[10px] sm:text-xs font-bold text-green-600">👤</span>
                </div>
                <div className="space-y-0.5 sm:space-y-1">
                  <div className="flex gap-1">
                    <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-green-500 rounded-full animate-bounce" />
                    <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-green-500 rounded-full animate-bounce delay-100" />
                    <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-green-500 rounded-full animate-bounce delay-200" />
                  </div>
                  <p className="text-[10px] sm:text-xs text-muted-foreground">Admin is typing...</p>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>

        {/* Closed Conversation */}
        {currentConversation?.status === "closed" && (
          <div className="border-t border-border/30 bg-yellow-500/10 p-2 sm:p-4">
            <div className="flex items-start gap-2 sm:gap-3">
              <AlertTriangle className="h-4 w-4 sm:h-5 sm:w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <p className="font-medium text-xs sm:text-sm text-yellow-700">This chat is closed</p>
                <p className="text-[10px] sm:text-xs text-yellow-600 mt-0.5 sm:mt-1">
                  The admin has closed this conversation. You can start a new chat to continue.
                </p>
                <div className="flex gap-1.5 sm:gap-2 mt-2 sm:mt-3">
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-7 sm:h-8 text-[10px] sm:text-xs"
                    onClick={handleNewChat}
                  >
                    New Chat
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Chat Input Area */}
        {currentConversation?.status !== "closed" && (
          <ChatInputArea
            onSendMessage={handleSendMessage}
            onRequestAgent={handleRequestAgent}
            isWaitingForAgent={currentConversation?.requires_admin}
            isAdminConnected={!!currentConversation?.assigned_admin_id}
            maxMessageLength={config.maxMessageLength}
            disabled={isTyping}
          />
        )}
      </div>
    </div>
  );
}
