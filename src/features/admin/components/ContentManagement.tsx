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
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

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
  { id: "1", name: "Student Handbook 2024.pdf", type: "document", size: "2.4 MB", uploadedAt: "2024-01-15", category: "Documents" },
  { id: "2", name: "CBA Fair Banner.png", type: "image", size: "850 KB", uploadedAt: "2024-01-14", category: "Images" },
  { id: "3", name: "Org Shirt Design.jpg", type: "image", size: "1.2 MB", uploadedAt: "2024-01-12", category: "Images" },
  { id: "4", name: "Internship Guidelines.docx", type: "document", size: "156 KB", uploadedAt: "2024-01-10", category: "Documents" },
  { id: "5", name: "Welcome Video.mp4", type: "video", size: "45 MB", uploadedAt: "2024-01-08", category: "Videos" },
];

const categories = ["All", "Documents", "Images", "Videos", "Forms"];

export function ContentManagement() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [content] = useState<ContentItem[]>(mockContent);

  const filteredContent = content.filter((item) => {
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === "All" || item.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

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
    <div className="space-y-4 md:space-y-6">
      <Card className="border-border/50">
        <CardHeader className="pb-3 md:pb-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 md:gap-4">
            <div>
              <CardTitle className="text-base md:text-lg flex items-center gap-2">
                <FileText className="h-4 w-4 md:h-5 md:w-5" />
                Content Management
              </CardTitle>
              <CardDescription className="text-xs md:text-sm mt-1">
                Manage documents, images, and resources for students
              </CardDescription>
            </div>
            <Button size="sm" className="bg-gradient-primary border-0 w-fit">
              <Upload className="h-4 w-4 mr-2" />
              Upload File
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Search and Filters */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search files..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 text-sm"
              />
            </div>
            <div className="flex gap-2">
              <Button
                variant={viewMode === "grid" ? "default" : "outline"}
                size="icon"
                className="h-9 w-9"
                onClick={() => setViewMode("grid")}
              >
                <Grid className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === "list" ? "default" : "outline"}
                size="icon"
                className="h-9 w-9"
                onClick={() => setViewMode("list")}
              >
                <List className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Category Tabs */}
          <Tabs value={selectedCategory} onValueChange={setSelectedCategory}>
            <TabsList className="h-auto flex-wrap bg-secondary/50 p-1">
              {categories.map((cat) => (
                <TabsTrigger
                  key={cat}
                  value={cat}
                  className="text-xs md:text-sm data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                >
                  {cat}
                </TabsTrigger>
              ))}
            </TabsList>

            <TabsContent value={selectedCategory} className="mt-4">
              {filteredContent.length === 0 ? (
                <div className="text-center py-8 md:py-12 text-muted-foreground">
                  <FolderOpen className="h-10 w-10 md:h-12 md:w-12 mx-auto mb-4 opacity-50" />
                  <p className="font-medium text-sm md:text-base">No files found</p>
                  <p className="text-xs md:text-sm mt-1">Upload files to get started</p>
                </div>
              ) : viewMode === "grid" ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
                  {filteredContent.map((item) => {
                    const Icon = getFileIcon(item.type);
                    return (
                      <Card
                        key={item.id}
                        className="group hover:shadow-elevated transition-all duration-200 border-border/50 cursor-pointer"
                      >
                        <CardContent className="p-3 md:p-4">
                          <div
                            className={cn(
                              "h-16 md:h-20 rounded-xl flex items-center justify-center mb-2 md:mb-3",
                              getFileColor(item.type)
                            )}
                          >
                            <Icon className="h-6 w-6 md:h-8 md:w-8" />
                          </div>
                          <p className="font-medium text-xs md:text-sm truncate">{item.name}</p>
                          <p className="text-[10px] md:text-xs text-muted-foreground mt-1">{item.size}</p>
                          <div className="flex gap-1 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button variant="ghost" size="icon" className="h-6 w-6 md:h-7 md:w-7">
                              <Eye className="h-3 w-3" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-6 w-6 md:h-7 md:w-7">
                              <Download className="h-3 w-3" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-6 w-6 md:h-7 md:w-7 text-destructive">
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              ) : (
                <div className="space-y-2">
                  {filteredContent.map((item) => {
                    const Icon = getFileIcon(item.type);
                    return (
                      <div
                        key={item.id}
                        className="flex items-center gap-3 p-2.5 md:p-3 rounded-xl hover:bg-accent/50 transition-colors group"
                      >
                        <div
                          className={cn(
                            "h-9 w-9 md:h-10 md:w-10 rounded-lg flex items-center justify-center shrink-0",
                            getFileColor(item.type)
                          )}
                        >
                          <Icon className="h-4 w-4 md:h-5 md:w-5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-xs md:text-sm truncate">{item.name}</p>
                          <p className="text-[10px] md:text-xs text-muted-foreground">
                            {item.size} • {item.uploadedAt}
                          </p>
                        </div>
                        <Badge variant="secondary" className="text-[10px] hidden sm:block">
                          {item.category}
                        </Badge>
                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button variant="ghost" size="icon" className="h-7 w-7">
                            <Eye className="h-3.5 w-3.5" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-7 w-7">
                            <Download className="h-3.5 w-3.5" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive">
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Quick Upload Zone */}
      <Card className="border-2 border-dashed border-border/50 hover:border-primary/50 transition-colors cursor-pointer">
        <CardContent className="py-6 md:py-8 text-center">
          <Upload className="h-8 w-8 md:h-10 md:w-10 mx-auto mb-3 text-muted-foreground" />
          <p className="font-medium text-xs md:text-sm">Drag and drop files here</p>
          <p className="text-[10px] md:text-xs text-muted-foreground mt-1">
            or click to browse • Max 10MB per file
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
