import { useState, useEffect } from "react";
import { Bell, Pin, AlertTriangle, Loader2, Search, Filter, Calendar, Eye, CheckCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/features/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { format, formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";

interface Announcement {
  id: string;
  title: string;
  content: string;
  is_pinned: boolean;
  is_urgent: boolean;
  published_at: string | null;
  created_at: string;
  category: {
    name: string;
    color: string;
  } | null;
  is_read?: boolean;
}

export function AnnouncementsList() {
  const { user } = useAuth();
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [readIds, setReadIds] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    fetchAnnouncements();
    if (user) fetchReadStatus();
  }, [user]);

  const fetchAnnouncements = async () => {
    try {
      const { data, error } = await supabase
        .from("announcements")
        .select(`
          id, 
          title, 
          content, 
          is_pinned, 
          is_urgent, 
          published_at, 
          created_at,
          category:announcement_categories(name, color)
        `)
        .eq("is_published", true)
        .order("is_pinned", { ascending: false })
        .order("published_at", { ascending: false });

      if (error) throw error;
      setAnnouncements(data as unknown as Announcement[] || []);
    } catch (error) {
      console.error("Error fetching announcements:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchReadStatus = async () => {
    if (!user) return;
    try {
      const { data } = await supabase
        .from("announcement_reads")
        .select("announcement_id")
        .eq("user_id", user.id);

      if (data) {
        setReadIds(new Set(data.map((r) => r.announcement_id)));
      }
    } catch (error) {
      console.error("Error fetching read status:", error);
    }
  };

  const markAsRead = async (announcementId: string) => {
    if (!user || readIds.has(announcementId)) return;

    try {
      await supabase.from("announcement_reads").insert({
        announcement_id: announcementId,
        user_id: user.id,
      });
      setReadIds((prev) => new Set([...prev, announcementId]));
    } catch (error) {
      console.error("Error marking as read:", error);
    }
  };

  const handleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
    markAsRead(id);
  };

  const getCategoryColor = (color: string | undefined) => {
    const colors: Record<string, string> = {
      blue: "bg-blue-500/20 text-blue-500 border-blue-500/30",
      purple: "bg-purple-500/20 text-purple-500 border-purple-500/30",
      gray: "bg-gray-500/20 text-gray-500 border-gray-500/30",
      red: "bg-red-500/20 text-red-500 border-red-500/30",
      green: "bg-green-500/20 text-green-500 border-green-500/30",
      orange: "bg-orange-500/20 text-orange-500 border-orange-500/30",
    };
    return colors[color || "gray"] || colors.gray;
  };

  const filteredAnnouncements = announcements.filter((announcement) => {
    const matchesSearch = 
      announcement.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      announcement.content.toLowerCase().includes(searchQuery.toLowerCase());
    
    if (activeTab === "all") return matchesSearch;
    if (activeTab === "unread") return matchesSearch && !readIds.has(announcement.id);
    if (activeTab === "pinned") return matchesSearch && announcement.is_pinned;
    if (activeTab === "urgent") return matchesSearch && announcement.is_urgent;
    return matchesSearch;
  });

  const unreadCount = announcements.filter((a) => !readIds.has(a.id)).length;

  return (
    <div className="w-full min-h-screen bg-gradient-to-b from-background via-background to-accent/5">
      <div className="px-4 sm:px-6 md:px-8 lg:px-12 py-6 sm:py-8 md:py-12 space-y-5 sm:space-y-6 md:space-y-6 animate-fade-up w-full max-w-none">
        {/* Header - Enhanced */}
        <section className="space-y-3 relative">
          <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-accent/5 rounded-2xl blur-3xl -z-10" />
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 sm:gap-4 min-w-0">
              <div className="h-11 w-11 sm:h-13 sm:w-13 rounded-xl sm:rounded-2xl bg-gradient-to-r from-primary to-blue-600 flex items-center justify-center flex-shrink-0 shadow-md">
                <Bell className="h-5 w-5 sm:h-6 sm:w-6 text-primary-foreground" />
              </div>
              <div className="min-w-0">
                <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold bg-gradient-to-r from-foreground to-muted-foreground bg-clip-text text-transparent">Announcements</h1>
                <p className="text-xs sm:text-sm text-muted-foreground">
                  Latest updates and news
                </p>
              </div>
            </div>
            {unreadCount > 0 && (
              <Badge variant="destructive" className="text-xs sm:text-sm flex-shrink-0 font-semibold">
                {unreadCount} new
              </Badge>
            )}
          </div>
        </section>

        {/* Search - Enhanced */}
        <div className="relative group">
          <div className="absolute inset-0 bg-gradient-to-r from-primary/20 via-transparent to-accent/20 rounded-xl sm:rounded-2xl blur opacity-0 group-focus-within:opacity-100 transition-opacity duration-300" />
          <div className="relative">
            <Search className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/60 group-focus-within:text-primary transition-colors" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search announcements..."
              className="pl-9 sm:pl-11 rounded-xl sm:rounded-2xl bg-secondary/50 border-border/50 text-sm sm:text-base h-10 sm:h-11 focus:ring-2 focus:ring-primary/20 focus:border-primary/50 transition-all duration-200"
            />
          </div>
        </div>

        {/* Tabs - Enhanced */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4 rounded-xl h-auto p-1 bg-secondary/50">
            <TabsTrigger value="all" className="text-xs sm:text-sm rounded-lg py-2 font-medium transition-all duration-200 data-[state=active]:bg-gradient-to-r data-[state=active]:from-primary data-[state=active]:to-blue-600 data-[state=active]:text-primary-foreground">All</TabsTrigger>
            <TabsTrigger value="unread" className="text-xs sm:text-sm rounded-lg py-2 font-medium transition-all duration-200 data-[state=active]:bg-gradient-to-r data-[state=active]:from-primary data-[state=active]:to-blue-600 data-[state=active]:text-primary-foreground">
              Unread {unreadCount > 0 && `(${unreadCount})`}
            </TabsTrigger>
            <TabsTrigger value="pinned" className="text-xs sm:text-sm rounded-lg py-2 font-medium transition-all duration-200 data-[state=active]:bg-gradient-to-r data-[state=active]:from-primary data-[state=active]:to-blue-600 data-[state=active]:text-primary-foreground">Pinned</TabsTrigger>
            <TabsTrigger value="urgent" className="text-xs sm:text-sm rounded-lg py-2 font-medium transition-all duration-200 data-[state=active]:bg-gradient-to-r data-[state=active]:from-primary data-[state=active]:to-blue-600 data-[state=active]:text-primary-foreground">Urgent</TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab} className="mt-5 sm:mt-6">
            {isLoading ? (
              <div className="flex items-center justify-center py-16">
                <Loader2 className="h-7 w-7 sm:h-8 sm:w-8 animate-spin text-primary" />
              </div>
            ) : filteredAnnouncements.length === 0 ? (
              <Card className="border-border/30 bg-gradient-to-br from-accent/30 via-accent/20 to-background shadow-md">
                <CardContent className="py-14 sm:py-16 text-center space-y-3">
                  <Bell className="h-10 w-10 sm:h-12 sm:w-12 mx-auto opacity-50" />
                  <div className="space-y-1">
                    <p className="font-semibold text-base sm:text-lg">No announcements found</p>
                    <p className="text-sm text-muted-foreground">
                      {searchQuery ? "Try a different search term" : "Check back later for updates"}
                    </p>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3 sm:space-y-4">
                {filteredAnnouncements.map((announcement) => {
                  const isRead = readIds.has(announcement.id);
                  const isExpanded = expandedId === announcement.id;
                  
                  return (
                    <Card
                      key={announcement.id}
                      className={cn(
                        "border-border/30 transition-all cursor-pointer hover:shadow-md active:scale-95 bg-card/60 backdrop-blur-sm",
                        announcement.is_pinned && "border-l-4 border-l-primary hover:bg-card/80",
                        announcement.is_urgent && "border-l-4 border-l-destructive hover:bg-card/80",
                        !isRead && "bg-primary/5 border-primary/20"
                      )}
                      onClick={() => handleExpand(announcement.id)}
                    >
                      <CardHeader className="pb-2 sm:pb-3 px-4 sm:px-5 pt-4 sm:pt-5">
                        <div className="flex items-start justify-between gap-3">
                          <div className="space-y-2 flex-1 min-w-0">
                            <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                              {announcement.is_pinned && (
                                <Badge variant="secondary" className="text-xs gap-1 bg-primary/10 text-primary border-primary/20">
                                  <Pin className="h-3 w-3" />
                                  <span>Pinned</span>
                                </Badge>
                              )}
                              {announcement.is_urgent && (
                                <Badge variant="destructive" className="text-xs gap-1">
                                  <AlertTriangle className="h-3 w-3" />
                                  <span>Urgent</span>
                                </Badge>
                              )}
                              {announcement.category && (
                                <Badge
                                  variant="outline"
                                  className={cn("text-xs font-medium", getCategoryColor(announcement.category.color))}
                                >
                                  {announcement.category.name}
                                </Badge>
                              )}
                            </div>
                            <CardTitle className="text-base sm:text-lg font-semibold line-clamp-2 leading-snug text-foreground">{announcement.title}</CardTitle>
                          </div>
                          <div className="flex items-center gap-1 shrink-0">
                            {isRead && (
                              <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 text-green-500" />
                            )}
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="px-4 sm:px-5 pb-4 sm:pb-5 space-y-3 animate-fade-up">
                        <p className={cn(
                          "text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed",
                          !isExpanded && "line-clamp-2"
                        )}>
                          {announcement.content}
                        </p>
                        
                        <div className="flex items-center justify-between pt-3 sm:pt-4 border-t border-border/20">
                          <div className="flex items-center gap-1.5 text-xs text-muted-foreground/70">
                            <Calendar className="h-3.5 w-3.5" />
                            {formatDistanceToNow(new Date(announcement.published_at || announcement.created_at), { addSuffix: true })}
                          </div>
                          <Button variant="ghost" size="sm" className="text-xs h-8 px-3 text-primary hover:bg-primary/5 font-medium transition-all">
                            <Eye className="h-3.5 w-3.5 mr-1" />
                            {isExpanded ? "Less" : "More"}
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
