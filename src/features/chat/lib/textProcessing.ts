/**
 * Text Processing & Smart Matching Utilities
 * Handles normalization, similarity scoring, and keyword matching
 * Fixes issues like "teambuilding" vs "team building"
 */

// ==========================================
// BAD WORDS & PROFANITY FILTER
// ==========================================
const BAD_WORDS = [
  // Profanity
  "badword1",
  "badword2",
  "spam",
  "hack",
  "cheat",
  "xxx",
  "porn",
  
  // Suspicious patterns words
  "password",
  "creditcard",
  "ssn",
  "piracy",
  "illegal",
  "counterfeit",
  "steal",
  "bomb",
  "nudes",
  
  // Scam-related
  "freemoney",
  "lottery",
  "prize",
  "winnow",
  "clickhere",
  "confirmpassword",
];

/**
 * Normalize text for comparison
 * Removes extra spaces, special chars, converts to lowercase
 */
export function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .trim()
    // Remove extra whitespace
    .replace(/\s+/g, " ")
    // Remove common punctuation from ends
    .replace(/[!?.;,]+$/, "")
    // Handle multiple exclamation marks as one
    .replace(/!{2,}/g, "!")
    .trim();
}

/**
 * Remove spaces from text (for compound word matching)
 * "team building" -> "teambuilding"
 */
export function removeSpaces(text: string): string {
  return text.toLowerCase().replace(/\s+/g, "");
}

/**
 * Split text into tokens (words)
 */
export function tokenizeText(text: string): string[] {
  return normalizeText(text)
    .split(/[\s\-\,\.]+/)
    .filter((word) => word.length > 0);
}

/**
 * Calculate Levenshtein distance (edit distance) between two strings
 * Used for fuzzy matching
 */
export function levenshteinDistance(str1: string, str2: string): number {
  const len1 = str1.length;
  const len2 = str2.length;
  const matrix: number[][] = Array(len2 + 1)
    .fill(null)
    .map(() => Array(len1 + 1).fill(0));

  for (let i = 0; i <= len1; i++) matrix[0][i] = i;
  for (let j = 0; j <= len2; j++) matrix[j][0] = j;

  for (let j = 1; j <= len2; j++) {
    for (let i = 1; i <= len1; i++) {
      const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1;
      matrix[j][i] = Math.min(
        matrix[j][i - 1] + 1,
        matrix[j - 1][i] + 1,
        matrix[j - 1][i - 1] + indicator
      );
    }
  }

  return matrix[len2][len1];
}

/**
 * Calculate similarity score between two strings (0-1)
 */
export function calculateSimilarity(str1: string, str2: string): number {
  const norm1 = removeSpaces(str1);
  const norm2 = removeSpaces(str2);

  if (norm1 === norm2) return 1;

  const maxLen = Math.max(norm1.length, norm2.length);
  if (maxLen === 0) return 1;

  const distance = levenshteinDistance(norm1, norm2);
  return 1 - distance / maxLen;
}

/**
 * Calculate text similarity for FAQ matching
 * Compares normalized text and handles various formats
 * Returns score 0-1 (higher is better match)
 */
export function calculateFAQSimilarity(query: string, faqText: string): number {
  const normalizedQuery = normalizeText(query);
  const normalizedFaq = normalizeText(faqText);

  // Exact match after normalization
  if (normalizedQuery === normalizedFaq) return 1.0;

  // One contains the other
  if (normalizedQuery.includes(normalizedFaq) || normalizedFaq.includes(normalizedQuery)) {
    return 0.95;
  }

  // Fuzzy similarity
  const similarity = calculateSimilarity(normalizedQuery, normalizedFaq);
  return similarity;
}

/**
 * Check if content contains any bad words
 * Returns { isBad, violations: string[] }
 */
