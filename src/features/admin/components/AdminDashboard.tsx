import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  Users,
  MessageCircle,
  HelpCircle,
  Bell,
  TrendingUp,
  LayoutDashboard,
  FileText,
  BarChart3,
  Settings,
  Loader2,
  Calendar,
  ArrowUp,
  Activity,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { UserManagement } from "./UserManagement";
import { FAQManagement } from "./FAQManagement";
import { ConversationsManagement } from "./ConversationsManagement";
import { AnnouncementsManagement } from "./AnnouncementsManagement";
import { ContentManagement } from "./ContentManagement";
import { ReportsManagement } from "./ReportsManagement";
import { SystemSettings } from "./SystemSettings";
import { EventsManagement } from "@/features/events/components/EventsManagement";

interface DashboardStats {
  totalUsers: number;
  activeConversations: number;
  faqViews: number;
  announcementsCount: number;
}

interface TopQuestion {
  question: string;
  count: number;
}

export function AdminDashboard() {
  const location = useLocation();
  const navigate = useNavigate();
  const [stats, setStats] = useState<DashboardStats>({
    totalUsers: 0,
    activeConversations: 0,
    faqViews: 0,
    announcementsCount: 0,
  });
  const [topQuestions, setTopQuestions] = useState<TopQuestion[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Determine active tab based on route
  const getActiveTab = () => {
    const path = location.pathname;
    if (path.includes("/admin/users")) return "users";
    if (path.includes("/admin/faq")) return "faq";
    if (path.includes("/admin/conversations")) return "conversations";
    if (path.includes("/admin/announcements")) return "announcements";
    if (path.includes("/admin/events")) return "events";
    if (path.includes("/admin/content")) return "content";
    if (path.includes("/admin/reports")) return "reports";
    if (path.includes("/admin/settings")) return "settings";
    return "dashboard";
  };

  const handleTabChange = (value: string) => {
    const routes: Record<string, string> = {
      dashboard: "/admin",
      users: "/admin/users",
      faq: "/admin/faq",
      conversations: "/admin/conversations",
      announcements: "/admin/announcements",
      events: "/admin/events",
      content: "/admin/content",
      reports: "/admin/reports",
      settings: "/admin/settings",
    };
    navigate(routes[value] || "/admin");
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setIsLoading(true);
    try {
      const [
        { count: usersCount },
        { count: conversationsCount },
        { data: faqsData },
        { count: announcementsCount },
      ] = await Promise.all([
        supabase.from("profiles").select("*", { count: "exact", head: true }),
        supabase.from("conversations").select("*", { count: "exact", head: true }).eq("status", "active"),
        supabase.from("faqs").select("question, view_count, match_count").order("match_count", { ascending: false }).limit(5),
        supabase.from("announcements").select("*", { count: "exact", head: true }).eq("is_published", true),
      ]);

      setStats({
        totalUsers: usersCount || 0,
        activeConversations: conversationsCount || 0,
        faqViews: faqsData?.reduce((sum, faq) => sum + (faq.view_count || 0), 0) || 0,
        announcementsCount: announcementsCount || 0,
      });

      if (faqsData) {
        setTopQuestions(
          faqsData.map((faq) => ({
            question: faq.question,
            count: faq.match_count || 0,
          }))
        );
      }
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const statsCards = [
    { title: "Total Users", value: stats.totalUsers.toString(), change: "+12%", icon: Users, trend: "up", color: "from-blue-500/20 to-blue-600/20" },
    { title: "Active Conversations", value: stats.activeConversations.toString(), change: "+5", icon: MessageCircle, trend: "up", color: "from-green-500/20 to-green-600/20" },
    { title: "FAQ Views", value: stats.faqViews.toLocaleString(), change: "+23%", icon: HelpCircle, trend: "up", color: "from-purple-500/20 to-purple-600/20" },
    { title: "Announcements", value: stats.announcementsCount.toString(), change: "+2", icon: Bell, trend: "up", color: "from-orange-500/20 to-orange-600/20" },
  ];

  const maxCount = Math.max(...topQuestions.map((q) => q.count), 1);

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-secondary/5">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-10 animate-fade-up">
        <Tabs value={getActiveTab()} onValueChange={handleTabChange} className="space-y-6 md:space-y-8">
          {/* Dashboard Overview */}
          <TabsContent value="dashboard" className="space-y-6 md:space-y-8">
            {isLoading ? (
              <div className="flex items-center justify-center py-12 md:py-20">
                <div className="flex flex-col items-center gap-4">
                  <Loader2 className="h-8 w-8 md:h-10 md:w-10 animate-spin text-primary" />
                  <p className="text-sm text-muted-foreground">Loading dashboard data...</p>
                </div>
              </div>
            ) : (
              <>
                {/* Stats Cards Grid */}
                <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
                  {statsCards.map((stat) => (
                    <Card key={stat.title} className={`border-border/50 bg-gradient-to-br ${stat.color} hover:shadow-lg transition-all duration-300`}>
                      <CardHeader className="flex flex-row items-start justify-between pb-3 sm:pb-4">
                        <div className="space-y-1">
                          <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground">
                            {stat.title}
                          </CardTitle>
                        </div>
                        <div className="p-2 bg-primary/10 rounded-lg">
                          <stat.icon className="h-4 w-4 text-primary" />
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-2">
                        <div className="text-2xl sm:text-3xl font-bold tracking-tight">{stat.value}</div>
                        <div className="flex items-center gap-1.5">
                          <div className="flex items-center gap-0.5 text-xs sm:text-sm text-green-600 dark:text-green-400 font-medium">
                            <ArrowUp className="h-3 w-3" />
                            {stat.change}
                          </div>
                          <span className="text-xs text-muted-foreground">from last month</span>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                {/* Analytics Section */}
                <div className="grid gap-4 sm:gap-6 grid-cols-1 lg:grid-cols-3">
                  {/* Most Matched FAQs */}
                  <Card className="border-border/50 lg:col-span-2 hover:shadow-lg transition-all duration-300">
                    <CardHeader className="pb-4 sm:pb-6">
                      <div className="flex items-center gap-2">
                        <HelpCircle className="h-5 w-5 text-primary" />
                        <div>
                          <CardTitle className="text-lg sm:text-xl">Most Matched FAQs</CardTitle>
                          <CardDescription className="text-xs sm:text-sm mt-1">Top 5 frequently matched questions</CardDescription>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {topQuestions.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-8 text-center">
                          <HelpCircle className="h-8 w-8 text-muted-foreground/50 mb-2" />
                          <p className="text-sm text-muted-foreground">No FAQ data yet</p>
                        </div>
                      ) : (
                        topQuestions.map((item, index) => (
                          <div key={index} className="space-y-2 p-3 rounded-lg bg-secondary/30 hover:bg-secondary/50 transition-colors">
                            <div className="flex items-start justify-between gap-2 text-xs sm:text-sm">
                              <span className="line-clamp-2 flex-1 font-medium">{item.question}</span>
                              <span className="text-muted-foreground shrink-0 font-semibold">{item.count}</span>
                            </div>
                            <Progress value={(item.count / maxCount) * 100} className="h-2" />
                          </div>
                        ))
                      )}
                    </CardContent>
                  </Card>

                  {/* Quick Actions */}
                  <Card className="border-border/50 hover:shadow-lg transition-all duration-300">
                    <CardHeader className="pb-4 sm:pb-6">
                      <div className="flex items-center gap-2">
                        <Activity className="h-5 w-5 text-primary" />
                        <div>
                          <CardTitle className="text-lg sm:text-xl">Quick Actions</CardTitle>
                          <CardDescription className="text-xs sm:text-sm mt-1">Common tasks</CardDescription>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      {[
                        { label: "Manage FAQ", icon: HelpCircle, tab: "faq" },
                        { label: "View Users", icon: Users, tab: "users" },
                        { label: "Conversations", icon: MessageCircle, tab: "conversations" },
                        { label: "Announcements", icon: Bell, tab: "announcements" },
                      ].map((action, index) => (
                        <button
                          key={index}
                          onClick={() => handleTabChange(action.tab)}
                          className="w-full flex items-center gap-3 px-4 py-3 rounded-lg bg-accent/30 hover:bg-accent/60 transition-colors cursor-pointer text-left group"
                        >
                          <action.icon className="h-4 w-4 text-primary shrink-0 group-hover:scale-110 transition-transform" />
                          <span className="text-xs sm:text-sm font-medium truncate">{action.label}</span>
                        </button>
                      ))}
                    </CardContent>
                  </Card>
                </div>

                {/* Activity Summary */}
                <Card className="border-border/50 hover:shadow-lg transition-all duration-300">
                  <CardHeader className="pb-4 sm:pb-6">
                    <div className="flex items-center gap-2">
                      <Activity className="h-5 w-5 text-primary" />
                      <div>
                        <CardTitle className="text-lg sm:text-xl">Dashboard Summary</CardTitle>
                        <CardDescription className="text-xs sm:text-sm mt-1">System overview and key metrics</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid gap-4 grid-cols-1 sm:grid-cols-2">
                      <div className="p-4 rounded-lg bg-blue-500/10 border border-blue-500/20">
                        <p className="text-xs sm:text-sm text-muted-foreground mb-1">Active Users</p>
                        <p className="text-xl sm:text-2xl font-bold text-blue-600 dark:text-blue-400">{stats.totalUsers}</p>
                      </div>
                      <div className="p-4 rounded-lg bg-green-500/10 border border-green-500/20">
                        <p className="text-xs sm:text-sm text-muted-foreground mb-1">Active Chats</p>
                        <p className="text-xl sm:text-2xl font-bold text-green-600 dark:text-green-400">{stats.activeConversations}</p>
                      </div>
                      <div className="p-4 rounded-lg bg-purple-500/10 border border-purple-500/20">
                        <p className="text-xs sm:text-sm text-muted-foreground mb-1">FAQ Interactions</p>
                        <p className="text-xl sm:text-2xl font-bold text-purple-600 dark:text-purple-400">{stats.faqViews.toLocaleString()}</p>
                      </div>
                      <div className="p-4 rounded-lg bg-orange-500/10 border border-orange-500/20">
                        <p className="text-xs sm:text-sm text-muted-foreground mb-1">Announcements</p>
                        <p className="text-xl sm:text-2xl font-bold text-orange-600 dark:text-orange-400">{stats.announcementsCount}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </>
            )}
          </TabsContent>

        {/* User Management */}
        <TabsContent value="users">
          <UserManagement />
        </TabsContent>

        {/* FAQ Management */}
        <TabsContent value="faq">
          <FAQManagement />
        </TabsContent>

        {/* Conversations */}
        <TabsContent value="conversations">
          <ConversationsManagement />
        </TabsContent>

        {/* Announcements */}
        <TabsContent value="announcements">
          <AnnouncementsManagement />
        </TabsContent>

        {/* Events */}
        <TabsContent value="events">
          <EventsManagement />
        </TabsContent>

        {/* Content */}
        <TabsContent value="content">
          <ContentManagement />
        </TabsContent>

        {/* Reports */}
        <TabsContent value="reports">
          <ReportsManagement />
        </TabsContent>

        {/* System Settings */}
        <TabsContent value="settings">
          <SystemSettings />
        </TabsContent>
      </Tabs>
      </div>
    </div>
  );
}
