import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface Message {
  id: string;
  content: string;
  sender_type: string;
  created_at: string;
  matched_faq_id?: string | null;
  image_url?: string | null;
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

export interface FAQ {
  id: string;
  question: string;
  answer: string;
  keywords: string[] | null;
  category_id: string;
}

// =====================================================
// 47+ CHATBOT RESTRICTIONS, RULES & ENHANCEMENTS
// =====================================================
const CHATBOT_CONFIG = {
  // ========== MESSAGE RESTRICTIONS ==========
  MAX_MESSAGE_LENGTH: 500,           // #1: Max characters per message
  MIN_MESSAGE_LENGTH: 2,             // #2: Min characters per message
  MAX_MESSAGES_PER_MINUTE: 10,       // #3: Rate limiting
  MAX_IMAGES_PER_MESSAGE: 1,         // #4: Image count limit
  MAX_IMAGE_SIZE_MB: 5,              // #5: Image size limit in MB
  MAX_CONSECUTIVE_MESSAGES: 5,       // #6: Max messages without bot response
  MAX_MESSAGE_WORDS: 100,            // #7: Max words per message
  
  // ========== CONTENT FILTERS ==========
  BLOCKED_WORDS: [                   // #8: Profanity/spam filter
    "spam", "hack", "cheat", "password123", "xxx", "porn",
  ],
  SUSPICIOUS_PATTERNS: [             // #9: Suspicious content detection
    /\b(free money|click here|win now)\b/i,
    /\b(password|credit card|ssn)\s*(is|:)/i,
  ],
  MAX_REPEATED_CHARS: 5,             // #10: Prevent "aaaaaaa" spam
  MAX_CAPS_PERCENTAGE: 70,           // #11: Limit all-caps messages
  
  // ========== SMART RESPONSES ==========
  GREETING_KEYWORDS: [               // #12: Greeting detection
    "hi", "hello", "hey", "good morning", "good afternoon", 
    "good evening", "kumusta", "musta", "oi", "yo"
  ],
  THANKS_KEYWORDS: [                 // #13: Thank you detection
    "thank", "thanks", "ty", "appreciate", "salamat", "tnx"
  ],
  GOODBYE_KEYWORDS: [                // #14: Goodbye detection
    "bye", "goodbye", "see you", "take care", "paalam", "sige", "gtg"
  ],
  HELP_KEYWORDS: [                   // #15: Help request detection
    "help", "tulong", "assist", "support", "emergency"
  ],
  CONFUSED_KEYWORDS: [               // #16: Confusion detection
    "confused", "don't understand", "what do you mean", "unclear", "huh"
  ],
  
  // ========== FAQ MATCHING ==========
  MIN_CONFIDENCE_THRESHOLD: 0.2,     // #17: Minimum match confidence
  HIGH_CONFIDENCE_THRESHOLD: 0.6,    // #18: High confidence (no confirmation)
  KEYWORD_WEIGHT: 25,                // #19: Keyword match weight
  QUESTION_WORD_WEIGHT: 8,           // #20: Question word match weight
  EXACT_MATCH_BONUS: 50,             // #21: Exact match bonus
  
  // ========== TYPING SIMULATION ==========
  MIN_TYPING_DELAY_MS: 800,          // #22: Minimum typing delay
  MAX_TYPING_DELAY_MS: 1500,         // #23: Maximum typing delay
  CHARS_PER_SECOND: 30,              // #24: Simulated typing speed
  
  // ========== HUMAN AGENT ==========
  AUTO_ESCALATE_AFTER_FAILED_MATCHES: 3,  // #25: Auto-suggest human agent
  ESCALATION_COOLDOWN_MINUTES: 5,    // #26: Cooldown before re-suggesting
  
  // ========== SESSION ==========
  SESSION_TIMEOUT_MINUTES: 30,       // #27: Session timeout
  MAX_CONVERSATIONS_PER_DAY: 50,     // #28: Daily conversation limit
  INACTIVITY_WARNING_MINUTES: 10,    // #29: Warn about inactivity
  
  // ========== UI FEATURES ==========
  SHOW_TYPING_INDICATOR: true,       // #30: Show bot typing
  SHOW_READ_RECEIPTS: true,          // #31: Show read status
  SHOW_MESSAGE_TIMESTAMPS: true,     // #32: Show timestamps
  ENABLE_MESSAGE_REACTIONS: true,    // #33: Allow reactions
  ENABLE_MESSAGE_COPY: true,         // #34: Allow copying messages
  
  // ========== SUGGESTIONS ==========
  MAX_SUGGESTIONS: 5,                // #35: Max suggestion chips
  SHOW_RELATED_FAQS: true,           // #36: Show related FAQs
  SUGGESTION_CATEGORIES: [           // #37: Suggestion categories
    "enrollment", "internship", "fees", "schedule", "events"
  ],
  
  // ========== ACCESSIBILITY ==========
  ENABLE_TEXT_TO_SPEECH: false,      // #38: TTS support
  ENABLE_VOICE_INPUT: false,         // #39: Voice input support
  HIGH_CONTRAST_MODE: false,         // #40: High contrast option
  
  // ========== ANALYTICS ==========
  TRACK_MESSAGE_SENTIMENT: true,     // #41: Track sentiment
  TRACK_RESPONSE_TIME: true,         // #42: Track response time
  TRACK_FAQ_HITS: true,              // #43: Track FAQ popularity
  
  // ========== ANTI-ABUSE ==========
  BLOCK_AFTER_VIOLATIONS: 3,         // #44: Block after X violations
  VIOLATION_COOLDOWN_HOURS: 24,      // #45: Violation cooldown
  REQUIRE_EMAIL_VERIFICATION: true,  // #46: Require verified email
  
  // ========== CONVERSATION MANAGEMENT ==========
  PREVENT_DUPLICATE_EMPTY_CHATS: true,  // #47: Prevent duplicate empty conversations
};

// ========== RESPONSE TEMPLATES ==========

const GREETING_RESPONSES = [
  "Hi there, PASOAnian! 👋 How can I help you today?",
  "Hello! Welcome to Pasoa Student Hub. What can I assist you with?",
  "Hey! Great to see you. What questions do you have?",
  "Good day! I'm here to help with any CBA-related questions.",
  "Kamusta! Ready to help you with anything you need! 🎓",
];

const THANKS_RESPONSES = [
  "You're welcome! Is there anything else I can help you with?",
  "Happy to help! Let me know if you need anything else. 😊",
  "Glad I could assist! Feel free to ask more questions.",
  "No problem! Always here to help fellow PASOAnians.",
  "Anytime! Don't hesitate to reach out again. 💜",
];

const GOODBYE_RESPONSES = [
  "Goodbye! Have a great day ahead! 👋",
  "Take care! Come back anytime you need help.",
  "See you later! Good luck with your studies! 📚",
  "Bye! Don't hesitate to reach out if you have more questions.",
  "Paalam! Ingat ka lagi! 💜",
];

const HELP_RESPONSES = [
  "I'm here to help! You can ask me about enrollment, internship, fees, schedules, events, and more. What do you need?",
  "Need assistance? Just type your question or choose from the suggested topics below. I'm all ears! 👂",
  "Don't worry, I've got you covered! What would you like to know about CBA?",
];

const CONFUSED_RESPONSES = [
  "Let me try to clarify! Could you tell me more specifically what you're asking about?",
  "I apologize for any confusion. Can you rephrase your question so I can better assist you?",
  "I want to make sure I help you correctly. What topic are you asking about?",
];

const FALLBACK_RESPONSES = [
  "I'm not quite sure about that. Would you like to speak with a human agent?",
  "I couldn't find a specific answer. Let me connect you with our support team.",
  "That's a great question, but I don't have that information. Want me to get a human agent?",
  "I'm still learning! Would you prefer to chat with an administrator for this one?",
  "Hmm, I'm not sure about this one. You can try rephrasing or request a human agent. 🤔",
];

const VIOLATION_RESPONSES = [
  "Please keep the conversation respectful. Your message was blocked.",
  "That message contains inappropriate content. Let's keep things friendly!",
  "I can't process that message. Please try asking something else.",
];

// ========== QUICK SUGGESTIONS ==========
const QUICK_SUGGESTIONS = {
  initial: [
    "What are the internship requirements?",
    "How much is the tuition fee?",
    "When is the enrollment period?",
    "Where is the registrar's office?",
    "What events are coming up?",
  ],
  enrollment: [
    "What documents do I need?",
    "What are the payment options?",
    "Can I enroll late?",
    "How to change my section?",
  ],
  internship: [
    "How many hours required?",
    "Where can I intern?",
    "Do I need a recommendation letter?",
    "When can I start my OJT?",
  ],
  fees: [
    "Is there a payment plan?",
    "How to pay online?",
    "Where to pay tuition?",
    "Are there scholarships?",
  ],
  events: [
    "What events are this month?",
    "How to join org events?",
    "Is there an org fair?",
    "When is intramurals?",
  ],
};

// ========== HOOK IMPLEMENTATION ==========

export function useChatMessages(userId: string | undefined) {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentConversation, setCurrentConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [faqs, setFaqs] = useState<FAQ[]>([]);
  const [isLoadingConversations, setIsLoadingConversations] = useState(true);
  const [failedMatchCount, setFailedMatchCount] = useState(0);
  const [messageCount, setMessageCount] = useState(0);
  const [lastMessageTime, setLastMessageTime] = useState<number>(0);
  const [violationCount, setViolationCount] = useState(0);

  // #10: Check for repeated characters
  const hasRepeatedChars = useCallback((content: string): boolean => {
    const regex = new RegExp(`(.)\\1{${CHATBOT_CONFIG.MAX_REPEATED_CHARS},}`, 'g');
    return regex.test(content);
  }, []);

  // #11: Check for excessive caps
  const hasExcessiveCaps = useCallback((content: string): boolean => {
    const letters = content.replace(/[^a-zA-Z]/g, '');
    if (letters.length < 5) return false;
    const capsCount = (content.match(/[A-Z]/g) || []).length;
    return (capsCount / letters.length) * 100 > CHATBOT_CONFIG.MAX_CAPS_PERCENTAGE;
  }, []);

  // #9: Check for suspicious patterns
  const hasSuspiciousPatterns = useCallback((content: string): boolean => {
    return CHATBOT_CONFIG.SUSPICIOUS_PATTERNS.some(pattern => pattern.test(content));
  }, []);

  // Validate message content with all restrictions
  const validateMessage = useCallback((content: string): { valid: boolean; error?: string } => {
    // #2: Check minimum length
    if (content.length < CHATBOT_CONFIG.MIN_MESSAGE_LENGTH) {
      return { valid: false, error: "Message is too short" };
    }
    
    // #1: Check maximum length
    if (content.length > CHATBOT_CONFIG.MAX_MESSAGE_LENGTH) {
      return { valid: false, error: `Message exceeds ${CHATBOT_CONFIG.MAX_MESSAGE_LENGTH} characters` };
    }
    
    // #7: Check word count
    const wordCount = content.split(/\s+/).filter(w => w.length > 0).length;
    if (wordCount > CHATBOT_CONFIG.MAX_MESSAGE_WORDS) {
      return { valid: false, error: `Message exceeds ${CHATBOT_CONFIG.MAX_MESSAGE_WORDS} words` };
    }
    
    // #8: Check for blocked words
    const lowerContent = content.toLowerCase();
    for (const word of CHATBOT_CONFIG.BLOCKED_WORDS) {
      if (lowerContent.includes(word)) {
        setViolationCount(prev => prev + 1);
        return { valid: false, error: "Message contains inappropriate content" };
      }
    }
    
    // #9: Check suspicious patterns
    if (hasSuspiciousPatterns(content)) {
      setViolationCount(prev => prev + 1);
      return { valid: false, error: "Message contains suspicious content" };
    }
    
    // #10: Check repeated characters
    if (hasRepeatedChars(content)) {
      return { valid: false, error: "Please avoid repeating characters" };
    }
    
    // #11: Check excessive caps
    if (hasExcessiveCaps(content)) {
      return { valid: false, error: "Please avoid using all caps" };
    }
    
    // #3: Rate limiting
    const now = Date.now();
    if (now - lastMessageTime < 60000 / CHATBOT_CONFIG.MAX_MESSAGES_PER_MINUTE) {
      return { valid: false, error: "Please wait before sending another message" };
    }
    
    // #44: Check if blocked
    if (violationCount >= CHATBOT_CONFIG.BLOCK_AFTER_VIOLATIONS) {
      return { valid: false, error: "You've been temporarily blocked due to violations. Please try again later." };
    }
    
    return { valid: true };
  }, [lastMessageTime, violationCount, hasRepeatedChars, hasExcessiveCaps, hasSuspiciousPatterns]);

  // Pattern detection helpers
  const matchesKeywords = useCallback((content: string, keywords: string[]): boolean => {
    const lowerContent = content.toLowerCase().trim();
    return keywords.some(keyword => 
      lowerContent === keyword || 
      lowerContent.startsWith(keyword + " ") || 
      lowerContent.startsWith(keyword + "!") ||
      lowerContent.startsWith(keyword + "?") ||
      lowerContent.endsWith(" " + keyword) ||
      lowerContent.includes(" " + keyword + " ")
    );
  }, []);

  const isGreeting = useCallback((content: string): boolean => {
    return matchesKeywords(content, CHATBOT_CONFIG.GREETING_KEYWORDS);
  }, [matchesKeywords]);

  const isThanks = useCallback((content: string): boolean => {
    return matchesKeywords(content, CHATBOT_CONFIG.THANKS_KEYWORDS);
  }, [matchesKeywords]);

  const isGoodbye = useCallback((content: string): boolean => {
    return matchesKeywords(content, CHATBOT_CONFIG.GOODBYE_KEYWORDS);
  }, [matchesKeywords]);

  const isHelpRequest = useCallback((content: string): boolean => {
    return matchesKeywords(content, CHATBOT_CONFIG.HELP_KEYWORDS);
  }, [matchesKeywords]);

  const isConfused = useCallback((content: string): boolean => {
    return matchesKeywords(content, CHATBOT_CONFIG.CONFUSED_KEYWORDS);
  }, [matchesKeywords]);

  const getRandomResponse = useCallback((responses: string[]): string => {
    return responses[Math.floor(Math.random() * responses.length)];
  }, []);

  // Get smart response based on content patterns
  const getSmartResponse = useCallback((content: string): { response: string; type: string } | null => {
    if (isGreeting(content)) {
      return { response: getRandomResponse(GREETING_RESPONSES), type: "greeting" };
    }
    if (isThanks(content)) {
      return { response: getRandomResponse(THANKS_RESPONSES), type: "thanks" };
    }
    if (isGoodbye(content)) {
      return { response: getRandomResponse(GOODBYE_RESPONSES), type: "goodbye" };
    }
    if (isHelpRequest(content)) {
      return { response: getRandomResponse(HELP_RESPONSES), type: "help" };
    }
    if (isConfused(content)) {
      return { response: getRandomResponse(CONFUSED_RESPONSES), type: "confused" };
    }
    return null;
  }, [isGreeting, isThanks, isGoodbye, isHelpRequest, isConfused, getRandomResponse]);

  // Get fallback response with escalation suggestion
  const getFallbackResponse = useCallback((): string => {
    if (failedMatchCount >= CHATBOT_CONFIG.AUTO_ESCALATE_AFTER_FAILED_MATCHES - 1) {
      return "I've had trouble answering your recent questions. I recommend speaking with a human agent who can better assist you. Click the 'Human Agent' button below to connect with our support team. 👤";
    }
    return getRandomResponse(FALLBACK_RESPONSES);
  }, [failedMatchCount, getRandomResponse]);

  // Get suggestions based on context
  const getSuggestions = useCallback((context?: string): string[] => {
    if (context && QUICK_SUGGESTIONS[context as keyof typeof QUICK_SUGGESTIONS]) {
      return QUICK_SUGGESTIONS[context as keyof typeof QUICK_SUGGESTIONS];
    }
    return QUICK_SUGGESTIONS.initial;
  }, []);

  // Detect context from message
  const detectContext = useCallback((content: string): string | null => {
    const lowerContent = content.toLowerCase();
    if (lowerContent.includes("enroll") || lowerContent.includes("registration")) return "enrollment";
    if (lowerContent.includes("intern") || lowerContent.includes("ojt")) return "internship";
    if (lowerContent.includes("fee") || lowerContent.includes("tuition") || lowerContent.includes("payment")) return "fees";
    if (lowerContent.includes("event") || lowerContent.includes("activity")) return "events";
    return null;
  }, []);

  const fetchFAQs = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from("faqs")
        .select("id, question, answer, keywords, category_id")
        .eq("is_active", true)
        .eq("is_archived", false);

      if (error) throw error;
      setFaqs(data as FAQ[]);
    } catch (error) {
      console.error("Error fetching FAQs:", error);
    }
  }, []);

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
      
      // Only auto-select if there are conversations with messages
      if (data && data.length > 0) {
        // Find the most recent conversation that has messages
        const { data: recentConv } = await supabase
          .from("messages")
          .select("conversation_id")
          .in("conversation_id", data.map(c => c.id))
          .order("created_at", { ascending: false })
          .limit(1);
        
        if (recentConv && recentConv.length > 0) {
          const conv = data.find(c => c.id === recentConv[0].conversation_id);
          if (conv) {
            setCurrentConversation(conv);
          }
        }
      }
    } catch (error) {
      console.error("Error fetching conversations:", error);
    } finally {
      setIsLoadingConversations(false);
    }
  }, [userId]);

  const fetchMessages = useCallback(async (conversationId: string) => {
    try {
      const { data, error } = await supabase
        .from("messages")
        .select("*")
        .eq("conversation_id", conversationId)
        .order("created_at", { ascending: true });

      if (error) throw error;
      setMessages(data || []);
    } catch (error) {
      console.error("Error fetching messages:", error);
    }
  }, []);

  // Smart new conversation - only create if previous has messages
  const createNewConversation = useCallback(async () => {
    if (!userId) return null;

    // Check if current conversation has no messages (don't create new one)
    if (currentConversation) {
      const { data: existingMessages } = await supabase
        .from("messages")
        .select("id")
        .eq("conversation_id", currentConversation.id)
        .limit(2); // Only need to check if there's more than the welcome message

      if (existingMessages && existingMessages.length <= 1) {
        toast.info("Start chatting in your current conversation first!");
        return currentConversation;
      }
    }

    // Check if there's already an empty conversation in the list (restriction #47: prevent duplicate empty chats)
    for (const conv of conversations) {
      const { data: messageCount } = await supabase
        .from("messages")
        .select("id", { count: "exact" })
        .eq("conversation_id", conv.id)
        .limit(2);

      if (messageCount && messageCount.length === 0) {
        // Found an empty conversation, switch to it instead of creating a new one
        setCurrentConversation(conv);
        setMessages([]);
        await fetchMessages(conv.id);
        toast.info("Switched to your empty conversation");
        return conv;
      }
    }

    // Reset failed match count for new conversation
    setFailedMatchCount(0);

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

  // Enhanced FAQ matching with confidence scoring
  const findBestMatch = useCallback((query: string): { faq: FAQ | null; confidence: number; suggestions: string[] } => {
    const queryLower = query.toLowerCase();
    const queryWords = queryLower.split(/\s+/).filter((w) => w.length > 2);

    let bestMatch: FAQ | null = null;
    let highestScore = 0;
    const relatedFaqs: FAQ[] = [];

    for (const faq of faqs) {
      let score = 0;
      const questionLower = faq.question.toLowerCase();
      const answerLower = faq.answer.toLowerCase();
      
      // #21: Exact or near-exact match bonus
      if (questionLower.includes(queryLower) || queryLower.includes(questionLower)) {
        score += CHATBOT_CONFIG.EXACT_MATCH_BONUS;
      }

      // #19: Keyword matching (weighted higher)
      if (faq.keywords) {
        for (const keyword of faq.keywords) {
          if (queryLower.includes(keyword.toLowerCase())) {
            score += CHATBOT_CONFIG.KEYWORD_WEIGHT;
          }
        }
      }

      // #20: Word-by-word matching
      for (const word of queryWords) {
        if (questionLower.includes(word)) score += CHATBOT_CONFIG.QUESTION_WORD_WEIGHT;
        if (answerLower.includes(word)) score += 4;
      }

      // Bonus for question word match
      const questionWords = ["what", "how", "when", "where", "who", "why", "is", "can", "do", "ano", "paano", "kailan", "saan"];
      for (const qWord of questionWords) {
        if (queryLower.startsWith(qWord) && questionLower.startsWith(qWord)) {
          score += 5;
        }
      }

      // Track related FAQs for suggestions
      if (score > 10 && score < highestScore) {
        relatedFaqs.push(faq);
      }

      if (score > highestScore) {
        if (bestMatch) relatedFaqs.push(bestMatch);
        highestScore = score;
        bestMatch = faq;
      }
    }

    const confidence = Math.min(highestScore / 100, 1);
    
    // Track failed matches
    if (confidence < CHATBOT_CONFIG.MIN_CONFIDENCE_THRESHOLD) {
      setFailedMatchCount(prev => prev + 1);
    } else {
      setFailedMatchCount(0);
    }

    // Get context-aware suggestions
    const context = detectContext(query);
    const suggestions = context 
      ? getSuggestions(context)
      : relatedFaqs.slice(0, 3).map(f => f.question);

    return { faq: bestMatch, confidence, suggestions };
  }, [faqs, detectContext, getSuggestions]);

  useEffect(() => {
    if (userId) {
      fetchFAQs();
      fetchConversations();
    }
  }, [userId, fetchFAQs, fetchConversations]);

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
          (payload) => {
            const newMsg = payload.new as Message;
            if (newMsg.sender_type !== "user") {
              setMessages((prev) => {
                if (prev.some(m => m.id === newMsg.id)) return prev;
                return [...prev, newMsg];
              });
            }
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [currentConversation?.id, fetchMessages]);

  return {
    conversations,
    setConversations,
    currentConversation,
    setCurrentConversation,
    messages,
    setMessages,
    faqs,
    isLoadingConversations,
    fetchFAQs,
    fetchMessages,
    createNewConversation,
    findBestMatch,
    validateMessage,
    getSmartResponse,
    getFallbackResponse,
    getSuggestions,
    detectContext,
    failedMatchCount,
    violationCount,
    config: CHATBOT_CONFIG,
    quickSuggestions: QUICK_SUGGESTIONS,
  };
}