export function checkBadWords(
  content: string
): { isBad: boolean; violations: string[] } {
  const lowerContent = normalizeText(content);
  const tokens = tokenizeText(content);
  const violations: string[] = [];

  // Check for exact matches and partial matches
  for (const badWord of BAD_WORDS) {
    const badWordNorm = removeSpaces(badWord);
    
    // Check if bad word is in the normalized content
    if (lowerContent.includes(badWord)) {
      violations.push(badWord);
    }
    
    // Check tokens for matches
    for (const token of tokens) {
      if (token.includes(badWordNorm) || badWordNorm.includes(token)) {
        if (!violations.includes(badWord)) {
          violations.push(badWord);
        }
      }
    }
  }

  return {
    isBad: violations.length > 0,
    violations,
  };
}

/**
 * Fuzzy match with tolerance for typos
 * Returns similarity score (0-1)
 * 0.8 or higher is considered a match
 */
export function fuzzyMatch(str1: string, str2: string, tolerance: number = 0.8): boolean {
  const similarity = calculateSimilarity(str1, str2);
  return similarity >= tolerance;
}

/**
 * Smart keyword matcher - handles various formats
 * "teambuilding" matches "team building"
 * Case-insensitive
 * Now includes fuzzy matching for typos
 */
export function matchesKeywordSmart(
  content: string,
  keywords: string | string[]
): boolean {
  const normalizedContent = normalizeText(content);
  const contentTokens = tokenizeText(content);
  const contentNoSpaces = removeSpaces(content);

  const keywordList = Array.isArray(keywords) ? keywords : [keywords];

  for (const keyword of keywordList) {
    const normalizedKeyword = normalizeText(keyword);
    const keywordNoSpaces = removeSpaces(keyword);
    const keywordTokens = tokenizeText(keyword);

    // 1. Exact match (after normalization)
    if (normalizedContent === normalizedKeyword) return true;

    // 2. Starts with keyword
    if (normalizedContent.startsWith(normalizedKeyword + " ")) return true;
    if (normalizedContent.startsWith(normalizedKeyword + "!")) return true;
    if (normalizedContent.startsWith(normalizedKeyword + "?")) return true;

    // 3. Ends with keyword
    if (normalizedContent.endsWith(" " + normalizedKeyword)) return true;
    if (normalizedContent.includes(" " + normalizedKeyword + " ")) return true;

    // 4. Compound word matching (no spaces)
    if (contentNoSpaces === keywordNoSpaces) return true;
    if (contentNoSpaces.startsWith(keywordNoSpaces)) return true;
    if (contentNoSpaces.includes(keywordNoSpaces)) return true;

    // 5. Fuzzy matching for typos (NEW)
    if (fuzzyMatch(normalizedContent, normalizedKeyword, 0.85)) return true;
    if (fuzzyMatch(contentNoSpaces, keywordNoSpaces, 0.85)) return true;

    // 6. Token-based matching
    if (keywordTokens.length === 1) {
      // Single word keyword
      if (contentTokens.includes(keywordTokens[0])) return true;
      // Fuzzy match for single tokens
      if (contentTokens.some((token) => fuzzyMatch(token, keywordTokens[0], 0.82))) return true;
    } else {
      // Multi-word keyword - check if all tokens appear in order
      let startIdx = 0;
      let matchedAll = true;
      for (const kToken of keywordTokens) {
        const idx = contentTokens.findIndex(
          (cToken, i) => i >= startIdx && (cToken === kToken || fuzzyMatch(cToken, kToken, 0.82))
        );
        if (idx === -1) {
          matchedAll = false;
          break;
        }
        startIdx = idx + 1;
      }
      if (matchedAll) return true;
    }
  }

  return false;
}

/**
 * Calculate keyword match score (0-100)
 * Takes into account exact matches, partial matches, and token matches
 * Now includes fuzzy matching for typos
 */
