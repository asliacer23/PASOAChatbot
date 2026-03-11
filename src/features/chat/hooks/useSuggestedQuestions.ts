import { useCallback, useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

interface SuggestedQuestion {
  id: string;
  question: string;
  faq_categories?: {
    name?: string | null;
    slug?: string | null;
  } | null;
}

/**
 * useSuggestedQuestions Hook
 * Fetches up to 5 FAQ questions from the database
 * Prioritizes by view_count and match_count to show most popular questions
 */
export function useSuggestedQuestions() {
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  /**
   * Fetch suggested questions from FAQs table
   * Limits to 5 questions, ordered by popularity (view_count + match_count)
   */
  const fetchSuggestedQuestions = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const { data, error: fetchError } = await supabase
        .from("faqs")
        .select("id, question, faq_categories ( name, slug )")
        .eq("is_active", true)
        .eq("is_archived", false)
        .order("view_count", { ascending: false })
        .order("match_count", { ascending: false })
        .limit(30);

      if (fetchError) throw fetchError;

      const items = (data as SuggestedQuestion[]) || [];
      const isEventCategory = (item: SuggestedQuestion) => {
        const slug = item.faq_categories?.slug?.toLowerCase() || "";
        const name = item.faq_categories?.name?.toLowerCase() || "";
        return slug === "events" || slug === "event" || name.includes("event");
      };

      // Only keep event-category questions
      const questions = items
        .filter(isEventCategory)
        .slice(0, 5)
        .map((item) => item.question);

      setSuggestions(questions);
    } catch (err) {
      console.error("Error fetching suggested questions:", err);
      setError(err instanceof Error ? err : new Error("Failed to fetch suggestions"));
      // Fallback to empty array if fetch fails
      setSuggestions([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Fetch on mount and optionally refetch
   */
  useEffect(() => {
    fetchSuggestedQuestions();
  }, [fetchSuggestedQuestions]);

  return {
    suggestions,
    isLoading,
    error,
    refetch: fetchSuggestedQuestions,
  };
}



