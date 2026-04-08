import { useState, useEffect } from "react";
import { Moon, Sun, Palette, Bell, Settings } from "lucide-react";
import { useTheme } from "next-themes";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/features/auth";
import { PasoaLoadingScreen } from "@/features/shared/components/PasoaLoadingScreen";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface UserPreferences {
  theme: string;
  accent_color: string;
  notifications_announcements: boolean;
  notifications_chat_replies: boolean;
}



export function SettingsPage() {
  const { theme, setTheme } = useTheme();
  const { user } = useAuth();
  const [mounted, setMounted] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [preferences, setPreferences] = useState<UserPreferences>({
    theme: theme || "light",
    accent_color: "purple",
    notifications_announcements: true,
    notifications_chat_replies: true,
  });

  useEffect(() => {
    setMounted(true);
    if (user) {
      fetchPreferences();
    } else {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    // Keep preferences theme in sync with actual theme
    setPreferences((prev) => ({ ...prev, theme: theme || "light" }));
  }, [theme]);

  const fetchPreferences = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from("user_preferences")
        .select("*")
        .eq("user_id", user.id)
        .single();

      if (error && error.code !== "PGRST116") throw error;

      if (data) {
        setPreferences({
          theme: theme || "light",
          accent_color: data.accent_color,
          notifications_announcements: data.notifications_announcements,
          notifications_chat_replies: data.notifications_chat_replies,
        });
      }
    } catch (error) {
      console.error("Error fetching preferences:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const savePreferences = async () => {
    if (!user) return;

    setIsSaving(true);
    try {
      const { error } = await supabase
        .from("user_preferences")
        .upsert({
          user_id: user.id,
          ...preferences,
          updated_at: new Date().toISOString(),
        });

      if (error) throw error;
      toast.success("Settings saved successfully");
    } catch (error) {
      console.error("Error saving preferences:", error);
      toast.error("Failed to save settings");
    } finally {
      setIsSaving(false);
    }
  };

  const handleThemeChange = (isLight: boolean) => {
    const newTheme = isLight ? "light" : "dark";
    setTheme(newTheme);
    setPreferences((prev) => ({ ...prev, theme: newTheme }));
  };

  const handleAccentChange = (color: string) => {
    setPreferences((prev) => ({ ...prev, accent_color: color }));
  };

  if (!mounted || isLoading) {
    return <PasoaLoadingScreen message="Loading settings..." />;
  }

  return (
    <div className="w-full min-h-screen bg-gradient-to-b from-background via-background to-accent/5">
      <div className="px-4 sm:px-6 md:px-8 lg:px-12 py-6 sm:py-8 md:py-12 space-y-6 sm:space-y-8 md:space-y-8 animate-fade-up w-full max-w-none">
        {/* Header - Enhanced */}
        <section className="space-y-3 relative">
          <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-accent/5 rounded-2xl blur-3xl -z-10" />
          <div className="flex items-center gap-3 sm:gap-4">
            <div className="h-11 w-11 sm:h-13 sm:w-13 rounded-xl sm:rounded-2xl bg-gradient-to-r from-primary to-purple-600 flex items-center justify-center flex-shrink-0 shadow-md">
              <Settings className="h-5 w-5 sm:h-6 sm:w-6 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold bg-gradient-to-r from-foreground to-muted-foreground bg-clip-text text-transparent">Settings</h1>
              <p className="text-xs sm:text-sm text-muted-foreground">
                Customize your experience
              </p>
            </div>
          </div>
        </section>

      {/* Theme Settings */}
      <Card className="border-border/30 bg-card/60 backdrop-blur-sm hover:shadow-md transition-all">
        <CardHeader>
          <CardTitle className="text-lg sm:text-xl font-semibold flex items-center gap-3">
            <Palette className="h-5 w-5 sm:h-6 sm:w-6" />
            Appearance
          </CardTitle>
          <CardDescription>Customize the look and feel</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Light/Dark Mode */}
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="font-medium">Light Mode</Label>
              <p className="text-xs text-muted-foreground">
                Toggle between light and dark themes
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Sun className="h-4 w-4 text-muted-foreground" />
              <Switch
                checked={preferences.theme === "light"}
                onCheckedChange={handleThemeChange}
              />
              <Moon className="h-4 w-4 text-muted-foreground" />
            </div>
          </div>

          
        </CardContent>
      </Card>

      {/* Notifications */}
      <Card className="border-border/30 bg-card/60 backdrop-blur-sm hover:shadow-md transition-all">
        <CardHeader>
          <CardTitle className="text-lg sm:text-xl font-semibold flex items-center gap-3">
            <Bell className="h-5 w-5 sm:h-6 sm:w-6" />
            Notifications
          </CardTitle>
          <CardDescription>Manage your notification preferences</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="font-medium">Announcements</Label>
              <p className="text-xs text-muted-foreground">
                Get notified about new announcements
              </p>
            </div>
            <Switch
              checked={preferences.notifications_announcements}
              onCheckedChange={(checked) =>
                setPreferences((prev) => ({
                  ...prev,
                  notifications_announcements: checked,
                }))
              }
            />
          </div>
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="font-medium">Chat Replies</Label>
              <p className="text-xs text-muted-foreground">
                Notify when admin replies to your messages
              </p>
            </div>
            <Switch
              checked={preferences.notifications_chat_replies}
              onCheckedChange={(checked) =>
                setPreferences((prev) => ({
                  ...prev,
                  notifications_chat_replies: checked,
                }))
              }
            />
          </div>
        </CardContent>
      </Card>

        <Button
          className="w-full rounded-xl bg-gradient-to-r from-primary to-blue-600 hover:shadow-md border-0 text-base font-semibold h-10 transition-all"
          onClick={savePreferences}
          disabled={isSaving}
        >
          {isSaving ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Saving...
            </>
          ) : (
            "Save All Settings"
          )}
        </Button>
      </div>
    </div>
  );
}
