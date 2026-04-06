import { useState, useEffect } from "react";
import { Search, Plus, Edit2, Trash2, Save, X, HelpCircle, Eye, MessageCircle, TrendingUp, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { CardSectionSkeleton, FormSkeleton } from "./AdminSkeletonLoaders";

interface FAQCategory {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  icon: string | null;
  is_active: boolean;
}

interface FAQ {
  id: string;
  category_id: string;
  question: string;
  answer: string;
  keywords: string[] | null;
  view_count: number;
  match_count: number;
  is_active: boolean;
  created_at: string;
}


const FAQ_COLOR_KEYS = [
  "blue",
  "red",
  "green",
  "yellow",
  "purple",
  "pink",
  "orange",
  "cyan",
  "amber",
  "violet",
  "emerald",
  "slate",
] as const;

const FAQ_COLOR_CLASSES: Record<
  (typeof FAQ_COLOR_KEYS)[number],
  { dot: string; badge: string }
> = {
  blue: {
    dot: "bg-blue-500",
    badge: "bg-blue-500/20 text-blue-700 border border-blue-500/30",
  },
  red: {
    dot: "bg-red-500",
    badge: "bg-red-500/20 text-red-700 border border-red-500/30",
  },
  green: {
    dot: "bg-green-500",
    badge: "bg-green-500/20 text-green-700 border border-green-500/30",
  },
  yellow: {
    dot: "bg-yellow-500",
    badge: "bg-yellow-500/20 text-yellow-700 border border-yellow-500/30",
  },
  purple: {
    dot: "bg-purple-500",
    badge: "bg-purple-500/20 text-purple-700 border border-purple-500/30",
  },
  pink: {
    dot: "bg-pink-500",
    badge: "bg-pink-500/20 text-pink-700 border border-pink-500/30",
  },
  orange: {
    dot: "bg-orange-500",
    badge: "bg-orange-500/20 text-orange-700 border border-orange-500/30",
  },
  cyan: {
    dot: "bg-cyan-500",
    badge: "bg-cyan-500/20 text-cyan-700 border border-cyan-500/30",
  },
  amber: {
    dot: "bg-amber-500",
    badge: "bg-amber-500/20 text-amber-700 border border-amber-500/30",
  },
  violet: {
    dot: "bg-violet-500",
    badge: "bg-violet-500/20 text-violet-700 border border-violet-500/30",
  },
  emerald: {
    dot: "bg-emerald-500",
    badge: "bg-emerald-500/20 text-emerald-700 border border-emerald-500/30",
  },
  slate: {
    dot: "bg-slate-500",
    badge: "bg-slate-500/20 text-slate-700 border border-slate-500/30",
  },
};
export function FAQManagement() {
  const [faqs, setFaqs] = useState<FAQ[]>([]);
  const [categories, setCategories] = useState<FAQCategory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [editingFaq, setEditingFaq] = useState<FAQ | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  
  // Form state
  const [formData, setFormData] = useState({
    question: "",
    answer: "",
    category_id: "",
    keywords: "",
    is_active: true,
  });

  const { toast } = useToast();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [{ data: faqsData, error: faqsError }, { data: categoriesData, error: categoriesError }] = await Promise.all([
        supabase.from("faqs").select("*").order("created_at", { ascending: false }),
        supabase.from("faq_categories").select("*").order("display_order"),
      ]);

      if (faqsError) throw faqsError;
      if (categoriesError) throw categoriesError;

      setFaqs(faqsData as FAQ[]);
      setCategories(categoriesData as FAQCategory[]);
    } catch (error) {
      console.error("Error fetching data:", error);
      toast({
        title: "Error",
        description: "Failed to fetch FAQs",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const filteredFaqs = faqs.filter((faq) => {
    const matchesSearch =
      faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      faq.answer.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === "all" || faq.category_id === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const getCategoryName = (categoryId: string) => {
    const category = categories.find((c) => c.id === categoryId);
    return category?.name || "Unknown";
  };

  const getCategoryById = (categoryId: string) => {
    return categories.find((c) => c.id === categoryId) || null;
  };

  const getCategoryColor = (categoryName?: string) => {
    if (!categoryName) return FAQ_COLOR_CLASSES.blue;
    const hash = categoryName
      .split("")
      .reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const key = FAQ_COLOR_KEYS[hash % FAQ_COLOR_KEYS.length];
    return FAQ_COLOR_CLASSES[key];
  };

  const handleOpenEdit = (faq?: FAQ) => {
    if (faq) {
      setEditingFaq(faq);
      setFormData({
        question: faq.question,
        answer: faq.answer,
        category_id: faq.category_id,
        keywords: faq.keywords?.join(", ") || "",
        is_active: faq.is_active,
      });
    } else {
      setEditingFaq(null);
      setFormData({
        question: "",
        answer: "",
        category_id: categories[0]?.id || "",
        keywords: "",
        is_active: true,
      });
    }
    setShowEditDialog(true);
  };

  const handleSave = async () => {
    if (!formData.question || !formData.answer || !formData.category_id) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    setIsSaving(true);
    try {
      const keywordsArray = formData.keywords
        .split(",")
        .map((k) => k.trim().toLowerCase())
        .filter((k) => k.length > 0);

      const faqData = {
        question: formData.question,
        answer: formData.answer,
        category_id: formData.category_id,
        keywords: keywordsArray,
        is_active: formData.is_active,
      };

      if (editingFaq) {
        const { error } = await supabase
          .from("faqs")
          .update(faqData)
          .eq("id", editingFaq.id);

        if (error) throw error;

        setFaqs((prev) =>
          prev.map((f) => (f.id === editingFaq.id ? { ...f, ...faqData } : f))
        );

        toast({
          title: "FAQ Updated",
          description: "The FAQ has been successfully updated",
        });
      } else {
        const { data, error } = await supabase
          .from("faqs")
          .insert(faqData)
          .select()
          .single();

        if (error) throw error;

        setFaqs((prev) => [data as FAQ, ...prev]);

        toast({
          title: "FAQ Created",
          description: "The FAQ has been successfully created",
        });
      }

      setShowEditDialog(false);
    } catch (error) {
      console.error("Error saving FAQ:", error);
      toast({
        title: "Error",
        description: "Failed to save FAQ",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!editingFaq) return;

    try {
      const { error } = await supabase
        .from("faqs")
        .delete()
        .eq("id", editingFaq.id);

      if (error) throw error;

      setFaqs((prev) => prev.filter((f) => f.id !== editingFaq.id));

      toast({
        title: "FAQ Deleted",
        description: "The FAQ has been successfully deleted",
      });

      setShowDeleteDialog(false);
      setEditingFaq(null);
    } catch (error) {
      console.error("Error deleting FAQ:", error);
      toast({
        title: "Error",
        description: "Failed to delete FAQ",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6 md:space-y-8 animate-fade-up">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <HelpCircle className="h-5 w-5 text-primary" />
            <h2 className="text-2xl md:text-3xl font-bold">FAQ Management</h2>
          </div>
          <p className="text-sm md:text-base text-muted-foreground">
            Create and manage frequently asked questions
          </p>
        </div>
        <Button className="bg-gradient-to-r from-primary to-primary/80 hover:shadow-lg transition-all rounded-lg h-10 whitespace-nowrap" onClick={() => handleOpenEdit()}>
          <Plus className="h-4 w-4 mr-2" />
          Add FAQ
        </Button>
      </div>

      

      {/* Filters Section */}
      <Card className="border-border/50 p-4 sm:p-6">
        <div className="space-y-4">
          <h3 className="font-semibold text-sm md:text-base">Filters</h3>
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search FAQs by question or answer..."
                className="pl-10 rounded-lg bg-secondary/50 border-border/50 focus:border-primary/50 transition-colors"
              />
            </div>
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-full sm:w-48 rounded-lg">
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map((cat) => (
                  <SelectItem key={cat.id} value={cat.id}>
                    <div className="flex items-center gap-2">
                      <span
                        className={cn(
                          "h-2.5 w-2.5 rounded-full",
                          getCategoryColor(cat.name).dot
                        )}
                      />
                      <span>{cat.name}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </Card>

      {/* FAQ List */}
      {isLoading ? (
        <div className="space-y-3 sm:space-y-4">
          <CardSectionSkeleton />
          <CardSectionSkeleton />
          <CardSectionSkeleton />
          <CardSectionSkeleton />
          <CardSectionSkeleton />
        </div>
      ) : (
        <div>
          {filteredFaqs.length === 0 ? (
            <Card className="border-border/50">
              <CardContent className="py-12 sm:py-16 text-center">
                <div className="flex flex-col items-center gap-3">
                  <HelpCircle className="h-8 w-8 text-muted-foreground/50" />
                  <div>
                    <p className="font-medium text-muted-foreground">No FAQs found</p>
                    <p className="text-sm text-muted-foreground mt-1">Create your first FAQ to get started</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3 sm:space-y-4">
              {filteredFaqs.map((faq) => (
                <Card key={faq.id} className="border-border/50 hover:shadow-lg transition-all duration-300 group">
                  <CardContent className="p-4 sm:p-6">
                    <div className="space-y-3">
                      {/* Header with badges */}
                      <div className="flex items-start justify-between gap-4">
                        {(() => {
                          const category = getCategoryById(faq.category_id);
                          const categoryName = category?.name || "Unknown";
                          const categoryColor = getCategoryColor(categoryName);
                          return (
                            <div className="flex items-center gap-2 flex-wrap">
                              <Badge
                                className={cn(
                                  "text-xs sm:text-xs",
                                  categoryColor.badge
                                )}
                              >
                                <span
                                  className={cn(
                                    "h-2 w-2 rounded-full mr-1.5",
                                    categoryColor.dot
                                  )}
                                />
                                {categoryName}
                              </Badge>
                              {!faq.is_active && (
                                <Badge variant="outline" className="text-xs text-muted-foreground">
                                  Inactive
                                </Badge>
                              )}
                            </div>
                          );
                        })()}
                        <div className="flex gap-2 shrink-0">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 hover:bg-accent"
                            onClick={() => handleOpenEdit(faq)}
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive hover:bg-destructive/10"
                            onClick={() => {
                              setEditingFaq(faq);
                              setShowDeleteDialog(true);
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>

                      {/* Question */}
                      <div>
                        <h3 className="font-semibold text-sm sm:text-base leading-tight group-hover:text-primary transition-colors">
                          {faq.question}
                        </h3>
                      </div>

                      {/* Answer Preview */}
                      <p className="text-xs sm:text-sm text-muted-foreground line-clamp-2">
                        {faq.answer}
                      </p>

                      {/* Keywords */}
                      {faq.keywords && faq.keywords.length > 0 && (
                        <div className="flex gap-2 flex-wrap pt-2">
                          {faq.keywords.slice(0, 4).map((keyword) => (
                            <Badge key={keyword} variant="outline" className="text-[10px] sm:text-xs">
                              {keyword}
                            </Badge>
                          ))}
                          {faq.keywords.length > 4 && (
                            <Badge variant="outline" className="text-[10px] sm:text-xs">
                              +{faq.keywords.length - 4} more
                            </Badge>
                          )}
                        </div>
                      )}

                      {/* Stats Footer */}
                      <div className="flex gap-4 text-xs text-muted-foreground border-t border-border/30 pt-3 mt-3">
                        <div className="flex items-center gap-1">
                          <Eye className="h-3 w-3" />
                          <span>{faq.view_count.toLocaleString()} views</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <MessageCircle className="h-3 w-3" />
                          <span>{faq.match_count.toLocaleString()} matches</span>
                        </div>
                        <span>{new Date(faq.created_at).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Edit/Create Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editingFaq ? "Edit FAQ" : "Create New FAQ"}</DialogTitle>
            <DialogDescription>
              {editingFaq ? "Update the FAQ details below" : "Fill in the details to create a new FAQ"}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="category">Category *</Label>
              <Select
                value={formData.category_id}
                onValueChange={(value) => setFormData((prev) => ({ ...prev, category_id: value }))}
              >
                <SelectTrigger className="rounded-xl">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>
                      <div className="flex items-center gap-2">
                        <span
                          className={cn(
                            "h-2.5 w-2.5 rounded-full",
                            getCategoryColor(cat.name).dot
                          )}
                        />
                        <span>{cat.name}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="question">Question *</Label>
              <Input
                id="question"
                value={formData.question}
                onChange={(e) => setFormData((prev) => ({ ...prev, question: e.target.value }))}
                placeholder="Enter the question"
                className="rounded-xl"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="answer">Answer *</Label>
              <Textarea
                id="answer"
                value={formData.answer}
                onChange={(e) => setFormData((prev) => ({ ...prev, answer: e.target.value }))}
                placeholder="Enter the answer"
                className="min-h-32 rounded-xl"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="keywords">Keywords (comma-separated)</Label>
              <Input
                id="keywords"
                value={formData.keywords}
                onChange={(e) => setFormData((prev) => ({ ...prev, keywords: e.target.value }))}
                placeholder="e.g., internship, ojt, requirements"
                className="rounded-xl"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditDialog(false)} className="rounded-xl">
              <X className="h-4 w-4 mr-2" />
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={isSaving} className="bg-gradient-primary rounded-xl">
              {isSaving ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              {editingFaq ? "Update FAQ" : "Create FAQ"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete FAQ?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the FAQ.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90 rounded-xl"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}




