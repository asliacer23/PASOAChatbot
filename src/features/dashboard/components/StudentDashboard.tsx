import { useState, useEffect } from "react";
import { MessageCircle, HelpCircle, Bell, User, Loader2 } from "lucide-react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/features/auth";
import { PasoaMascot } from "@/features/shared/components/PasoaMascot";
import { format } from "date-fns";

interface Announcement {
  id: string;
  title: string;
  content: string;
  is_urgent: boolean;
  published_at: string | null;
  created_at: string;
}

const quickActions = [
  {
    to: "/chat",
    icon: MessageCircle,
    title: "Start Chatting",
    description: "Ask questions to our chatbot",
    color: "bg-gradient-primary",
  },
  {
    to: "/faq",
    icon: HelpCircle,
    title: "FAQ Center",
    description: "Browse frequently asked questions",
    color: "bg-gradient-secondary",
  },
  {
    to: "/announcements",
    icon: Bell,
    title: "Announcements",
    description: "View latest updates and news",
    color: "bg-gradient-primary",
  },
  {
    to: "/profile",
    icon: User,
    title: "My Profile",
    description: "Manage your account settings",
    color: "bg-gradient-secondary",
  },
];

export function StudentDashboard() {
  const { profile } = useAuth();
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  const fetchAnnouncements = async () => {
    try {
      const { data, error } = await supabase
        .from("announcements")
        .select("id, title, content, is_urgent, published_at, created_at")
        .eq("is_published", true)
        .order("published_at", { ascending: false })
        .limit(3);

      if (error) throw error;
      setAnnouncements(data as Announcement[] || []);
    } catch (error) {
      console.error("Error fetching announcements:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffHours < 1) return "Just now";
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? "s" : ""} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? "s" : ""} ago`;
    return format(date, "MMM d, yyyy");
  };

  return (
    <div className="w-full min-h-screen bg-gradient-to-b from-background via-background to-accent/5">
      <div className="w-full px-4 sm:px-6 md:px-8 lg:px-12 py-6 sm:py-8 md:py-12 space-y-6 sm:space-y-8 md:space-y-8 animate-fade-up w-full max-w-none">
        {/* Welcome Section with Mascot - Enhanced */}
        <section className="flex flex-col sm:flex-row items-center sm:items-start gap-4 sm:gap-6 relative">
          <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-accent/5 rounded-2xl blur-3xl -z-10" />
          <div className="shrink-0">
            <PasoaMascot size="lg" mood="waving" />
          </div>
          <div className="space-y-4 text-center sm:text-left flex-1">
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold leading-relaxed px-2 py-3">
              <span className="bg-gradient-to-r from-foreground to-muted-foreground bg-clip-text text-transparent">{getGreeting()},</span> <span className="text-primary">{profile?.first_name || "PASOAnian"}!</span>
            </h1>
            <p className="text-sm sm:text-base text-muted-foreground">
              Your digital assistant is here to help. How can we assist you today?
            </p>
          </div>
        </section>

        {/* Quick Actions - Enhanced */}
        <section className="grid gap-4 sm:gap-5 grid-cols-1 sm:grid-cols-2 lg:grid-cols-2">
          {quickActions.map((action) => (
            <Link key={action.to} to={action.to} className="block active:scale-95 transition-transform">
              <Card className="group h-full transition-all duration-300 hover:shadow-md hover:shadow-primary/20 hover:-translate-y-1 border-border/30 bg-card/60 backdrop-blur-sm hover:bg-card/80 cursor-pointer">
                <CardHeader className="flex flex-row items-center gap-4 sm:gap-5 pb-3 p-5 sm:p-6">
                  <div
                    className={`h-12 sm:h-14 w-12 sm:w-14 rounded-xl sm:rounded-2xl ${action.color} flex items-center justify-center shadow-md group-hover:scale-110 group-hover:shadow-lg transition-all flex-shrink-0`}
                  >
                    <action.icon className="h-6 sm:h-7 w-6 sm:w-7 text-primary-foreground" />
                  </div>
                  <div className="space-y-1 flex-1 min-w-0">
                    <CardTitle className="text-base sm:text-lg font-semibold truncate">{action.title}</CardTitle>
                    <CardDescription className="text-sm text-muted-foreground line-clamp-1">{action.description}</CardDescription>
                  </div>
                </CardHeader>
              </Card>
            </Link>
          ))}
        </section>

        {/* Recent Announcements Preview - Enhanced */}
        <section className="space-y-4 sm:space-y-5">
          <div className="flex items-center justify-between px-1">
            <h2 className="text-xl sm:text-2xl font-bold">Recent Announcements</h2>
            <Link to="/announcements">
              <Button variant="ghost" size="sm" className="text-primary text-sm sm:text-base h-9 sm:h-10 font-medium hover:bg-primary/5">
                View all
              </Button>
            </Link>
          </div>
          <Card className="border-border/30 bg-card/60 backdrop-blur-sm hover:shadow-md transition-all duration-300">
            <CardContent className="p-5 sm:p-6">
              {isLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-6 w-6 sm:h-7 sm:w-7 animate-spin text-primary" />
                </div>
              ) : announcements.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Bell className="h-8 w-8 sm:h-10 sm:w-10 mx-auto mb-3 opacity-50" />
                  <p className="text-base sm:text-lg font-medium">No announcements yet</p>
                </div>
              ) : (
                <div className="space-y-3 sm:space-y-4">
                  {announcements.map((announcement, index) => (
                    <Link
                      key={announcement.id}
                      to="/announcements"
                      className={`flex items-start gap-3 p-4 sm:p-5 rounded-xl sm:rounded-2xl active:scale-95 transition-all border ${
                        index === 0 ? "bg-primary/5 border-primary/30 hover:bg-primary/10" : "bg-card/50 border-border/20 hover:bg-card/70 hover:border-border/40"
                      }`}
                    >
                      <div
                        className={`h-2.5 w-2.5 rounded-full mt-1.5 flex-shrink-0 ${
                          announcement.is_urgent
                            ? "bg-destructive animate-pulse"
                            : index === 0
                            ? "bg-primary animate-pulse"
                            : "bg-muted-foreground/60"
                        }`}
                      />
                      <div className="space-y-1.5 flex-1 min-w-0">
                        <p className="font-semibold text-sm sm:text-base line-clamp-1 text-foreground">{announcement.title}</p>
                        <p className="text-xs sm:text-sm text-muted-foreground line-clamp-2 leading-relaxed">
                          {announcement.content}
                        </p>
                        <p className="text-xs text-muted-foreground/70">
                          {formatDate(announcement.published_at || announcement.created_at)}
                        </p>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </section>

        {/* Chatbot Teaser - Enhanced */}
        <section>
          <Card className="bg-gradient-to-r from-primary to-blue-600 text-primary-foreground border-0 overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 relative">
            <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-accent/5 opacity-0 hover:opacity-100 transition-opacity duration-300" />
            <CardContent className="p-5 sm:p-7 relative z-10">
              <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6">
                <div className="shrink-0">
                  <PasoaMascot size="lg" mood="happy" />
                </div>
                <div className="text-center sm:text-left space-y-3 flex-1">
                  <h3 className="text-xl sm:text-2xl font-bold">Have a question?</h3>
                  <p className="text-sm sm:text-base text-primary-foreground/90 leading-relaxed">
                    Our chatbot is available 24/7 to answer your questions about internships, events, requirements, and more!
                  </p>
                </div>
                <Link to="/chat" className="w-full sm:w-auto shrink-0">
                  <Button
                    variant="secondary"
                    size="lg"
                    className="rounded-xl shadow-md hover:shadow-lg w-full sm:w-auto text-sm sm:text-base font-semibold transition-all duration-200"
                  >
                    Chat Now
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </section>
      </div>
    </div>
  );
}
