import { useCallback, useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  matchesKeywordSmart,
  calculateKeywordScore,
  normalizeText,
  extractEntities,
  extractQuestionSegments,
  fuzzyMatch,
  calculateFAQSimilarity,
} from "@/features/chat/lib/textProcessing";

export interface FAQ {
  id: string;
  question: string;
  answer: string;
  keywords: string[] | null;
  category_id: string;
  match_count?: number | null;
}

/**
 * Response templates for common patterns
 */
const RESPONSE_TEMPLATES = {
  GREETING: [
    "Hi there, PASOAnian! How can I help you today?",
    "Hello! Welcome to PASOA Student Hub. What can I assist you with?",
    "Hey! Great to see you. What questions do you have?",
    "Good day! I'm here to help with any CBA-related questions.",
    "Kamusta! Ready to help you with anything you need!",
  ],
  THANKS: [
    "You're welcome! Is there anything else I can help you with?",
    "Happy to help! Let me know if you need anything else.",
    "Glad I could assist! Feel free to ask more questions.",
    "No problem! Always here to help fellow PASOAnians.",
    "Anytime! Don't hesitate to reach out again.",
  ],
  GOODBYE: [
    "Goodbye! Have a great day ahead!",
    "Take care! Come back anytime you need help.",
    "See you later! Good luck with your studies!",
    "Bye! Don't hesitate to reach out if you have more questions.",
    "Paalam! Ingat ka lagi!",
  ],
  HELP: [
    "I'm here to help! You can ask me about enrollment, internship, fees, schedules, events, and more. What do you need?",
    "Need assistance? Just type your question or choose from the suggested topics below. I'm all ears!",
    "Don't worry, I've got you covered! What would you like to know about CBA?",
  ],
  CONFUSED: [
    "Let me try to clarify! Could you tell me more specifically what you're asking about?",
    "I apologize for any confusion. Can you rephrase your question so I can better assist you?",
    "I want to make sure I help you correctly. What topic are you asking about?",
  ],
  FALLBACK: [
    "I'm not quite sure about that. Would you like to speak with a human agent?",
    "I couldn't find a specific answer. Let me connect you with our support team.",
    "That's a great question, but I don't have that information. Want me to get a human agent?",
    "I'm still learning! Would you prefer to chat with an administrator for this one?",
    "Hmm, I'm not sure about this one. You can try rephrasing or request a human agent.",
  ],
  VIOLATION: [
    "Please keep the conversation respectful. Your message was blocked.",
    "That message contains inappropriate content. Let's keep things friendly!",
    "I can't process that message. Please try asking something else.",
  ],
};

/**
 * Quick suggestions grouped by context
 */
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

/**
 * Keywords for pattern detection
 */
const PATTERN_KEYWORDS = {
  GREETING: [
    "hi",
    "hello",
    "hey",
    "good morning",
    "good afternoon",
    "good evening",
    "kumusta",
    "musta",
    "oi",
    "yo",
  ],
  THANKS: [
    "thank",
    "thanks",
    "ty",
    "appreciate",
    "salamat",
    "tnx",
  ],
  GOODBYE: [
    "bye",
    "goodbye",
    "see you",
    "take care",
    "paalam",
    "sige",
    "gtg",
  ],
  HELP: [
    "help",
    "tulong",
    "assist",
    "support",
    "emergency",
  ],
  CONFUSED: [
    "confused",
    "don't understand",
    "what do you mean",
    "unclear",
    "huh",
  ],
};

/**
 * FAQ Matching Configuration
 */
const FAQ_CONFIG = {
  // ========== TYPING SIMULATION ==========
  MIN_TYPING_DELAY_MS: 800, // #22: Minimum typing delay
  MAX_TYPING_DELAY_MS: 1500, // #23: Maximum typing delay
  
  // ========== FAQ MATCHING ==========
  MIN_CONFIDENCE_THRESHOLD: 0.15, // #17: Minimum match confidence (lowered for better matching)
  HIGH_CONFIDENCE_THRESHOLD: 0.6, // #18: High confidence (no confirmation)
  KEYWORD_WEIGHT: 25, // #19: Keyword match weight
  QUESTION_WORD_WEIGHT: 8, // #20: Question word match weight
  EXACT_MATCH_BONUS: 50, // #21: Exact match bonus
  AUTO_ESCALATE_AFTER_FAILED_MATCHES: 3, // #25: Auto-suggest human agent
};