export function calculateKeywordScore(
  content: string,
  keywords: string[]
): number {
  if (!keywords || keywords.length === 0) return 0;

  const normalizedContent = normalizeText(content);
  const contentTokens = tokenizeText(content);
  const contentNoSpaces = removeSpaces(content);

  let totalScore = 0;
  let matchedKeywords = 0;

  for (const keyword of keywords) {
    const normalizedKeyword = normalizeText(keyword);
    const keywordNoSpaces = removeSpaces(keyword);
    const keywordTokens = tokenizeText(keyword);

    let score = 0;

    // Exact match - 100 points
    if (normalizedContent === normalizedKeyword) {
      score = 100;
    }
    // Fuzzy match - 95 points (NEW)
    else if (fuzzyMatch(normalizedContent, normalizedKeyword, 0.85)) {
      score = 95;
    }
    // Compound word match - 90 points
    else if (contentNoSpaces === keywordNoSpaces) {
      score = 90;
    }
    // Compound word fuzzy match - 85 points (NEW)
    else if (fuzzyMatch(contentNoSpaces, keywordNoSpaces, 0.85)) {
      score = 85;
    }
    // Contains keyword (with spaces) - 75 points
    else if (normalizedContent.includes(normalizedKeyword)) {
      score = 75;
    }
    // Compound contains - 60 points
    else if (contentNoSpaces.includes(keywordNoSpaces)) {
      score = 60;
    }
    // Word-by-word token match - 50 points
    else if (
      keywordTokens.length === 1 &&
      contentTokens.includes(keywordTokens[0])
    ) {
      score = 50;
    }
    // Fuzzy token match - 45 points (NEW)
    else if (
      keywordTokens.length === 1 &&
      contentTokens.some((cToken) => fuzzyMatch(cToken, keywordTokens[0], 0.82))
    ) {
      score = 45;
    }
    // All tokens in order - 40 points
    else if (keywordTokens.length > 1) {
      let startIdx = 0;
      let matchedAll = true;
      for (const kToken of keywordTokens) {
        const idx = contentTokens.indexOf(kToken, startIdx);
        if (idx === -1) {
          matchedAll = false;
          break;
        }
        startIdx = idx + 1;
      }
      if (matchedAll) score = 40;
    }
    // Some tokens match - 20 points
    else {
      const matchedTokens = keywordTokens.filter((kToken) =>
        contentTokens.some((cToken) => cToken.includes(kToken))
      );
      if (matchedTokens.length > 0) {
        score = 20;
      }
    }

    if (score > 0) {
      matchedKeywords++;
      totalScore += score;
    }
  }

  // Average score across matched keywords
  return matchedKeywords > 0 ? totalScore / matchedKeywords : 0;
}

/**
 * Find best matching keywords from a list
 */
export function findMatchingKeywords(
  content: string,
  keywords: string[]
): { keywords: string[]; scores: number[] } {
  const matched: string[] = [];
  const scores: number[] = [];

  for (const keyword of keywords) {
    const score = calculateKeywordScore(content, [keyword]);
    if (score > 20) {
      matched.push(keyword);
      scores.push(score);
    }
  }

  // Sort by score descending
  const paired = matched.map((k, i) => ({ keyword: k, score: scores[i] }));
  paired.sort((a, b) => b.score - a.score);

  return {
    keywords: paired.map((p) => p.keyword),
    scores: paired.map((p) => p.score),
  };
}

/**
 * Validate message content
 */
export interface ValidationResult {
  valid: boolean;
  error?: string;
  warnings?: string[];
  badWordsFound?: string[];
}

export function validateMessageContent(
  content: string,
  options = {
    maxLength: 500,
    minLength: 2,
    checkBadWords: true,
    checkSpamPatterns: true,
  }
): ValidationResult {
  // Check length
  if (content.length < options.minLength) {
    return {
      valid: false,
      error: `Message is too short (minimum ${options.minLength} characters)`,
    };
  }

  if (content.length > options.maxLength) {
    return {
      valid: false,
      error: `Message is too long (maximum ${options.maxLength} characters)`,
    };
  }

  // Check bad words
  if (options.checkBadWords) {
    const badWordCheck = checkBadWords(content);
    if (badWordCheck.isBad) {
      return {
        valid: false,
        error: "Message contains inappropriate content",
        badWordsFound: badWordCheck.violations,
      };
    }
  }

  // Check for repeated characters
  const repeatedCharMatch = content.match(/(.)\1{5,}/);
  if (repeatedCharMatch) {
    return {
      valid: false,
      error: "Please avoid repeating characters",
    };
  }

  // Check for excessive caps
  const letters = content.replace(/[^a-zA-Z]/g, "");
  if (letters.length > 5) {
    const capsCount = (content.match(/[A-Z]/g) || []).length;
    if ((capsCount / letters.length) * 100 > 70) {
      return {
        valid: false,
        error: "Please avoid using all caps",
      };
    }
  }

  return { valid: true };
}

