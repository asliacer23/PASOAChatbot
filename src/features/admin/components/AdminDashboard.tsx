import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  Users,
  MessageCircle,
  HelpCircle,
  Bell,
  LayoutDashboard,
  Loader2,
  Activity,
  CalendarDays,
  BarChart,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent } from "@/components/ui/tabs";
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
        supabase
          .from("conversations")
          .select("*", { count: "exact", head: true })
          .eq("status", "active"),
        supabase
          .from("faqs")
          .select("question, view_count, match_count")
          .order("match_count", { ascending: false })
          .limit(5),
        supabase
          .from("announcements")
          .select("*", { count: "exact", head: true })
          .eq("is_published", true),
      ]);

      setStats({
        totalUsers: usersCount || 0,
        activeConversations: conversationsCount || 0,
        faqViews:
          faqsData?.reduce((sum, faq) => sum + (faq.view_count || 0), 0) || 0,
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

  const maxCount = Math.max(...topQuestions.map((q) => q.count), 1);

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-secondary/5">
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-10 animate-fade-up">
        <Tabs
          value={getActiveTab()}
          onValueChange={handleTabChange}
          className="space-y-6 md:space-y-8"
        >
          <TabsContent value="dashboard" className="space-y-6 md:space-y-8">
            {isLoading ? (
              <div className="flex items-center justify-center py-16">
                <Loader2 className="h-10 w-10 animate-spin text-primary" />
              </div>
            ) : (
              <>
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <LayoutDashboard className="h-5 w-5 text-primary" />
                      <h2 className="text-xl sm:text-2xl md:text-3xl font-bold">
                        Dashboard
                      </h2>
                    </div>
                    <p className="text-xs sm:text-sm md:text-base text-muted-foreground mt-1 max-w-2xl">
                      Welcome back, Admin! Here's a quick overview of your
                      system's performance.
                    </p>
                  </div>
                </div>

                {/* Quick Actions */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">
                      Quick Actions
                    </CardTitle>
                    <CardDescription>
                      Common management tasks
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                      {[
                        { label: "Users", icon: Users, tab: "users" },
                        { label: "FAQ", icon: HelpCircle, tab: "faq" },
                        { label: "Chats", icon: MessageCircle, tab: "conversations" },
                        { label: "Announcements", icon: Bell, tab: "announcements" },
                        { label: "Events", icon: CalendarDays, tab: "events" },
                        { label: "Reports", icon: BarChart, tab: "reports" },
                      ].map((action, index) => (
                        <button
                          key={index}
                          onClick={() => handleTabChange(action.tab)}
                          className="flex flex-col items-center justify-center gap-2 p-4 rounded-lg bg-accent/30 hover:bg-accent/60 transition"
                        >
                          <action.icon className="h-5 w-5 text-primary" />
                          <span className="text-xs sm:text-sm font-medium text-center">
                            {action.label}
                          </span>
                        </button>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Analytics Grid */}
                <div className="grid gap-6 grid-cols-1 lg:grid-cols-3">
                  <Card className="lg:col-span-2">
                    <CardHeader>
                      <CardTitle>Most Matched FAQs</CardTitle>
                      <CardDescription>
                        Top 5 matched questions
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {topQuestions.length === 0 ? (
                        <p className="text-sm text-muted-foreground text-center">
                          No FAQ data yet
                        </p>
                      ) : (
                        topQuestions.map((item, index) => (
                          <div key={index} className="space-y-2">
                            <div className="flex justify-between text-sm">
                              <span className="line-clamp-2">
                                {item.question}
                              </span>
                              <span className="font-semibold">
                                {item.count}
                              </span>
                            </div>
                            <Progress
                              value={(item.count / maxCount) * 100}
                            />
                          </div>
                        ))
                      )}
                    </CardContent>
                  </Card>
                </div>

                {/* Summary */}
                <Card>
                  <CardHeader>
                    <CardTitle>Dashboard Summary</CardTitle>
                    <CardDescription>
                      System key metrics
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
                      <MetricBox title="Active Users" value={stats.totalUsers} />
                      <MetricBox
                        title="Active Chats"
                        value={stats.activeConversations}
                      />
                      <MetricBox
                        title="FAQ Interactions"
                        value={stats.faqViews}
                      />
                      <MetricBox
                        title="Announcements"
                        value={stats.announcementsCount}
                      />
                    </div>
                  </CardContent>
                </Card>
              </>
            )}
          </TabsContent>

          <TabsContent value="users"><UserManagement /></TabsContent>
          <TabsContent value="faq"><FAQManagement /></TabsContent>
          <TabsContent value="conversations"><ConversationsManagement /></TabsContent>
          <TabsContent value="announcements"><AnnouncementsManagement /></TabsContent>
          <TabsContent value="events"><EventsManagement /></TabsContent>
          <TabsContent value="content"><ContentManagement /></TabsContent>
          <TabsContent value="reports"><ReportsManagement /></TabsContent>
          <TabsContent value="settings"><SystemSettings /></TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

function MetricBox({ title, value }: { title: string; value: number }) {
  return (
    <div className="p-4 rounded-lg bg-secondary/40">
      <p className="text-xs sm:text-sm text-muted-foreground">{title}</p>
      <p className="text-xl sm:text-2xl font-bold">{value}</p>
    </div>
  );
}