/**
 * useSmartResponses Hook
 * Handles FAQ fetching, smart response generation, and context-aware suggestions
 */
export function useSmartResponses() {
  const [faqs, setFaqs] = useState<FAQ[]>([]);
  const [failedMatchCount, setFailedMatchCount] = useState(0);

  /**
   * Fetch all active FAQs from database
   */
  const fetchFAQs = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from("faqs")
        .select("id, question, answer, keywords, category_id, match_count")
        .eq("is_active", true)
        .eq("is_archived", false);

      if (error) throw error;
      setFaqs(data as FAQ[]);
    } catch (error) {
      console.error("Error fetching FAQs:", error);
    }
  }, []);

  /**
   * Smart keyword matching - handles compound words, case insensitivity
   * "teambuilding" matches "team building"
   */
  const matchesKeywords = useCallback(
    (content: string, keywords: string[]): boolean => {
      return matchesKeywordSmart(content, keywords);
    },
    []
  );

  /**
   * Pattern detection helpers
   */
  const isGreeting = useCallback(
    (content: string) => matchesKeywords(content, PATTERN_KEYWORDS.GREETING),
    [matchesKeywords]
  );

  const isThanks = useCallback(
    (content: string) => matchesKeywords(content, PATTERN_KEYWORDS.THANKS),
    [matchesKeywords]
  );

  const isGoodbye = useCallback(
    (content: string) => matchesKeywords(content, PATTERN_KEYWORDS.GOODBYE),
    [matchesKeywords]
  );

  const isHelpRequest = useCallback(
    (content: string) => matchesKeywords(content, PATTERN_KEYWORDS.HELP),
    [matchesKeywords]
  );

  const isConfused = useCallback(
    (content: string) => matchesKeywords(content, PATTERN_KEYWORDS.CONFUSED),
    [matchesKeywords]
  );

  /**
   * Get random response from templates
   */
  const getRandomResponse = useCallback((responses: string[]): string => {
    return responses[Math.floor(Math.random() * responses.length)];
  }, []);

  /**
   * Get smart response based on content patterns
   */
  const getSmartResponse = useCallback(
    (content: string): { response: string; type: string } | null => {
      const trimmed = content.trim();
      const lower = trimmed.toLowerCase();
      const wordCount = trimmed ? trimmed.split(/\s+/).length : 0;
      const hasQuestionMark = trimmed.includes("?");
      const questionWords = [
        "what",
        "how",
        "when",
        "where",
        "who",
        "why",
        "is",
        "are",
        "can",
        "do",
        "ano",
        "paano",
        "kailan",
        "saan",
      ];
      const startsWithQuestionWord = questionWords.some(
        (w) => lower === w || lower.startsWith(w + " ")
      );
      const likelyQuestion = hasQuestionMark || startsWithQuestionWord;

      // Avoid greeting/thanks responses on real questions
      if (likelyQuestion && wordCount >= 4) {
        return null;
      }

      const isShort = trimmed.length <= 60;

      if (isGreeting(content) && isShort) {
        return {
          response: getRandomResponse(RESPONSE_TEMPLATES.GREETING),
          type: "greeting",
        };
      }
      if (isThanks(content) && isShort) {
        return {
          response: getRandomResponse(RESPONSE_TEMPLATES.THANKS),
          type: "thanks",
        };
      }
      if (isGoodbye(content) && isShort) {
        return {
          response: getRandomResponse(RESPONSE_TEMPLATES.GOODBYE),
          type: "goodbye",
        };
      }
      if (isHelpRequest(content) && isShort) {
        return {
          response: getRandomResponse(RESPONSE_TEMPLATES.HELP),
          type: "help",
        };
      }
      if (isConfused(content) && isShort) {
        return {
          response: getRandomResponse(RESPONSE_TEMPLATES.CONFUSED),
          type: "confused",
        };
      }
      return null;
    },
    [isGreeting, isThanks, isGoodbye, isHelpRequest, isConfused, getRandomResponse]
  );

  /**
   * Get fallback response with escalation suggestion
   */
  const getFallbackResponse = useCallback((): string => {
    if (failedMatchCount >= FAQ_CONFIG.AUTO_ESCALATE_AFTER_FAILED_MATCHES - 1) {
      return "I've had trouble answering your recent questions. I recommend speaking with a human agent who can better assist you. Click the 'Human Agent' button below to connect with our support team.";
    }
    return getRandomResponse(RESPONSE_TEMPLATES.FALLBACK);
  }, [failedMatchCount, getRandomResponse]);

  /**
   * Get suggestions based on context
   */
  const getSuggestions = useCallback(
    (context?: string): string[] => {
      if (context && QUICK_SUGGESTIONS[context as keyof typeof QUICK_SUGGESTIONS]) {
        return QUICK_SUGGESTIONS[context as keyof typeof QUICK_SUGGESTIONS];
      }
      return QUICK_SUGGESTIONS.initial;
    },
    []
  );

  /**
   * Detect context from user message
   */
  const detectContext = useCallback((content: string): string | null => {
    const lowerContent = content.toLowerCase();
    if (
      lowerContent.includes("enroll") ||
      lowerContent.includes("registration")
    )
      return "enrollment";
    if (lowerContent.includes("intern") || lowerContent.includes("ojt"))
      return "internship";
    if (
      lowerContent.includes("fee") ||
      lowerContent.includes("tuition") ||
      lowerContent.includes("payment")
    )
      return "fees";
    if (lowerContent.includes("event") || lowerContent.includes("activity"))
      return "events";
    return null;
  }, []);

  /**
   * Find best matching FAQ with confidence scoring
   * ENHANCED: Handles compound words, multiple keywords, fuzzy matching
   */
  const findBestMatch = useCallback(
    (query: string): {
      faq: FAQ | null;
      confidence: number;
      suggestions: string[];
    } => {
      const normalizedQuery = normalizeText(query);
      const entities = extractEntities(query);
      const segments = extractQuestionSegments(query);
      const segmentsToCheck = segments.length > 0 ? segments : [query];
      const normalizedSegments = segmentsToCheck.map((s) => normalizeText(s));
      
      let bestMatch: FAQ | null = null;
      let highestScore = 0;
      const relatedFaqs: FAQ[] = [];

      for (const faq of faqs) {
        let score = 0;
        const questionLower = normalizeText(faq.question);
        const answerLower = normalizeText(faq.answer);

        // #21: Exact or near-exact match bonus (enhanced for compound words)
        const hasExactSegmentMatch = normalizedSegments.some(
          (seg) => questionLower.includes(seg) || seg.includes(questionLower)
        );
        if (hasExactSegmentMatch) {
          score += FAQ_CONFIG.EXACT_MATCH_BONUS;
        }
        // Fuzzy match bonus for typos (NEW)
        else if (
          normalizedSegments.some(
            (seg) => fuzzyMatch(questionLower, seg, 0.85) || fuzzyMatch(seg, questionLower, 0.85)
          )
        ) {
          score += FAQ_CONFIG.EXACT_MATCH_BONUS * 0.9; // 45 points for fuzzy match
        }

        // FAQ Question Similarity Match (checks per segment)
        const questionSimilarity = Math.max(
          ...segmentsToCheck.map((seg) => calculateFAQSimilarity(seg, faq.question))
        );
        if (questionSimilarity >= 0.75) {
          // Strong similarity to the FAQ question
          score += questionSimilarity * 50; // Up to 50 points based on similarity
        }

        // Also check answer for relevance (bonus if query words appear in answer)
        const answerSimilarity = Math.max(
          ...segmentsToCheck.map((seg) => calculateFAQSimilarity(seg, faq.answer))
        );
        if (answerSimilarity >= 0.6) {
          // Significant similarity to the FAQ answer
          score += answerSimilarity * 30; // Up to 30 bonus points
        }

        // #19: Keyword matching (enhanced with smart matching)
        if (faq.keywords && faq.keywords.length > 0) {
          const keywordScore = calculateKeywordScore(query, faq.keywords);
          if (keywordScore > 0) {
            score += (keywordScore / 100) * FAQ_CONFIG.KEYWORD_WEIGHT;
          }
        }

        // #20: Word-by-word matching (via entities)
        for (const word of entities.keywords) {
          if (questionLower.includes(word)) score += FAQ_CONFIG.QUESTION_WORD_WEIGHT;
          if (answerLower.includes(word)) score += 6; // Increased from 4
        }

        // Smart token matching - if all entity keywords appear in question or answer
        if (entities.keywords.length > 0) {
          const allKeywordsInQuestion = entities.keywords.every((kw) =>
            matchesKeywordSmart(questionLower, kw)
          );
          const allKeywordsInAnswer = entities.keywords.every((kw) =>
            matchesKeywordSmart(answerLower, kw)
          );
          
          if (allKeywordsInQuestion) score += 15;
          else if (allKeywordsInAnswer) score += 12;
        }

        // Bonus for question word match
        const questionWords = [
          "what",
          "how",
          "when",
          "where",
          "who",
          "why",
          "is",
          "can",
          "do",
          "ano",
          "paano",
          "kailan",
          "saan",
        ];
        for (const qWord of questionWords) {
          if (normalizedQuery.startsWith(qWord) && questionLower.startsWith(qWord)) {
            score += 5;
          }
        }

        // Bonus for category match
        if (entities.category) {
          const categoryKeywords: Record<string, string[]> = {
            enrollment: ["enroll", "registration", "register"],
            internship: ["intern", "ojt", "training"],
            fees: ["tuition", "payment", "cost"],
            events: ["event", "activity"],
          };
          
          if (categoryKeywords[entities.category]) {
            const hasCategory = matchesKeywordSmart(
              faq.question + " " + faq.answer,
              categoryKeywords[entities.category]
            );
            if (hasCategory) score += 10;
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
        } else if (score === highestScore && bestMatch) {
          const currentMatchCount = faq.match_count || 0;
          const bestMatchCount = bestMatch.match_count || 0;
          if (currentMatchCount > bestMatchCount) {
            bestMatch = faq;
          }
        }
      }

      const confidence = Math.min(highestScore / 100, 1);

      // Track failed matches
      if (confidence < FAQ_CONFIG.MIN_CONFIDENCE_THRESHOLD) {
        setFailedMatchCount((prev) => prev + 1);
      } else {
        setFailedMatchCount(0);
      }

      // Get context-aware suggestions
      const context = entities.category || detectContext(query);
      const suggestions = context
        ? getSuggestions(context)
        : relatedFaqs.slice(0, 3).map((f) => f.question);

      return { faq: bestMatch, confidence, suggestions };
    },
    [faqs, detectContext, getSuggestions]
  );

  /**
   * Reset failed match count (e.g., when user starts new conversation)
   */
  const resetFailedMatches = useCallback(() => {
    setFailedMatchCount(0);
  }, []);

  /**
   * Fetch FAQs on mount
   */
  useEffect(() => {
    fetchFAQs();
  }, [fetchFAQs]);

  return {
    faqs,
    failedMatchCount,
    fetchFAQs,
    getSmartResponse,
    getFallbackResponse,
    getSuggestions,
    detectContext,
    findBestMatch,
    resetFailedMatches,
    config: FAQ_CONFIG,
    responseTemplates: RESPONSE_TEMPLATES,
    quickSuggestions: QUICK_SUGGESTIONS,
  };
}






















