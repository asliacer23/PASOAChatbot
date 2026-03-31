import { useState, useEffect } from "react";
import { Search, ChevronRight, HelpCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/features/auth";
import { VerificationRequiredPanel } from "@/features/shared/components/VerificationRequiredPanel";

interface FAQCategory {
  id: string;
  name: string;
  slug: string;
}

interface FAQ {
  id: string;
  question: string;
  answer: string;
  category_id: string;
}

export function FAQCenter() {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("all");
  const [categories, setCategories] = useState<FAQCategory[]>([]);
  const [faqs, setFaqs] = useState<FAQ[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();
  const { profile, isAdmin } = useAuth();

  const hasVerifiedStudentNumber = Boolean(profile?.student_id?.trim() && /^20\d{6}-[A-Z]$/.test(profile.student_id.trim().toUpperCase()));
  const requiresVerification = !isAdmin && !hasVerifiedStudentNumber;

  useEffect(() => {
    if (requiresVerification) return;
    fetchData();
  }, [requiresVerification]);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [{ data: categoriesData }, { data: faqsData }] = await Promise.all([
        supabase.from("faq_categories").select("id, name, slug").eq("is_active", true).order("display_order"),
        supabase.from("faqs").select("id, question, answer, category_id").eq("is_active", true).eq("is_archived", false),
      ]);

      setCategories(categoriesData as FAQCategory[] || []);
      setFaqs(faqsData as FAQ[] || []);
    } catch (error) {
      console.error("Error fetching FAQs:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const incrementViewCount = async (faqId: string) => {
    try {
      const { data: currentFaq } = await supabase
        .from("faqs")
        .select("view_count")
        .eq("id", faqId)
        .single();

      if (currentFaq) {
        await supabase
          .from("faqs")
          .update({ view_count: (currentFaq.view_count || 0) + 1 })
          .eq("id", faqId);
      }
    } catch (error) {
      console.error("Error updating view count:", error);
    }
  };

  const filteredFaqs = faqs.filter((faq) => {
    const matchesSearch =
      faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      faq.answer.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = activeCategory === "all" || faq.category_id === activeCategory;
    return matchesSearch && matchesCategory;
  });

  const getCategoryName = (categoryId: string) => {
    const category = categories.find((c) => c.id === categoryId);
    return category?.name || "General";
  };

  if (requiresVerification) {
    return (
      <div className="w-full min-h-screen bg-gradient-to-b from-background via-background to-accent/5">
        <VerificationRequiredPanel featureLabel="FAQ Center" />
      </div>
    );
  }

  return (
    <div className="w-full min-h-screen bg-gradient-to-b from-background via-background to-accent/5">
      <div className="px-4 sm:px-6 md:px-8 lg:px-12 py-6 sm:py-8 md:py-12 space-y-6 sm:space-y-8 md:space-y-8 animate-fade-up w-full max-w-none">
        {/* Header - Enhanced with gradient and better spacing */}
        <section className="space-y-3 relative">
          <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-accent/5 rounded-2xl blur-3xl -z-10" />
          <div className="flex items-center gap-3 sm:gap-4">
            <div className="h-11 w-11 sm:h-13 sm:w-13 rounded-xl sm:rounded-2xl bg-gradient-to-r from-primary to-blue-600 flex items-center justify-center flex-shrink-0 shadow-md">
              <HelpCircle className="h-5 w-5 sm:h-6 sm:w-6 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold bg-gradient-to-r from-foreground to-muted-foreground bg-clip-text text-transparent">FAQ & Help Center</h1>
              <p className="text-xs sm:text-sm text-muted-foreground">Find answers to your questions in seconds</p>
            </div>
          </div>
        </section>

        {/* Search - Enhanced styling */}
        <div className="relative group">
          <div className="absolute inset-0 bg-gradient-to-r from-primary/20 via-transparent to-accent/20 rounded-xl sm:rounded-2xl blur opacity-0 group-focus-within:opacity-100 transition-opacity duration-300" />
          <div className="relative">
            <Search className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/60 group-focus-within:text-primary transition-colors" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search questions..."
              className="pl-9 sm:pl-11 rounded-xl sm:rounded-2xl bg-secondary/50 border-border/50 text-sm sm:text-base h-10 sm:h-11 focus:ring-2 focus:ring-primary/20 focus:border-primary/50 transition-all duration-200"
            />
          </div>
        </div>

        {/* Categories - Enhanced with better styling */}
        <div className="flex gap-2 sm:gap-3 overflow-x-auto pb-2 scrollbar-hide -mx-4 sm:-mx-6 px-4 sm:px-6">
          <Button
            variant={activeCategory === "all" ? "default" : "outline"}
            size="sm"
            onClick={() => setActiveCategory("all")}
            className={`rounded-full shrink-0 text-xs sm:text-sm h-9 sm:h-10 px-4 sm:px-5 font-medium transition-all duration-200 ${
              activeCategory === "all"
                ? "bg-gradient-to-r from-primary to-blue-600 border-0 shadow-md hover:shadow-lg"
                : "border-border/50 hover:border-primary/50 hover:bg-secondary/50"
            }`}
          >
            All
          </Button>
          {categories.map((category) => (
            <Button
              key={category.id}
              variant={activeCategory === category.id ? "default" : "outline"}
              size="sm"
              onClick={() => setActiveCategory(category.id)}
              className={`rounded-full shrink-0 text-xs sm:text-sm h-9 sm:h-10 px-4 sm:px-5 font-medium transition-all duration-200 ${
                activeCategory === category.id
                  ? "bg-gradient-to-r from-primary to-blue-600 border-0 shadow-md hover:shadow-lg"
                  : "border-border/50 hover:border-primary/50 hover:bg-secondary/50"
              }`}
            >
              {category.name}
            </Button>
          ))}
        </div>

        {/* FAQ List - Enhanced accordion styling */}
        {isLoading ? (
          <div className="space-y-3 sm:space-y-4">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="border-border/30 bg-card/50 backdrop-blur-sm">
                <CardContent className="p-4 sm:p-5 space-y-3">
                  <Skeleton className="h-5 w-4/5 rounded-lg" />
                  <Skeleton className="h-4 w-1/3 rounded-lg" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Accordion type="single" collapsible className="space-y-3 sm:space-y-4">
            {filteredFaqs.map((faq) => (
              <AccordionItem
                key={faq.id}
                value={faq.id}
                className="group border border-border/30 rounded-xl sm:rounded-2xl px-4 sm:px-5 bg-card/60 backdrop-blur-sm hover:bg-card/80 hover:border-primary/30 data-[state=open]:bg-card data-[state=open]:border-primary/30 data-[state=open]:shadow-md transition-all duration-300"
                onClick={() => incrementViewCount(faq.id)}
              >
                <AccordionTrigger className="hover:no-underline py-4 sm:py-5 text-left">
                  <div className="flex items-start gap-3 sm:gap-4 w-full pr-2">
                    <ChevronRight className="h-5 w-5 sm:h-6 sm:w-6 shrink-0 mt-0.5 text-primary group-data-[state=open]:rotate-90 transition-transform duration-300" />
                    <div className="space-y-2 min-w-0 flex-1">
                      <p className="font-semibold text-sm sm:text-base leading-snug text-foreground group-hover:text-primary transition-colors">
                        {faq.question}
                      </p>
                      <Badge 
                        variant="secondary" 
                        className="text-[10px] sm:text-xs capitalize inline-block bg-primary/10 text-primary border-primary/20 font-medium"
                      >
                        {getCategoryName(faq.category_id)}
                      </Badge>
                    </div>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="pl-8 sm:pl-10 pb-4 sm:pb-5 pt-2 animate-fade-up">
                  <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">
                    {faq.answer}
                  </p>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        )}

        {!isLoading && filteredFaqs.length === 0 && (
          <Card className="border-border/30 bg-gradient-to-br from-accent/30 via-accent/20 to-background shadow-md">
            <CardContent className="py-12 sm:py-16 text-center space-y-4">
              <div className="space-y-2">
                <p className="text-sm sm:text-base text-muted-foreground">
                  No FAQs found matching your search.
                </p>
                <p className="text-xs sm:text-sm text-muted-foreground/70">
                  Try adjusting your filters or search terms
                </p>
              </div>
              <Button
                variant="outline"
                onClick={() => {
                  setSearchQuery("");
                  setActiveCategory("all");
                }}
                className="rounded-lg sm:rounded-xl border-primary/30 hover:bg-primary/5 hover:border-primary/50 text-primary text-sm sm:text-base font-medium"
              >
                Clear filters
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Can't find answer CTA - Enhanced with gradient and better styling */}
        <Card className="border-primary/20 bg-gradient-to-br from-primary/10 via-accent/5 to-background shadow-md hover:shadow-lg hover:border-primary/40 transition-all duration-300 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-accent/5 opacity-0 hover:opacity-100 transition-opacity duration-300" />
          <CardHeader className="pb-3 sm:pb-4 p-5 sm:p-7 relative z-10">
            <CardTitle className="text-lg sm:text-xl font-bold">Can't find what you're looking for?</CardTitle>
          </CardHeader>
          <CardContent className="p-5 sm:p-7 pt-0 sm:pt-0 space-y-4 relative z-10">
            <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
              Get instant answers from our AI chatbot or connect with a human agent for personalized assistance.
            </p>
            <Button 
              className="rounded-xl bg-gradient-to-r from-primary to-blue-600 hover:shadow-lg hover:shadow-primary/25 border-0 w-full sm:w-auto text-sm sm:text-base font-semibold transition-all duration-200"
              onClick={() => navigate("/chat")}
            >
              Chat with us
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}





