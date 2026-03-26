import { useState, useEffect } from "react";
import {
  Plus,
  Edit2,
  Trash2,
  Loader2,
  Save,
  X,
  Tags,
  Eye,
  EyeOff,
  AlertTriangle,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { CardSectionSkeleton } from "./AdminSkeletonLoaders";

interface FAQCategory {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  icon: string | null;
  display_order: number;
  is_active: boolean;
}

interface AnnouncementCategory {
  id: string;
  name: string;
  color: string | null;
  created_at: string;
}

const COLOR_OPTIONS = [
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
];


const ANNOUNCEMENT_COLOR_CLASSES: Record<
  string,
  { swatch: string; dot: string; badge: string }
> = {
  blue: {
    swatch: "bg-blue-500",
    dot: "bg-blue-500",
    badge: "bg-blue-500/20 text-blue-700 border border-blue-500/30",
  },
  red: {
    swatch: "bg-red-500",
    dot: "bg-red-500",
    badge: "bg-red-500/20 text-red-700 border border-red-500/30",
  },
  green: {
    swatch: "bg-green-500",
    dot: "bg-green-500",
    badge: "bg-green-500/20 text-green-700 border border-green-500/30",
  },
  yellow: {
    swatch: "bg-yellow-500",
    dot: "bg-yellow-500",
    badge: "bg-yellow-500/20 text-yellow-700 border border-yellow-500/30",
  },
  purple: {
    swatch: "bg-purple-500",
    dot: "bg-purple-500",
    badge: "bg-purple-500/20 text-purple-700 border border-purple-500/30",
  },
  pink: {
    swatch: "bg-pink-500",
    dot: "bg-pink-500",
    badge: "bg-pink-500/20 text-pink-700 border border-pink-500/30",
  },
  orange: {
    swatch: "bg-orange-500",
    dot: "bg-orange-500",
    badge: "bg-orange-500/20 text-orange-700 border border-orange-500/30",
  },
  cyan: {
    swatch: "bg-cyan-500",
    dot: "bg-cyan-500",
    badge: "bg-cyan-500/20 text-cyan-700 border border-cyan-500/30",
  },
  amber: {
    swatch: "bg-amber-500",
    dot: "bg-amber-500",
    badge: "bg-amber-500/20 text-amber-700 border border-amber-500/30",
  },
  violet: {
    swatch: "bg-violet-500",
    dot: "bg-violet-500",
    badge: "bg-violet-500/20 text-violet-700 border border-violet-500/30",
  },
  emerald: {
    swatch: "bg-emerald-500",
    dot: "bg-emerald-500",
    badge: "bg-emerald-500/20 text-emerald-700 border border-emerald-500/30",
  },
  slate: {
    swatch: "bg-slate-500",
    dot: "bg-slate-500",
    badge: "bg-slate-500/20 text-slate-700 border border-slate-500/30",
  },
};

const getAnnouncementColorClasses = (color: string | null | undefined) => {
  const key = color || "blue";
  return ANNOUNCEMENT_COLOR_CLASSES[key] || ANNOUNCEMENT_COLOR_CLASSES.blue;
};
const LUCIDE_ICONS = [
  "Briefcase",
  "BookOpen",
  "Users",
  "Zap",
  "Heart",
  "Shield",
  "Lightbulb",
  "Rocket",
  "Award",
  "Code",
  "Layers",
  "Puzzle",
];

export function CategoriesManagement() {
  // FAQ Categories state
  const [faqCategories, setFaqCategories] = useState<FAQCategory[]>([]);
  const [announcementCategories, setAnnouncementCategories] = useState<
    AnnouncementCategory[]
  >([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showFaqDialog, setShowFaqDialog] = useState(false);
  const [showAnnouncementDialog, setShowAnnouncementDialog] = useState(false);
  const [editingFaqCategory, setEditingFaqCategory] =
    useState<FAQCategory | null>(null);
  const [editingAnnouncementCategory, setEditingAnnouncementCategory] =
    useState<AnnouncementCategory | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleteType, setDeleteType] = useState<"faq" | "announcement" | null>(
    null
  );
  const [isSaving, setIsSaving] = useState(false);

  // FAQ Form state
  const [faqFormData, setFaqFormData] = useState({
    name: "",
    description: "",
    icon: "",
    display_order: 0,
    is_active: true,
  });

  // Announcement Form state
  const [announcementFormData, setAnnouncementFormData] = useState({
    name: "",
    color: "blue",
  });

  const { toast } = useToast();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [faqCatsResult, announcementCatsResult] = await Promise.all([
        supabase.from("faq_categories").select("*").order("display_order"),
        supabase
          .from("announcement_categories")
          .select("*")
          .order("name"),
      ]);

      if (faqCatsResult.error) throw faqCatsResult.error;
      if (announcementCatsResult.error) throw announcementCatsResult.error;

      setFaqCategories(faqCatsResult.data || []);
      setAnnouncementCategories(announcementCatsResult.data || []);
    } catch (error) {
      console.error("Error fetching categories:", error);
      toast({
        title: "Error",
        description: "Failed to fetch categories",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // FAQ Category Handlers
  const handleOpenFaqEdit = (category?: FAQCategory) => {
    if (category) {
      setEditingFaqCategory(category);
      setFaqFormData({
        name: category.name,
        description: category.description || "",
        icon: category.icon || "",
        display_order: category.display_order,
        is_active: category.is_active,
      });
    } else {
      setEditingFaqCategory(null);
      setFaqFormData({
        name: "",
        description: "",
        icon: "",
        display_order: faqCategories.length,
        is_active: true,
      });
    }
    setShowFaqDialog(true);
  };

  const generateSlug = (text: string) => {
    return text
      .toLowerCase()
      .replace(/\s+/g, "-")
      .replace(/[^\w-]/g, "");
  };

  const handleSaveFaqCategory = async () => {
    if (!faqFormData.name.trim()) {
      toast({
        title: "Validation Error",
        description: "Category name is required",
        variant: "destructive",
      });
      return;
    }

    setIsSaving(true);
    try {
      // Auto-generate slug from name
      const slug = generateSlug(faqFormData.name);

      const data = {
        name: faqFormData.name,
        slug,
        description: faqFormData.description.trim() || null,
        icon: faqFormData.icon || null,
        display_order: faqFormData.display_order,
        is_active: faqFormData.is_active,
      };

      if (editingFaqCategory) {
        const { error } = await supabase
          .from("faq_categories")
          .update(data)
          .eq("id", editingFaqCategory.id);

        if (error) throw error;

        setFaqCategories((prev) =>
          prev.map((c) =>
            c.id === editingFaqCategory.id ? { ...c, ...data } : c
          )
        );

        toast({
          title: "Success",
          description: "FAQ category updated successfully",
        });
      } else {
        const { data: newCategory, error } = await supabase
          .from("faq_categories")
          .insert(data)
          .select()
          .single();

        if (error) throw error;

        setFaqCategories((prev) => [...prev, newCategory as FAQCategory]);

        toast({
          title: "Success",
          description: "FAQ category created successfully",
        });
      }

      setShowFaqDialog(false);
    } catch (error) {
      console.error("Error saving FAQ category:", error);
      toast({
        title: "Error",
        description: "Failed to save FAQ category",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Announcement Category Handlers
  const handleOpenAnnouncementEdit = (category?: AnnouncementCategory) => {
    if (category) {
      setEditingAnnouncementCategory(category);
      setAnnouncementFormData({
        name: category.name,
        color: category.color || "blue",
      });
    } else {
      setEditingAnnouncementCategory(null);
      setAnnouncementFormData({
        name: "",
        color: "blue",
      });
    }
    setShowAnnouncementDialog(true);
  };

  const handleSaveAnnouncementCategory = async () => {
    if (!announcementFormData.name.trim()) {
      toast({
        title: "Validation Error",
        description: "Category name is required",
        variant: "destructive",
      });
      return;
    }

    setIsSaving(true);
    try {
      const data = {
        name: announcementFormData.name,
        color: announcementFormData.color,
      };

      if (editingAnnouncementCategory) {
        const { error } = await supabase
          .from("announcement_categories")
          .update(data)
          .eq("id", editingAnnouncementCategory.id);

        if (error) throw error;

        setAnnouncementCategories((prev) =>
          prev.map((c) =>
            c.id === editingAnnouncementCategory.id ? { ...c, ...data } : c
          )
        );

        toast({
          title: "Success",
          description: "Announcement category updated successfully",
        });
      } else {
        const { data: newCategory, error } = await supabase
          .from("announcement_categories")
          .insert(data)
          .select()
          .single();

        if (error) throw error;

        setAnnouncementCategories((prev) => [
          ...prev,
          newCategory as AnnouncementCategory,
        ]);

        toast({
          title: "Success",
          description: "Announcement category created successfully",
        });
      }

      setShowAnnouncementDialog(false);
    } catch (error) {
      console.error("Error saving announcement category:", error);
      toast({
        title: "Error",
        description: "Failed to save announcement category",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteCategory = async () => {
    if (!deleteType) return;

    try {
      if (deleteType === "faq" && editingFaqCategory) {
        const { error } = await supabase
          .from("faq_categories")
          .delete()
          .eq("id", editingFaqCategory.id);

        if (error) throw error;

        setFaqCategories((prev) =>
          prev.filter((c) => c.id !== editingFaqCategory.id)
        );

        toast({
          title: "Success",
          description: "FAQ category deleted successfully",
        });
      } else if (deleteType === "announcement" && editingAnnouncementCategory) {
        const { error } = await supabase
          .from("announcement_categories")
          .delete()
          .eq("id", editingAnnouncementCategory.id);

        if (error) throw error;

        setAnnouncementCategories((prev) =>
          prev.filter((c) => c.id !== editingAnnouncementCategory.id)
        );

        toast({
          title: "Success",
          description: "Announcement category deleted successfully",
        });
      }

      setShowDeleteDialog(false);
      setDeleteType(null);
      setEditingFaqCategory(null);
      setEditingAnnouncementCategory(null);
    } catch (error) {
      console.error("Error deleting category:", error);
      toast({
        title: "Error",
        description: "Failed to delete category",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6 md:space-y-8">
        <CardSectionSkeleton />
        <CardSectionSkeleton />
        <CardSectionSkeleton />
      </div>
    );
  }

  return (
    <div className="space-y-6 md:space-y-8 animate-fade-up">
      {/* Header Section */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Tags className="h-5 w-5 md:h-6 md:w-6 text-primary" />
          <h2 className="text-2xl md:text-3xl font-bold">
            Categories Management
          </h2>
        </div>
        <p className="text-sm md:text-base text-muted-foreground">
          Manage FAQ and announcement categories
        </p>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="faq" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2 h-auto p-1 gap-1">
          <TabsTrigger value="faq" className="text-xs sm:text-sm leading-tight px-2 py-2 whitespace-normal">FAQ Categories</TabsTrigger>
          <TabsTrigger value="announcement" className="text-xs sm:text-sm leading-tight px-2 py-2 whitespace-normal">Announcement Categories</TabsTrigger>
        </TabsList>

        {/* FAQ Categories Tab */}
        <TabsContent value="faq" className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <h3 className="text-lg font-semibold">FAQ Categories</h3>
            <Button
              onClick={() => handleOpenFaqEdit()}
              className="w-full sm:w-auto bg-gradient-to-r from-primary to-primary/80 hover:shadow-lg transition-all rounded-lg"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add FAQ Category
            </Button>
          </div>

          {faqCategories.length === 0 ? (
            <Card className="border-border/50">
              <CardContent className="py-12 sm:py-16 text-center">
                <div className="flex flex-col items-center gap-3">
                  <Tags className="h-8 w-8 text-muted-foreground/50" />
                  <div>
                    <p className="font-medium text-muted-foreground">
                      No FAQ categories found
                    </p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Create your first FAQ category to get started
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {faqCategories.map((category) => (
                <Card
                  key={category.id}
                  className="border-border/50 hover:shadow-lg transition-all group"
                >
                  <CardContent className="p-4 sm:p-6">
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center gap-2">
                          <h4 className="font-semibold text-base">
                            {category.name}
                          </h4>
                          {!category.is_active && (
                            <Badge variant="outline" className="text-xs">
                              Inactive
                            </Badge>
                          )}
                        </div>
                        {category.description && (
                          <p className="text-sm text-muted-foreground">
                            {category.description}
                          </p>
                        )}
                        <div className="flex gap-3 pt-2 flex-wrap text-xs text-muted-foreground">
                          {category.icon && (
                            <span>Icon: {category.icon}</span>
                          )}
                          <span>
                            Display Order: {category.display_order}
                          </span>
                        </div>
                      </div>
                      <div className="flex gap-2 shrink-0 self-end sm:self-auto">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-9 w-9 hover:bg-accent"
                          onClick={() => handleOpenFaqEdit(category)}
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-9 w-9 text-destructive hover:bg-destructive/10"
                          onClick={() => {
                            setEditingFaqCategory(category);
                            setDeleteType("faq");
                            setShowDeleteDialog(true);
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Announcement Categories Tab */}
        <TabsContent value="announcement" className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <h3 className="text-lg font-semibold">Announcement Categories</h3>
            <Button
              onClick={() => handleOpenAnnouncementEdit()}
              className="w-full sm:w-auto bg-gradient-to-r from-primary to-primary/80 hover:shadow-lg transition-all rounded-lg"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Announcement Category
            </Button>
          </div>

          {announcementCategories.length === 0 ? (
            <Card className="border-border/50">
              <CardContent className="py-12 sm:py-16 text-center">
                <div className="flex flex-col items-center gap-3">
                  <Tags className="h-8 w-8 text-muted-foreground/50" />
                  <div>
                    <p className="font-medium text-muted-foreground">
                      No announcement categories found
                    </p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Create your first announcement category to get started
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {announcementCategories.map((category) => (
                <Card
                  key={category.id}
                  className="border-border/50 hover:shadow-lg transition-all group"
                >
                  <CardContent className="p-4 sm:p-6">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                      <div className="flex items-center gap-3 flex-1 w-full">
                        <div
                          className={cn(
                            "w-4 h-4 rounded-full",
                            getAnnouncementColorClasses(category.color).dot
                          )}
                        />
                        <h4 className="font-semibold text-base">
                          {category.name}
                        </h4>
                        <Badge variant="outline" className="text-xs">
                          {category.color}
                        </Badge>
                      </div>
                      <div className="flex gap-2 shrink-0 self-end sm:self-auto">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-9 w-9 hover:bg-accent"
                          onClick={() => handleOpenAnnouncementEdit(category)}
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-9 w-9 text-destructive hover:bg-destructive/10"
                          onClick={() => {
                            setEditingAnnouncementCategory(category);
                            setDeleteType("announcement");
                            setShowDeleteDialog(true);
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* FAQ Category Dialog */}
      <Dialog open={showFaqDialog} onOpenChange={setShowFaqDialog}>
        <DialogContent className="max-w-[95vw] sm:max-w-2xl max-h-[90vh] overflow-y-auto p-4 sm:p-6">
          <DialogHeader>
            <DialogTitle>
              {editingFaqCategory
                ? "Edit FAQ Category"
                : "Create New FAQ Category"}
            </DialogTitle>
            <DialogDescription>
              {editingFaqCategory
                ? "Update the FAQ category details"
                : "Fill in the details to create a new FAQ category"}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-5">
            <div className="space-y-2.5">
              <Label htmlFor="faq-name">Category Name *</Label>
              <Input
                id="faq-name"
                value={faqFormData.name}
                onChange={(e) => {
                  setFaqFormData((prev) => ({
                    ...prev,
                    name: e.target.value,
                  }));
                }}
                placeholder="e.g., Internship, Admission, Academic"
                className="rounded-xl h-10"
              />
              <p className="text-xs text-muted-foreground mt-1">
                * Required field
              </p>
            </div>

            <div className="space-y-2.5">
              <Label htmlFor="faq-description">Description (Optional)</Label>
              <Textarea
                id="faq-description"
                value={faqFormData.description}
                onChange={(e) =>
                  setFaqFormData((prev) => ({
                    ...prev,
                    description: e.target.value,
                  }))
                }
                placeholder="Add a detailed description for this category"
                className="min-h-28 rounded-xl resize-none"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Leave blank if not needed
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
              <div className="space-y-2.5">
                <Label htmlFor="faq-icon">Icon (Optional)</Label>
                <Select
                  value={faqFormData.icon || "default"}
                  onValueChange={(value) =>
                    setFaqFormData((prev) => ({ 
                      ...prev, 
                      icon: value === "default" ? "" : value 
                    }))
                  }
                >
                  <SelectTrigger className="rounded-xl h-10">
                    <SelectValue placeholder="Choose icon" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="default">No Icon</SelectItem>
                    {LUCIDE_ICONS.map((icon) => (
                      <SelectItem key={icon} value={icon}>
                        {icon}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2.5">
                <Label htmlFor="faq-order">Display Order</Label>
                <Input
                  id="faq-order"
                  type="number"
                  value={faqFormData.display_order}
                  onChange={(e) =>
                    setFaqFormData((prev) => ({
                      ...prev,
                      display_order: parseInt(e.target.value) || 0,
                    }))
                  }
                  className="rounded-xl h-10"
                />
              </div>
            </div>

            <div className="flex items-center gap-3 p-4 bg-secondary/50 rounded-lg mt-2">
              <input
                type="checkbox"
                id="faq-active"
                checked={faqFormData.is_active}
                onChange={(e) =>
                  setFaqFormData((prev) => ({
                    ...prev,
                    is_active: e.target.checked,
                  }))
                }
                className="rounded w-4 h-4 cursor-pointer"
              />
              <Label htmlFor="faq-active" className="cursor-pointer text-sm flex-1">
                Active (show in menus)
              </Label>
            </div>
          </div>

          <DialogFooter className="flex-col-reverse sm:flex-row gap-3 mt-8 pt-6 border-t border-border/20">
            <Button
              variant="outline"
              onClick={() => setShowFaqDialog(false)}
              className="w-full sm:w-auto rounded-xl h-10"
            >
              <X className="h-4 w-4 mr-2" />
              Cancel
            </Button>
            <Button
              onClick={handleSaveFaqCategory}
              disabled={isSaving}
              className="w-full sm:w-auto bg-gradient-to-r from-primary to-primary/80 rounded-xl h-10"
            >
              {isSaving ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              {editingFaqCategory ? "Update Category" : "Create Category"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Announcement Category Dialog */}
      <Dialog
        open={showAnnouncementDialog}
        onOpenChange={setShowAnnouncementDialog}
      >
        <DialogContent className="max-w-[95vw] sm:max-w-xl max-h-[90vh] overflow-y-auto p-4 sm:p-6">
          <DialogHeader>
            <DialogTitle>
              {editingAnnouncementCategory
                ? "Edit Announcement Category"
                : "Create New Announcement Category"}
            </DialogTitle>
            <DialogDescription>
              {editingAnnouncementCategory
                ? "Update the announcement category details"
                : "Fill in the details to create a new announcement category"}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-5">
            <div className="space-y-2.5">
              <Label htmlFor="announcement-name">Category Name *</Label>
              <Input
                id="announcement-name"
                value={announcementFormData.name}
                onChange={(e) =>
                  setAnnouncementFormData((prev) => ({
                    ...prev,
                    name: e.target.value,
                  }))
                }
                placeholder="e.g., Events, Academic, Facilities"
                className="rounded-xl h-10"
              />
            </div>

            <div className="space-y-3">
              <Label>Category Color</Label>
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                {COLOR_OPTIONS.map((color) => (
                  <button
                    key={color}
                    onClick={() =>
                      setAnnouncementFormData((prev) => ({
                        ...prev,
                        color,
                      }))
                    }
                    className={cn(
                      "h-10 rounded-lg border-2 transition-all",
                      announcementFormData.color === color
                        ? "border-foreground scale-105"
                        : "border-transparent opacity-50 hover:opacity-100",
                      getAnnouncementColorClasses(color).swatch
                    )}
                    title={color}
                  />
                ))}
              </div>
            </div>

            {announcementFormData.color && (
              <div className="p-4 bg-secondary/50 rounded-lg border border-border/30 mt-3">
                <p className="text-sm text-muted-foreground mb-2">Preview:</p>
                <span className={cn(
                  "inline-block px-4 py-2 rounded-lg text-sm font-medium",
                  getAnnouncementColorClasses(announcementFormData.color).badge
                )}>
                  {announcementFormData.name || "Category"}
                </span>
              </div>
            )}
          </div>

          <DialogFooter className="flex-col-reverse sm:flex-row gap-3 mt-8 pt-6 border-t border-border/20">
            <Button
              variant="outline"
              onClick={() => setShowAnnouncementDialog(false)}
              className="w-full sm:w-auto rounded-xl h-10"
            >
              <X className="h-4 w-4 mr-2" />
              Cancel
            </Button>
            <Button
              onClick={handleSaveAnnouncementCategory}
              disabled={isSaving}
              className="w-full sm:w-auto bg-gradient-to-r from-primary to-primary/80 rounded-xl h-10"
            >
              {isSaving ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              {editingAnnouncementCategory ? "Update Category" : "Create Category"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Category?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the
              category. Make sure there are no items using this category before
              deleting.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteCategory}
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




