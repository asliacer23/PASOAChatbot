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
  TrendingDown,
  Activity,
  PieChart,
  CheckCircle,
  Clock,
  FileText,
  ChevronDown,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { MetricGridSkeleton, ProgressListSkeleton } from "./AdminSkeletonLoaders";

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
  const [activeTab, setActiveTab] = useState("faqs");
  const [expandedTab, setExpandedTab] = useState<string | null>(null);

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
      <div className="space-y-6 md:space-y-8">
        <MetricGridSkeleton count={6} />
        <ProgressListSkeleton items={8} />
      </div>
    );
  }

  return (
    <div className="space-y-6 md:space-y-8">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 md:gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 md:h-6 md:w-6 text-primary" />
            <h2 className="text-2xl md:text-3xl font-bold">Analytics & Reports</h2>
          </div>
          <p className="text-sm md:text-base text-muted-foreground">
            Monitor system performance and user engagement metrics
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="w-32 md:w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7days">Last 7 days</SelectItem>
              <SelectItem value="30days">Last 30 days</SelectItem>
              <SelectItem value="90days">Last 90 days</SelectItem>
              <SelectItem value="all">All time</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm" className="gap-2">
            <Download className="h-4 w-4" />
            Export
          </Button>
        </div>
      </div>

      {/* Overview Stats */}
      <div className="grid gap-2 xs:gap-3 sm:gap-4 grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 auto-rows-max">
        <Card className="border-border/50 bg-gradient-to-br from-blue-500/20 to-blue-600/20 hover:shadow-lg transition-all duration-300">
          <CardContent className="p-3 xs:p-4 sm:p-6">
            <div className="flex items-start justify-between gap-2">
              <div className="space-y-1 min-w-0 flex-1">
                <p className="text-[10px] xs:text-xs sm:text-sm text-muted-foreground font-medium line-clamp-1">Total Users</p>
                <p className="text-xl xs:text-2xl sm:text-3xl font-bold">{stats.totalUsers}</p>
                <p className="text-[10px] xs:text-xs text-blue-600 dark:text-blue-400 flex items-center gap-0.5 mt-1 line-clamp-1">
                  <CheckCircle className="h-2.5 xs:h-3 w-2.5 xs:w-3 shrink-0" /> <span className="hidden xs:inline">{stats.activeUsers} active</span><span className="xs:hidden">{stats.activeUsers}</span>
                </p>
              </div>
              <div className="p-1.5 xs:p-2 bg-blue-500/20 rounded-lg shrink-0">
                <Users className="h-3.5 xs:h-4 w-3.5 xs:w-4 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/50 bg-gradient-to-br from-green-500/20 to-green-600/20 hover:shadow-lg transition-all duration-300">
          <CardContent className="p-3 xs:p-4 sm:p-6">
            <div className="flex items-start justify-between gap-2">
              <div className="space-y-1 min-w-0 flex-1">
                <p className="text-[10px] xs:text-xs sm:text-sm text-muted-foreground font-medium line-clamp-1">Conversations</p>
                <p className="text-xl xs:text-2xl sm:text-3xl font-bold">{stats.totalConversations}</p>
                <p className="text-[10px] xs:text-xs text-green-600 dark:text-green-400 flex items-center gap-0.5 mt-1 line-clamp-1">
                  <TrendingUp className="h-2.5 xs:h-3 w-2.5 xs:w-3 shrink-0" /> <span className="hidden xs:inline">Total chats</span><span className="xs:hidden">chats</span>
                </p>
              </div>
              <div className="p-1.5 xs:p-2 bg-green-500/20 rounded-lg shrink-0">
                <MessageCircle className="h-3.5 xs:h-4 w-3.5 xs:w-4 text-green-600 dark:text-green-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/50 bg-gradient-to-br from-purple-500/20 to-purple-600/20 hover:shadow-lg transition-all duration-300">
          <CardContent className="p-3 xs:p-4 sm:p-6">
            <div className="flex items-start justify-between gap-2">
              <div className="space-y-1 min-w-0 flex-1">
                <p className="text-[10px] xs:text-xs sm:text-sm text-muted-foreground font-medium line-clamp-1">FAQ Match Rate</p>
                <p className="text-xl xs:text-2xl sm:text-3xl font-bold">{stats.faqMatchRate.toFixed(1)}%</p>
                <p className="text-[10px] xs:text-xs text-purple-600 dark:text-purple-400 line-clamp-1">
                  {stats.totalFaqs} FAQs
                </p>
              </div>
              <div className="p-1.5 xs:p-2 bg-purple-500/20 rounded-lg shrink-0">
                <HelpCircle className="h-3.5 xs:h-4 w-3.5 xs:w-4 text-purple-600 dark:text-purple-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/50 bg-gradient-to-br from-amber-500/20 to-amber-600/20 hover:shadow-lg transition-all duration-300">
          <CardContent className="p-3 xs:p-4 sm:p-6">
            <div className="flex items-start justify-between gap-2">
              <div className="space-y-1 min-w-0 flex-1">
                <p className="text-[10px] xs:text-xs sm:text-sm text-muted-foreground font-medium line-clamp-1">Announcements</p>
                <p className="text-xl xs:text-2xl sm:text-3xl font-bold">{stats.totalAnnouncements}</p>
                <p className="text-[10px] xs:text-xs text-amber-600 dark:text-amber-400 flex items-center gap-0.5 mt-1 line-clamp-1">
                  <Bell className="h-2.5 xs:h-3 w-2.5 xs:w-3 shrink-0" /> Published
                </p>
              </div>
              <div className="p-1.5 xs:p-2 bg-amber-500/20 rounded-lg shrink-0">
                <Bell className="h-3.5 xs:h-4 w-3.5 xs:w-4 text-amber-600 dark:text-amber-400" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs for different reports - Desktop Tabs / Mobile Dropdown */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        {/* Desktop View - Tab List */}
        <div className="hidden sm:block mb-6">
          <TabsList className="grid w-full grid-cols-4 bg-secondary/50 p-0.5 xs:p-1 gap-0.5 xs:gap-1 h-auto">
            <TabsTrigger value="faqs" className="text-xs md:text-sm data-[state=active]:bg-primary data-[state=active]:text-primary-foreground px-2 py-2 rounded gap-1">
              <HelpCircle className="h-4 w-4 shrink-0" />
              <span>Top FAQs</span>
            </TabsTrigger>
            <TabsTrigger value="engagement" className="text-xs md:text-sm data-[state=active]:bg-primary data-[state=active]:text-primary-foreground px-2 py-2 rounded gap-1">
              <Activity className="h-4 w-4 shrink-0" />
              <span>Engagement</span>
            </TabsTrigger>
            <TabsTrigger value="trends" className="text-xs md:text-sm data-[state=active]:bg-primary data-[state=active]:text-primary-foreground px-2 py-2 rounded gap-1">
              <TrendingUp className="h-4 w-4 shrink-0" />
              <span>Trends</span>
            </TabsTrigger>
            <TabsTrigger value="details" className="text-xs md:text-sm data-[state=active]:bg-primary data-[state=active]:text-primary-foreground px-2 py-2 rounded gap-1">
              <FileText className="h-4 w-4 shrink-0" />
              <span>Details</span>
            </TabsTrigger>
          </TabsList>
        </div>

        {/* Mobile View - Dropdown */}
        <div className="sm:hidden mb-6">
          <button
            onClick={() => setExpandedTab(expandedTab ? null : "reports")}
            className="w-full flex items-center justify-between px-3 py-2 rounded-lg bg-secondary/50 border border-border/50 hover:border-primary/50 transition-colors text-sm font-medium"
          >
            <span className="flex items-center gap-2">
              {activeTab === "faqs" && <HelpCircle className="h-4 w-4" />}
              {activeTab === "engagement" && <Activity className="h-4 w-4" />}
              {activeTab === "trends" && <TrendingUp className="h-4 w-4" />}
              {activeTab === "details" && <FileText className="h-4 w-4" />}
              {activeTab === "faqs" && "Top FAQs"}
              {activeTab === "engagement" && "Engagement"}
              {activeTab === "trends" && "Trends"}
              {activeTab === "details" && "Details"}
            </span>
            <ChevronDown className={`h-4 w-4 transition-transform ${expandedTab === "reports" ? "rotate-180" : ""}`} />
          </button>

          {expandedTab === "reports" && (
            <div className="mt-2 rounded-lg border border-border/50 bg-secondary/50 overflow-hidden">
              {[
                { value: "faqs", label: "Top FAQs", icon: HelpCircle },
                { value: "engagement", label: "Engagement", icon: Activity },
                { value: "trends", label: "Trends", icon: TrendingUp },
                { value: "details", label: "Details", icon: FileText },
              ].map((item, idx) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.value}
                    onClick={() => {
                      setActiveTab(item.value);
                      setExpandedTab(null);
                    }}
                    className={`w-full flex items-center gap-2 px-3 py-2.5 text-sm transition-colors ${
                      activeTab === item.value
                        ? "bg-primary/10 text-primary font-medium"
                        : "hover:bg-accent/50 text-foreground"
                    } ${idx !== 3 ? "border-b border-border/30" : ""}`}
                  >
                    <Icon className="h-4 w-4" />
                    {item.label}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Top FAQs Tab */}
        <TabsContent value="faqs" className="space-y-4">
          <Card className="border-border/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <HelpCircle className="h-5 w-5 text-primary" />
                Top Matched FAQs
              </CardTitle>
              <CardDescription>
                Questions most frequently matched by the chatbot
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {topFaqs.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <HelpCircle className="h-10 w-10 mx-auto mb-3 opacity-50" />
                  <p className="font-medium">No FAQ data available yet</p>
                  <p className="text-sm mt-1">FAQs will appear here once they are matched by the chatbot</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {topFaqs.map((faq, index) => (
                    <div key={index} className="space-y-2 p-3 rounded-lg bg-accent/30 hover:bg-accent/50 transition-colors">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1">
                          <div className="flex items-start gap-2">
                            <Badge variant="outline" className="mt-0.5 shrink-0">{index + 1}</Badge>
                            <p className="text-sm font-medium line-clamp-2">{faq.question}</p>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center justify-between text-xs text-muted-foreground ml-6">
                        <span>Match Rate: {faq.viewCount > 0 ? ((faq.matchCount / faq.viewCount) * 100).toFixed(1) : 0}%</span>
                        <span className="text-right">{faq.matchCount} matches • {faq.viewCount} views</span>
                      </div>
                      <div className="ml-6">
                        <Progress value={(faq.matchCount / maxMatches) * 100} className="h-2" />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Engagement Tab */}
        <TabsContent value="engagement" className="space-y-4">
          <Card className="border-border/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5 text-primary" />
                Engagement Metrics
              </CardTitle>
              <CardDescription>
                User activity and system engagement overview
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="font-medium text-sm">Average Conversations per User</p>
                    <p className="text-xs text-muted-foreground">
                      Based on {stats.totalUsers} total users
                    </p>
                  </div>
                  <p className="text-2xl font-bold">
                    {stats.totalUsers > 0 ? (stats.totalConversations / stats.totalUsers).toFixed(2) : 0}
                  </p>
                </div>
                <Progress 
                  value={Math.min((stats.totalConversations / (stats.totalUsers * 5)) * 100, 100)} 
                  className="h-2" 
                />
              </div>

              <div className="border-t border-border/50 pt-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="font-medium text-sm">User Retention Rate</p>
                    <p className="text-xs text-muted-foreground">
                      Active users compared to total
                    </p>
                  </div>
                  <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                    {stats.totalUsers > 0 ? ((stats.activeUsers / stats.totalUsers) * 100).toFixed(1) : 0}%
                  </p>
                </div>
                <Progress 
                  value={stats.totalUsers > 0 ? (stats.activeUsers / stats.totalUsers) * 100 : 0} 
                  className="h-2" 
                />
              </div>

              <div className="border-t border-border/50 pt-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="font-medium text-sm">FAQ Knowledge Base Effectiveness</p>
                    <p className="text-xs text-muted-foreground">
                      FAQ match rate success
                    </p>
                  </div>
                  <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                    {stats.faqMatchRate.toFixed(1)}%
                  </p>
                </div>
                <Progress value={stats.faqMatchRate} className="h-2" />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Trends Tab */}
        <TabsContent value="trends" className="space-y-4">
          <Card className="border-border/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-primary" />
                System Trends
              </CardTitle>
              <CardDescription>
                Key indicators and performance metrics
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-lg bg-green-500/10 border border-green-500/20">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">User Growth</span>
                    <TrendingUp className="h-4 w-4 text-green-600 dark:text-green-400" />
                  </div>
                  <p className="text-2xl font-bold text-green-600 dark:text-green-400">+{stats.activeUsers}</p>
                  <p className="text-xs text-muted-foreground mt-1">Active accounts this period</p>
                </div>

                <div className="p-4 rounded-lg bg-blue-500/10 border border-blue-500/20">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">Chat Activity</span>
                    <MessageCircle className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                  </div>
                  <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{stats.totalConversations}</p>
                  <p className="text-xs text-muted-foreground mt-1">Total conversations</p>
                </div>

                <div className="p-4 rounded-lg bg-purple-500/10 border border-purple-500/20">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">Knowledge Base</span>
                    <HelpCircle className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                  </div>
                  <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">{stats.totalFaqs}</p>
                  <p className="text-xs text-muted-foreground mt-1">Available FAQs</p>
                </div>

                <div className="p-4 rounded-lg bg-amber-500/10 border border-amber-500/20">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">Communications</span>
                    <Bell className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                  </div>
                  <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">{stats.totalAnnouncements}</p>
                  <p className="text-xs text-muted-foreground mt-1">Published announcements</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Details Tab */}
        <TabsContent value="details" className="space-y-4">
          <Card className="border-border/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary" />
                Detailed Statistics
              </CardTitle>
              <CardDescription>
                Comprehensive system statistics and information
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <tbody className="divide-y divide-border/50">
                    <tr className="hover:bg-accent/30 transition-colors">
                      <td className="py-3 px-2 font-medium">Total Users</td>
                      <td className="py-3 px-2 text-right font-bold text-lg">{stats.totalUsers}</td>
                    </tr>
                    <tr className="hover:bg-accent/30 transition-colors">
                      <td className="py-3 px-2 font-medium">Active Users</td>
                      <td className="py-3 px-2 text-right">
                        <span className="font-bold text-green-600 dark:text-green-400">{stats.activeUsers}</span>
                        <span className="text-xs text-muted-foreground ml-2">
                          ({stats.totalUsers > 0 ? ((stats.activeUsers / stats.totalUsers) * 100).toFixed(1) : 0}%)
                        </span>
                      </td>
                    </tr>
                    <tr className="hover:bg-accent/30 transition-colors">
                      <td className="py-3 px-2 font-medium">Total Conversations</td>
                      <td className="py-3 px-2 text-right font-bold text-lg">{stats.totalConversations}</td>
                    </tr>
                    <tr className="hover:bg-accent/30 transition-colors">
                      <td className="py-3 px-2 font-medium">Total FAQs</td>
                      <td className="py-3 px-2 text-right font-bold text-lg">{stats.totalFaqs}</td>
                    </tr>
                    <tr className="hover:bg-accent/30 transition-colors">
                      <td className="py-3 px-2 font-medium">FAQ Match Rate</td>
                      <td className="py-3 px-2 text-right">
                        <span className="font-bold text-purple-600 dark:text-purple-400">{stats.faqMatchRate.toFixed(1)}%</span>
                      </td>
                    </tr>
                    <tr className="hover:bg-accent/30 transition-colors">
                      <td className="py-3 px-2 font-medium">Total Announcements</td>
                      <td className="py-3 px-2 text-right font-bold text-lg">{stats.totalAnnouncements}</td>
                    </tr>
                    <tr className="hover:bg-accent/30 transition-colors">
                      <td className="py-3 px-2 font-medium">Report Generated</td>
                      <td className="py-3 px-2 text-right text-xs text-muted-foreground">
                        {new Date().toLocaleDateString()} {new Date().toLocaleTimeString()}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
