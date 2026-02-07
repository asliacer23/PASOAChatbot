import { useCallback, useState } from "react";

/**
 * Configuration for 47+ chatbot message restrictions and rules
 */
export const CHATBOT_CONFIG = {
  // ========== MESSAGE RESTRICTIONS ==========
  MAX_MESSAGE_LENGTH: 500, // #1: Max characters per message
  MIN_MESSAGE_LENGTH: 2, // #2: Min characters per message
  MAX_MESSAGES_PER_MINUTE: 10, // #3: Rate limiting
  MAX_IMAGES_PER_MESSAGE: 1, // #4: Image count limit
  MAX_IMAGE_SIZE_MB: 5, // #5: Image size limit in MB
  MAX_CONSECUTIVE_MESSAGES: 5, // #6: Max messages without bot response
  MAX_MESSAGE_WORDS: 100, // #7: Max words per message

  // ========== CONTENT FILTERS ==========
  BLOCKED_WORDS: [
    // #8: Profanity/spam filter
    "spam",
    "hack",
    "cheat",
    "password123",
    "xxx",
    "porn",
  ],
  SUSPICIOUS_PATTERNS: [
    // #9: Suspicious content detection
    /\b(free money|click here|win now)\b/i,
    /\b(password|credit card|ssn)\s*(is|:)/i,
  ],
  MAX_REPEATED_CHARS: 5, // #10: Prevent "aaaaaaa" spam
  MAX_CAPS_PERCENTAGE: 70, // #11: Limit all-caps messages

  // ========== HUMAN AGENT ==========
  BLOCK_AFTER_VIOLATIONS: 3, // #44: Block after X violations
  VIOLATION_COOLDOWN_HOURS: 24, // #45: Violation cooldown
};

/**
 * useMessageValidation Hook
 * Validates message content against 11+ rules and tracks violations
 */
export function useMessageValidation() {
  const [violationCount, setViolationCount] = useState(0);
  const [lastMessageTime, setLastMessageTime] = useState<number>(0);

  /**
   * #10: Check for repeated characters (e.g., "aaaaaaa")
   */
  const hasRepeatedChars = useCallback((content: string): boolean => {
    const regex = new RegExp(
      `(.)\\1{${CHATBOT_CONFIG.MAX_REPEATED_CHARS},}`,
      "g"
    );
    return regex.test(content);
  }, []);

  /**
   * #11: Check for excessive caps (>70% uppercase letters)
   */
  const hasExcessiveCaps = useCallback((content: string): boolean => {
    const letters = content.replace(/[^a-zA-Z]/g, "");
    if (letters.length < 5) return false;
    const capsCount = (content.match(/[A-Z]/g) || []).length;
    return (capsCount / letters.length) * 100 > CHATBOT_CONFIG.MAX_CAPS_PERCENTAGE;
  }, []);

  /**
   * #9: Check for suspicious patterns
   */
  const hasSuspiciousPatterns = useCallback((content: string): boolean => {
    return CHATBOT_CONFIG.SUSPICIOUS_PATTERNS.some((pattern) =>
      pattern.test(content)
    );
  }, []);

  /**
   * Main validation function - checks all 11+ rules
   * Returns validation result with error message if invalid
   */
  const validateMessage = useCallback(
    (content: string): { valid: boolean; error?: string } => {
      // #2: Check minimum length
      if (content.length < CHATBOT_CONFIG.MIN_MESSAGE_LENGTH) {
        return { valid: false, error: "Message is too short" };
      }

      // #1: Check maximum length
      if (content.length > CHATBOT_CONFIG.MAX_MESSAGE_LENGTH) {
        return {
          valid: false,
          error: `Message exceeds ${CHATBOT_CONFIG.MAX_MESSAGE_LENGTH} characters`,
        };
      }

      // #7: Check word count
      const wordCount = content.split(/\s+/).filter((w) => w.length > 0).length;
      if (wordCount > CHATBOT_CONFIG.MAX_MESSAGE_WORDS) {
        return {
          valid: false,
          error: `Message exceeds ${CHATBOT_CONFIG.MAX_MESSAGE_WORDS} words`,
        };
      }

      // #8: Check for blocked words
      const lowerContent = content.toLowerCase();
      for (const word of CHATBOT_CONFIG.BLOCKED_WORDS) {
        if (lowerContent.includes(word)) {
          setViolationCount((prev) => prev + 1);
          return { valid: false, error: "Message contains inappropriate content" };
        }
      }

      // #9: Check suspicious patterns
      if (hasSuspiciousPatterns(content)) {
        setViolationCount((prev) => prev + 1);
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

      // #3: Rate limiting (max 10 messages per minute)
      const now = Date.now();
      if (now - lastMessageTime < 60000 / CHATBOT_CONFIG.MAX_MESSAGES_PER_MINUTE) {
        return { valid: false, error: "Please wait before sending another message" };
      }

      // #44: Check if blocked due to violations
      if (violationCount >= CHATBOT_CONFIG.BLOCK_AFTER_VIOLATIONS) {
        return {
          valid: false,
          error:
            "You've been temporarily blocked due to violations. Please try again later.",
        };
      }

      return { valid: true };
    },
    [lastMessageTime, violationCount, hasRepeatedChars, hasExcessiveCaps, hasSuspiciousPatterns]
  );

  /**
   * Update timestamp of last message sent
   */
  const recordMessageTime = useCallback(() => {
    setLastMessageTime(Date.now());
  }, []);

  /**
   * Reset violation count (e.g., when user starts new conversation)
   */
  const resetViolations = useCallback(() => {
    setViolationCount(0);
  }, []);

  return {
    validateMessage,
    recordMessageTime,
    resetViolations,
    violationCount,
    lastMessageTime,
    hasRepeatedChars,
    hasExcessiveCaps,
    hasSuspiciousPatterns,
    config: CHATBOT_CONFIG,
  };
}
