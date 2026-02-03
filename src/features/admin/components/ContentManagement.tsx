import { useState } from "react";
import {
  FileText,
  FolderOpen,
  Plus,
  Upload,
  Trash2,
  Download,
  Eye,
  FileImage,
  FileVideo,
  File,
  Search,
  Grid,
  List,
  HardDrive,
  Clock,
  CheckCircle,
  ChevronDown,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

interface ContentItem {
  id: string;
  name: string;
  type: "document" | "image" | "video" | "other";
  size: string;
  uploadedAt: string;
  category: string;
}

// Mock content for demonstration
const mockContent: ContentItem[] = [
  { id: "1", name: "Student Handbook 2024.pdf", type: "document", size: "2.4 MB", uploadedAt: "2024-01-15", category: "Course Materials" },
  { id: "2", name: "CBA Fair Banner.png", type: "image", size: "850 KB", uploadedAt: "2024-01-14", category: "Announcements" },
  { id: "3", name: "Org Shirt Design.jpg", type: "image", size: "1.2 MB", uploadedAt: "2024-01-12", category: "Announcements" },
  { id: "4", name: "Internship Guidelines.docx", type: "document", size: "156 KB", uploadedAt: "2024-01-10", category: "Course Materials" },
  { id: "5", name: "Welcome Video.mp4", type: "video", size: "45 MB", uploadedAt: "2024-01-08", category: "Resources" },
];

const categories = ["All", "Course Materials", "Announcements", "Student Submissions", "Resources"];

export function ContentManagement() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [viewMode, setViewMode] = useState<"grid" | "list">("list");
  const [content] = useState<ContentItem[]>(mockContent);
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);

  const filteredContent = content.filter((item) => {
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === "All" || item.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const getCategoryCount = (category: string) => {
    if (category === "All") return content.length;
    return content.filter((item) => item.category === category).length;
  };

  const getFileIcon = (type: string) => {
    switch (type) {
      case "image":
        return FileImage;
      case "video":
        return FileVideo;
      case "document":
        return FileText;
      default:
        return File;
    }
  };

  const getFileColor = (type: string) => {
    switch (type) {
      case "image":
        return "text-green-500 bg-green-500/10";
      case "video":
        return "text-purple-500 bg-purple-500/10";
      case "document":
        return "text-blue-500 bg-blue-500/10";
      default:
        return "text-muted-foreground bg-muted";
    }
  };

  return (
    <div className="w-full space-y-3 md:space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 md:gap-4">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <FileText className="h-5 w-5 text-primary" />
              <h2 className="text-xl md:text-3xl font-bold">Content</h2>
            </div>
            <p className="text-xs md:text-base text-muted-foreground">
              Manage documents, images & resources
            </p>
          </div>
          <Button size="sm" className="bg-gradient-to-r from-primary to-primary/80 hover:shadow-lg rounded-lg gap-1 shrink-0 h-9 md:h-10">
            <Upload className="h-4 w-4" />
            <span className="hidden sm:inline">Upload</span>
          </Button>
        </div>

        {/* Quick Stats - Horizontal scroll on mobile */}
        <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0 md:grid md:grid-cols-4">
          <Card className="flex-shrink-0 w-[calc(50%-4px)] md:w-auto border-border/50 bg-gradient-to-br from-blue-500/20 to-blue-600/20 p-3 md:p-6">
            <div className="space-y-1">
              <p className="text-[11px] md:text-sm text-muted-foreground font-medium">Total</p>
              <p className="text-lg md:text-2xl font-bold">{content.length}</p>
            </div>
          </Card>
          <Card className="flex-shrink-0 w-[calc(50%-4px)] md:w-auto border-border/50 bg-gradient-to-br from-green-500/20 to-green-600/20 p-3 md:p-6">
            <div className="space-y-1">
              <p className="text-[11px] md:text-sm text-muted-foreground font-medium">Docs</p>
              <p className="text-lg md:text-2xl font-bold text-green-600 dark:text-green-400">
                {content.filter(f => f.type === "document").length}
              </p>
            </div>
          </Card>
          <Card className="flex-shrink-0 w-[calc(50%-4px)] md:w-auto border-border/50 bg-gradient-to-br from-purple-500/20 to-purple-600/20 p-3 md:p-6">
            <div className="space-y-1">
              <p className="text-[11px] md:text-sm text-muted-foreground font-medium">Media</p>
              <p className="text-lg md:text-2xl font-bold text-purple-600 dark:text-purple-400">
                {content.filter(f => f.type === "image" || f.type === "video").length}
              </p>
            </div>
          </Card>
          <Card className="flex-shrink-0 w-[calc(50%-4px)] md:w-auto border-border/50 bg-gradient-to-br from-amber-500/20 to-amber-600/20 p-3 md:p-6">
            <div className="space-y-1">
              <p className="text-[11px] md:text-sm text-muted-foreground font-medium">Size</p>
              <p className="text-lg md:text-2xl font-bold text-amber-600 dark:text-amber-400">94.6 MB</p>
            </div>
          </Card>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search files..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-9 h-10 text-sm rounded-lg bg-secondary/50 border-border/50 focus:border-primary/50 transition-colors"
        />
      </div>

      {/* Categories - Desktop Buttons / Mobile Dropdown */}
      <div className="space-y-2">
        <p className="text-xs font-semibold text-muted-foreground px-1">CATEGORIES</p>
        {/* Desktop View - Button Grid */}
        <div className="hidden sm:grid grid-cols-3 md:grid-cols-5 gap-2">
          {categories.map((cat) => (
            <Button
              key={cat}
              variant={selectedCategory === cat ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedCategory(cat)}
              className="text-xs h-9 rounded-lg transition-all"
            >
              {cat}
              <Badge variant="secondary" className="ml-1 h-5 min-w-5 flex items-center justify-center text-[10px] p-0">
                {getCategoryCount(cat)}
              </Badge>
            </Button>
          ))}
        </div>
        
        {/* Mobile View - Dropdown */}
        <div className="sm:hidden">
          <button
            onClick={() => setExpandedCategory(expandedCategory ? null : "categories")}
            className="w-full flex items-center justify-between px-3 py-2 rounded-lg bg-secondary/50 border border-border/50 hover:border-primary/50 transition-colors text-sm"
          >
            <span className="font-medium">
              {selectedCategory}
              <Badge variant="secondary" className="ml-2 h-5 min-w-5 inline-flex items-center justify-center text-[10px] p-0">
                {getCategoryCount(selectedCategory)}
              </Badge>
            </span>
            <ChevronDown className={`h-4 w-4 transition-transform ${expandedCategory === "categories" ? "rotate-180" : ""}`} />
          </button>
          
          {expandedCategory === "categories" && (
            <div className="mt-2 rounded-lg border border-border/50 bg-secondary/50 overflow-hidden">
              {categories.map((cat, idx) => (
                <button
                  key={cat}
                  onClick={() => {
                    setSelectedCategory(cat);
                    setExpandedCategory(null);
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2.5 text-sm transition-colors ${
                    selectedCategory === cat
                      ? "bg-primary/10 text-primary font-medium"
                      : "hover:bg-accent/50 text-foreground"
                  } ${idx !== categories.length - 1 ? "border-b border-border/30" : ""}`}
                >
                  <span>{cat}</span>
                  <Badge variant="secondary" className="text-[10px] h-5 min-w-5 flex items-center justify-center p-0">
                    {getCategoryCount(cat)}
                  </Badge>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* View Toggle */}
      <div className="flex gap-2 md:justify-end">
        <Button
          variant={viewMode === "grid" ? "default" : "outline"}
          size="sm"
          onClick={() => setViewMode("grid")}
          className="flex-1 md:flex-initial gap-2 text-xs h-9"
        >
          <Grid className="h-4 w-4" />
          <span>Grid</span>
        </Button>
        <Button
          variant={viewMode === "list" ? "default" : "outline"}
          size="sm"
          onClick={() => setViewMode("list")}
          className="flex-1 md:flex-initial gap-2 text-xs h-9"
        >
          <List className="h-4 w-4" />
          <span>List</span>
        </Button>
      </div>

      {/* Files Section */}
      {filteredContent.length === 0 ? (
        <Card className="border-border/50">
          <CardContent className="py-12 text-center">
            <FolderOpen className="h-10 w-10 mx-auto mb-3 opacity-50" />
            <p className="font-medium text-sm">No files found</p>
            <p className="text-xs text-muted-foreground mt-1">Upload files to get started</p>
          </CardContent>
        </Card>
      ) : viewMode === "list" ? (
        <div className="space-y-2">
          {filteredContent.map((item) => {
            const Icon = getFileIcon(item.type);
            return (
              <Card key={item.id} className="border-border/50 hover:shadow-sm transition-all">
                <CardContent className="p-3 md:p-4">
                  <div className="flex items-center gap-3">
                    <div className={cn("h-10 w-10 rounded-lg flex items-center justify-center shrink-0", getFileColor(item.type))}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{item.name}</p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                        <span>{item.size}</span>
                        <span>•</span>
                        <span>{item.uploadedAt}</span>
                      </div>
                    </div>
                    <Badge variant="secondary" className="text-xs shrink-0 hidden sm:block">
                      {item.category}
                    </Badge>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {filteredContent.map((item) => {
            const Icon = getFileIcon(item.type);
            return (
              <Card key={item.id} className="border-border/50 hover:shadow-md transition-all group cursor-pointer">
                <CardContent className="p-3">
                  <div className={cn("h-16 rounded-lg flex items-center justify-center mb-2", getFileColor(item.type))}>
                    <Icon className="h-6 w-6" />
                  </div>
                  <p className="text-xs font-medium truncate">{item.name}</p>
                  <p className="text-[10px] text-muted-foreground mt-1">{item.size}</p>
                  <div className="flex gap-1 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button variant="ghost" size="icon" className="h-6 w-6">
                      <Eye className="h-3 w-3" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive">
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Upload Zone */}
      <Card className="border-2 border-dashed border-border/50 hover:border-primary/50 transition-colors cursor-pointer">
        <CardContent className="py-8 md:py-10 text-center">
          <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
          <p className="text-sm font-medium">Drag & drop or click</p>
          <p className="text-xs text-muted-foreground mt-1">Max 10MB per file</p>
        </CardContent>
      </Card>
    </div>
  );
}
