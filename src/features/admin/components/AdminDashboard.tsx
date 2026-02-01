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
    { title: "Total Users", value: stats.totalUsers.toString(), change: "+12%", icon: Users },
    { title: "Active Conversations", value: stats.activeConversations.toString(), change: "+5", icon: MessageCircle },
    { title: "FAQ Views", value: stats.faqViews.toLocaleString(), change: "+23%", icon: HelpCircle },
    { title: "Announcements", value: stats.announcementsCount.toString(), change: "+2", icon: Bell },
  ];

  const maxCount = Math.max(...topQuestions.map((q) => q.count), 1);

  return (
    <div className="container py-6 md:py-10 animate-fade-up">
      <Tabs value={getActiveTab()} onValueChange={handleTabChange} className="space-y-6">
        <div className="space-y-1">
          <h1 className="text-2xl md:text-3xl font-bold">Admin Dashboard</h1>
          <p className="text-muted-foreground">Manage Pasoa Student Hub</p>
        </div>

        {/* Dashboard Overview */}
        <TabsContent value="dashboard" className="space-y-6">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {statsCards.map((stat) => (
                  <Card key={stat.title} className="border-border/50">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                      <CardTitle className="text-sm font-medium text-muted-foreground">
                        {stat.title}
                      </CardTitle>
                      <stat.icon className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{stat.value}</div>
                      <p className="text-xs text-primary flex items-center gap-1">
                        <TrendingUp className="h-3 w-3" />
                        {stat.change} from last month
                      </p>
                    </CardContent>
                  </Card>
                ))}
              </div>

              <div className="grid gap-6 md:grid-cols-2">
                <Card className="border-border/50">
                  <CardHeader>
                    <CardTitle className="text-lg">Most Matched FAQs</CardTitle>
                    <CardDescription>Top 5 frequently matched questions</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {topQuestions.length === 0 ? (
                      <p className="text-sm text-muted-foreground text-center py-4">No FAQ data yet</p>
                    ) : (
                      topQuestions.map((item, index) => (
                        <div key={index} className="space-y-2">
                          <div className="flex items-center justify-between text-sm">
                            <span className="truncate flex-1 mr-2">{item.question}</span>
                            <span className="text-muted-foreground shrink-0">{item.count}</span>
                          </div>
                          <Progress value={(item.count / maxCount) * 100} className="h-2" />
                        </div>
                      ))
                    )}
                  </CardContent>
                </Card>

                <Card className="border-border/50">
                  <CardHeader>
                    <CardTitle className="text-lg">Quick Actions</CardTitle>
                    <CardDescription>Common administrative tasks</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {[
                      { label: "Manage FAQ Entries", icon: HelpCircle, tab: "faq" },
                      { label: "View User Accounts", icon: Users, tab: "users" },
                      { label: "Review Conversations", icon: MessageCircle, tab: "conversations" },
                      { label: "Post Announcement", icon: Bell, tab: "announcements" },
                    ].map((action, index) => (
                      <div
                        key={index}
                        onClick={() => handleTabChange(action.tab)}
                        className="flex items-center gap-3 p-3 rounded-xl bg-accent/30 hover:bg-accent/50 transition-colors cursor-pointer"
                      >
                        <action.icon className="h-4 w-4 text-primary" />
                        <span className="text-sm">{action.label}</span>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </div>
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
  );
}