/**
 * Extract entities from user message
 * Tries to identify what the user is asking about
 */
export interface ExtractedEntities {
  keywords: string[];
  intent: string | null;
  category: string | null;
}

export function extractEntities(content: string): ExtractedEntities {
  const lowerContent = normalizeText(content);
  const tokens = tokenizeText(content);

  // Intent detection
  let intent = null;
  if (matchesKeywordSmart(content, ["help", "how", "can", "do", "ano", "paano"])) {
    intent = "how-to";
  } else if (matchesKeywordSmart(content, ["what", "ano", "alin"])) {
    intent = "information";
  } else if (
    matchesKeywordSmart(content, ["when", "kailan", "saan"]) ||
    lowerContent.includes("schedule")
  ) {
    intent = "schedule";
  } else if (matchesKeywordSmart(content, ["where", "saan", "location"])) {
    intent = "location";
  } else if (
    matchesKeywordSmart(content, ["how much", "gaano", "price", "cost", "fee"])
  ) {
    intent = "pricing";
  }

  // Category detection
  let category = null;
  const categoryKeywords: Record<string, string[]> = {
    enrollment: ["enroll", "registration", "register", "apply"],
    internship: ["intern", "ojt", "onthejob", "trainingprogram"],
    fees: ["fee", "tuition", "payment", "cost", "price"],
    schedule: ["schedule", "timetable", "class", "when"],
    events: ["event", "activity", "program", "seminar"],
  };

  for (const [cat, keywords] of Object.entries(categoryKeywords)) {
    if (matchesKeywordSmart(content, keywords)) {
      category = cat;
      break;
    }
  }

  return {
    keywords: tokens.filter((t) => t.length > 2),
    intent,
    category,
  };
}

// ==========================================
// SUGGESTION LABEL UTILITIES
// ==========================================
function truncateWithEllipsis(text: string, maxChars: number): string {
  if (text.length <= maxChars) return text;
  const target = Math.max(0, maxChars - 3);
  const cutAt = text.lastIndexOf(" ", target);
  const safeCut = cutAt >= 20 ? cutAt : target;
  return text.slice(0, safeCut).trimEnd() + "...";
}

/**
 * Format suggestion labels to be short and presentable
 * Keeps original suggestion for click/tooltip, only affects display
 */
export function formatSuggestionLabel(suggestion: string, maxChars: number = 64): string {
  const cleaned = suggestion.replace(/\s+/g, " ").trim();
  if (cleaned.length <= maxChars) return cleaned;

  // Prefer first question/sentence if it is reasonably short
  const questionSplit = cleaned.split("?").map((s) => s.trim()).filter(Boolean);
  if (questionSplit.length > 0) {
    const firstQ = questionSplit[0] + "?";
    if (firstQ.length >= 20 && firstQ.length <= maxChars) { return firstQ; }
  }

  const sentenceSplit = cleaned.split(".").map((s) => s.trim()).filter(Boolean);
  if (sentenceSplit.length > 0) {
    const firstSentence = sentenceSplit[0];
    if (firstSentence.length >= 20 && firstSentence.length <= maxChars) { return firstSentence; }
  }

  return truncateWithEllipsis(cleaned, maxChars);
}


/**
 * Split a message into question-like segments for better FAQ matching
 */
export function extractQuestionSegments(content: string): string[] {
  const raw = content.replace(/\s+/g, " ").trim();
  if (!raw) return [];

  const parts = raw
    .split(/[\?\!\.:\n]+/)
    .map((p) => p.trim())
    .filter((p) => p.length >= 3);

  const seen = new Set<string>();
  const result: string[] = [];

  for (const part of parts) {
    const key = part.toLowerCase();
    if (!seen.has(key)) {
      seen.add(key);
      result.push(part);
    }
  }

  if (!seen.has(raw.toLowerCase())) {
    result.unshift(raw);
  }

  return result;
}
