import { useState, useEffect } from "react";
import {
  BarChart3,
  TrendingUp,
  Users,
  MessageCircle,
  HelpCircle,
  Bell,
  Calendar,
  Download,
  Loader2,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Stats {
  totalUsers: number;
  totalConversations: number;
  totalFaqs: number;
  totalAnnouncements: number;
  faqMatchRate: number;
  activeUsers: number;
}

interface TopFaq {
  question: string;
  matchCount: number;
  viewCount: number;
}

export function ReportsManagement() {
  const [stats, setStats] = useState<Stats>({
    totalUsers: 0,
    totalConversations: 0,
    totalFaqs: 0,
    totalAnnouncements: 0,
    faqMatchRate: 0,
    activeUsers: 0,
  });
  const [topFaqs, setTopFaqs] = useState<TopFaq[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [period, setPeriod] = useState("30days");

  useEffect(() => {
    fetchReports();
  }, [period]);

  const fetchReports = async () => {
    setIsLoading(true);
    try {
      const [
        { count: usersCount },
        { count: activeUsersCount },
        { count: conversationsCount },
        { data: faqsData },
        { count: announcementsCount },
      ] = await Promise.all([
        supabase.from("profiles").select("*", { count: "exact", head: true }),
        supabase.from("profiles").select("*", { count: "exact", head: true }).eq("status", "active"),
        supabase.from("conversations").select("*", { count: "exact", head: true }),
        supabase.from("faqs").select("question, match_count, view_count").order("match_count", { ascending: false }).limit(10),
        supabase.from("announcements").select("*", { count: "exact", head: true }),
      ]);

      const totalMatches = faqsData?.reduce((sum, faq) => sum + (faq.match_count || 0), 0) || 0;
      const totalViews = faqsData?.reduce((sum, faq) => sum + (faq.view_count || 0), 0) || 0;
      const matchRate = totalViews > 0 ? (totalMatches / totalViews) * 100 : 0;

      setStats({
        totalUsers: usersCount || 0,
        activeUsers: activeUsersCount || 0,
        totalConversations: conversationsCount || 0,
        totalFaqs: faqsData?.length || 0,
        totalAnnouncements: announcementsCount || 0,
        faqMatchRate: matchRate,
      });

      setTopFaqs(
        (faqsData || []).map((faq) => ({
          question: faq.question,
          matchCount: faq.match_count || 0,
          viewCount: faq.view_count || 0,
        }))
      );
    } catch (error) {
      console.error("Error fetching reports:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const maxMatches = Math.max(...topFaqs.map((f) => f.matchCount), 1);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <BarChart3 className="h-5 w-5" />
          Analytics & Reports
        </h2>
        <div className="flex items-center gap-2">
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7days">Last 7 days</SelectItem>
              <SelectItem value="30days">Last 30 days</SelectItem>
              <SelectItem value="90days">Last 90 days</SelectItem>
              <SelectItem value="all">All time</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Overview Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="border-border/50">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Users
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalUsers}</div>
            <p className="text-xs text-muted-foreground">
              {stats.activeUsers} active
            </p>
          </CardContent>
        </Card>

        <Card className="border-border/50">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Conversations
            </CardTitle>
            <MessageCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalConversations}</div>
            <p className="text-xs text-primary flex items-center gap-1">
              <TrendingUp className="h-3 w-3" />
              Total chats
            </p>
          </CardContent>
        </Card>

        <Card className="border-border/50">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              FAQ Match Rate
            </CardTitle>
            <HelpCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.faqMatchRate.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground">
              {stats.totalFaqs} FAQs available
            </p>
          </CardContent>
        </Card>

        <Card className="border-border/50">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Announcements
            </CardTitle>
            <Bell className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalAnnouncements}</div>
            <p className="text-xs text-muted-foreground">Total published</p>
          </CardContent>
        </Card>
      </div>

      {/* Top FAQs */}
      <Card className="border-border/50">
        <CardHeader>
          <CardTitle className="text-lg">Top Matched FAQs</CardTitle>
          <CardDescription>
            Questions most frequently matched by the chatbot
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {topFaqs.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              No FAQ data available yet
            </p>
          ) : (
            topFaqs.map((faq, index) => (
              <div key={index} className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="truncate flex-1 mr-4">{faq.question}</span>
                  <div className="flex items-center gap-4 text-muted-foreground shrink-0">
                    <span>{faq.matchCount} matches</span>
                    <span>{faq.viewCount} views</span>
                  </div>
                </div>
                <Progress value={(faq.matchCount / maxMatches) * 100} className="h-2" />
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
