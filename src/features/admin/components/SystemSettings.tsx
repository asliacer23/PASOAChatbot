import { useState } from "react";
import {
  Settings,
  Bell,
  MessageCircle,
  Shield,
  Database,
  Mail,
  Save,
  AlertCircle,
  CheckCircle,
  Zap,
  Users,
  Lock,
  Eye,
  Clock,
  Server,
  Globe,
  ChevronDown,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export function SystemSettings() {
  const [settings, setSettings] = useState({
    enableChatbot: true,
    enableHumanAgent: true,
    autoAssignConversations: false,
    enableEmailNotifications: true,
    maxConversationsPerAdmin: 10,
    sessionTimeout: 30,
    maintenanceMode: false,
    rateLimit: 100,
    apiTimeout: 30,
    enableAnalytics: true,
    enableUserTracking: false,
    maxFileUploadSize: 10,
    enableSSL: true,
  });
  const [hasChanges, setHasChanges] = useState(false);
  const [activeTab, setActiveTab] = useState("chat");
  const [expandedTab, setExpandedTab] = useState<string | null>(null);

  const handleSettingChange = (key: string, value: any) => {
    setSettings({ ...settings, [key]: value });
    setHasChanges(true);
  };

  const handleSave = () => {
    // In a real app, this would save to database
    toast.success("Settings saved successfully");
    setHasChanges(false);
  };

  return (
    <div className="space-y-6 md:space-y-8">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 md:gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Settings className="h-5 w-5 md:h-6 md:w-6 text-primary" />
            <h2 className="text-2xl md:text-3xl font-bold">System Settings</h2>
          </div>
          <p className="text-sm md:text-base text-muted-foreground">
            Configure system-wide settings and preferences
          </p>
        </div>
        <Button 
          onClick={handleSave}
          disabled={!hasChanges}
          className="bg-gradient-to-r from-primary to-primary/80 hover:shadow-lg transition-all rounded-lg h-10 whitespace-nowrap gap-2"
        >
          <Save className="h-4 w-4" />
          Save Changes
        </Button>
      </div>

      {/* Status Cards */}
      <div className="grid gap-2 xs:gap-3 sm:gap-4 grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 auto-rows-max">
        <Card className="border-border/50 bg-gradient-to-br from-green-500/20 to-green-600/20 hover:shadow-lg transition-all duration-300">
          <CardContent className="p-3 xs:p-4 sm:p-6">
            <div className="flex items-start justify-between gap-2">
              <div className="space-y-1 min-w-0 flex-1">
                <p className="text-[10px] xs:text-xs sm:text-sm text-muted-foreground font-medium line-clamp-1">System Status</p>
                <p className="text-base xs:text-lg sm:text-xl font-bold text-green-600 dark:text-green-400">Operational</p>
              </div>
              <div className="p-1.5 xs:p-2 bg-green-500/20 rounded-lg shrink-0">
                <CheckCircle className="h-3.5 xs:h-4 w-3.5 xs:w-4 text-green-600 dark:text-green-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/50 bg-gradient-to-br from-blue-500/20 to-blue-600/20 hover:shadow-lg transition-all duration-300">
          <CardContent className="p-3 xs:p-4 sm:p-6">
            <div className="flex items-start justify-between gap-2">
              <div className="space-y-1 min-w-0 flex-1">
                <p className="text-[10px] xs:text-xs sm:text-sm text-muted-foreground font-medium line-clamp-1">Uptime</p>
                <p className="text-base xs:text-lg sm:text-xl font-bold text-blue-600 dark:text-blue-400">99.9%</p>
              </div>
              <div className="p-1.5 xs:p-2 bg-blue-500/20 rounded-lg shrink-0">
                <Zap className="h-3.5 xs:h-4 w-3.5 xs:w-4 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/50 bg-gradient-to-br from-purple-500/20 to-purple-600/20 hover:shadow-lg transition-all duration-300">
          <CardContent className="p-3 xs:p-4 sm:p-6">
            <div className="flex items-start justify-between gap-2">
              <div className="space-y-1 min-w-0 flex-1">
                <p className="text-[10px] xs:text-xs sm:text-sm text-muted-foreground font-medium line-clamp-1">Active Users</p>
                <p className="text-base xs:text-lg sm:text-xl font-bold text-purple-600 dark:text-purple-400">847</p>
              </div>
              <div className="p-1.5 xs:p-2 bg-purple-500/20 rounded-lg shrink-0">
                <Users className="h-3.5 xs:h-4 w-3.5 xs:w-4 text-purple-600 dark:text-purple-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/50 bg-gradient-to-br from-amber-500/20 to-amber-600/20 hover:shadow-lg transition-all duration-300">
          <CardContent className="p-3 xs:p-4 sm:p-6">
            <div className="flex items-start justify-between gap-2">
              <div className="space-y-1 min-w-0 flex-1">
                <p className="text-[10px] xs:text-xs sm:text-sm text-muted-foreground font-medium line-clamp-1">Database Size</p>
                <p className="text-base xs:text-lg sm:text-xl font-bold text-amber-600 dark:text-amber-400">2.4 GB</p>
              </div>
              <div className="p-1.5 xs:p-2 bg-amber-500/20 rounded-lg shrink-0">
                <Database className="h-3.5 xs:h-4 w-3.5 xs:w-4 text-amber-600 dark:text-amber-400" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Settings Tabs - Desktop Tabs / Mobile Dropdown */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        {/* Desktop View - Tab List */}
        <div className="hidden sm:block mb-6">
          <TabsList className="grid w-full grid-cols-5 bg-secondary/50 p-0.5 xs:p-1 gap-0.5 xs:gap-1 h-auto">
            <TabsTrigger value="chat" className="text-xs md:text-sm data-[state=active]:bg-primary data-[state=active]:text-primary-foreground px-2 py-2 rounded gap-1">
              <MessageCircle className="h-4 w-4 shrink-0" />
              <span>Chat</span>
            </TabsTrigger>
            <TabsTrigger value="notifications" className="text-xs md:text-sm data-[state=active]:bg-primary data-[state=active]:text-primary-foreground px-2 py-2 rounded gap-1">
              <Bell className="h-4 w-4 shrink-0" />
              <span>Notifications</span>
            </TabsTrigger>
            <TabsTrigger value="security" className="text-xs md:text-sm data-[state=active]:bg-primary data-[state=active]:text-primary-foreground px-2 py-2 rounded gap-1">
              <Shield className="h-4 w-4 shrink-0" />
              <span>Security</span>
            </TabsTrigger>
            <TabsTrigger value="api" className="text-xs md:text-sm data-[state=active]:bg-primary data-[state=active]:text-primary-foreground px-2 py-2 rounded gap-1">
              <Server className="h-4 w-4 shrink-0" />
              <span>API</span>
            </TabsTrigger>
            <TabsTrigger value="system" className="text-xs md:text-sm data-[state=active]:bg-primary data-[state=active]:text-primary-foreground px-2 py-2 rounded gap-1">
              <Database className="h-4 w-4 shrink-0" />
              <span>System</span>
            </TabsTrigger>
          </TabsList>
        </div>

        {/* Mobile View - Dropdown */}
        <div className="sm:hidden mb-6">
          <button
            onClick={() => setExpandedTab(expandedTab ? null : "settings")}
            className="w-full flex items-center justify-between px-3 py-2 rounded-lg bg-secondary/50 border border-border/50 hover:border-primary/50 transition-colors text-sm font-medium"
          >
            <span className="flex items-center gap-2">
              {activeTab === "chat" && <MessageCircle className="h-4 w-4" />}
              {activeTab === "notifications" && <Bell className="h-4 w-4" />}
              {activeTab === "security" && <Shield className="h-4 w-4" />}
              {activeTab === "api" && <Server className="h-4 w-4" />}
              {activeTab === "system" && <Database className="h-4 w-4" />}
              {activeTab === "chat" && "Chat"}
              {activeTab === "notifications" && "Notifications"}
              {activeTab === "security" && "Security"}
              {activeTab === "api" && "API"}
              {activeTab === "system" && "System"}
            </span>
            <ChevronDown className={`h-4 w-4 transition-transform ${expandedTab === "settings" ? "rotate-180" : ""}`} />
          </button>

          {expandedTab === "settings" && (
            <div className="mt-2 rounded-lg border border-border/50 bg-secondary/50 overflow-hidden">
              {[
                { value: "chat", label: "Chat", icon: MessageCircle },
                { value: "notifications", label: "Notifications", icon: Bell },
                { value: "security", label: "Security", icon: Shield },
                { value: "api", label: "API", icon: Server },
                { value: "system", label: "System", icon: Database },
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
                    } ${idx !== 4 ? "border-b border-border/30" : ""}`}
                  >
                    <Icon className="h-4 w-4" />
                    {item.label}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Chat Settings Tab */}
        <TabsContent value="chat" className="space-y-4">
          <Card className="border-border/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageCircle className="h-5 w-5 text-primary" />
                Chat Settings
              </CardTitle>
              <CardDescription>Configure chatbot and conversation settings</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-3 xs:p-4 rounded-lg bg-accent/30 hover:bg-accent/50 transition-colors gap-3">
                <div className="space-y-0.5 min-w-0 flex-1">
                  <Label className="font-medium text-xs xs:text-sm">Enable Chatbot</Label>
                  <p className="text-[10px] xs:text-xs text-muted-foreground line-clamp-2">
                    Allow students to use the AI chatbot for inquiries
                  </p>
                </div>
                <Switch
                  checked={settings.enableChatbot}
                  onCheckedChange={(checked) => handleSettingChange("enableChatbot", checked)}
                  className="shrink-0"
                />
              </div>

              <Separator />

              <div className="flex items-center justify-between p-3 xs:p-4 rounded-lg bg-accent/30 hover:bg-accent/50 transition-colors gap-3">
                <div className="space-y-0.5 min-w-0 flex-1">
                  <Label className="font-medium text-xs xs:text-sm">Enable Human Agent</Label>
                  <p className="text-[10px] xs:text-xs text-muted-foreground line-clamp-2">
                    Allow students to request human support and escalation
                  </p>
                </div>
                <Switch
                  checked={settings.enableHumanAgent}
                  onCheckedChange={(checked) => handleSettingChange("enableHumanAgent", checked)}
                  className="shrink-0"
                />
              </div>

              <Separator />

              <div className="flex items-center justify-between p-3 xs:p-4 rounded-lg bg-accent/30 hover:bg-accent/50 transition-colors gap-3">
                <div className="space-y-0.5 min-w-0 flex-1">
                  <Label className="font-medium text-xs xs:text-sm">Auto-Assign Conversations</Label>
                  <p className="text-[10px] xs:text-xs text-muted-foreground line-clamp-2">
                    Automatically assign new conversations to available admins
                  </p>
                </div>
                <Switch
                  checked={settings.autoAssignConversations}
                  onCheckedChange={(checked) => handleSettingChange("autoAssignConversations", checked)}
                  className="shrink-0"
                />
              </div>

              <Separator />

              <div className="space-y-2 p-3 xs:p-4 rounded-lg bg-accent/30">
                <Label className="font-medium text-xs xs:text-sm">Max Conversations per Admin</Label>
                <Input
                  type="number"
                  value={settings.maxConversationsPerAdmin}
                  onChange={(e) => handleSettingChange("maxConversationsPerAdmin", parseInt(e.target.value) || 10)}
                  className="w-full md:w-48 text-xs xs:text-sm"
                />
                <p className="text-[10px] xs:text-xs text-muted-foreground">
                  Maximum simultaneous conversations an admin can handle concurrently
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notifications Settings Tab */}
        <TabsContent value="notifications" className="space-y-4">
          <Card className="border-border/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5 text-primary" />
                Notification Settings
              </CardTitle>
              <CardDescription>Configure system notifications and alerts</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-4 rounded-lg bg-accent/30 hover:bg-accent/50 transition-colors">
                <div className="space-y-0.5">
                  <Label className="font-medium">Email Notifications</Label>
                  <p className="text-xs text-muted-foreground">
                    Send email alerts for important system events
                  </p>
                </div>
                <Switch
                  checked={settings.enableEmailNotifications}
                  onCheckedChange={(checked) => handleSettingChange("enableEmailNotifications", checked)}
                />
              </div>

              <Separator />

              <div className="flex items-center justify-between p-4 rounded-lg bg-accent/30 hover:bg-accent/50 transition-colors">
                <div className="space-y-0.5">
                  <Label className="font-medium">Analytics Notifications</Label>
                  <p className="text-xs text-muted-foreground">
                    Receive periodic reports on system analytics
                  </p>
                </div>
                <Switch
                  checked={settings.enableAnalytics}
                  onCheckedChange={(checked) => handleSettingChange("enableAnalytics", checked)}
                />
              </div>

              <Separator />

              <div className="flex items-center justify-between p-4 rounded-lg bg-accent/30 hover:bg-accent/50 transition-colors">
                <div className="space-y-0.5">
                  <Label className="font-medium">User Activity Tracking</Label>
                  <p className="text-xs text-muted-foreground">
                    Enable comprehensive user activity logging
                  </p>
                </div>
                <Switch
                  checked={settings.enableUserTracking}
                  onCheckedChange={(checked) => handleSettingChange("enableUserTracking", checked)}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Security Settings Tab */}
        <TabsContent value="security" className="space-y-4">
          <Card className="border-border/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-primary" />
                Security Settings
              </CardTitle>
              <CardDescription>Configure security, access, and authentication settings</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2 p-4 rounded-lg bg-accent/30">
                <Label className="font-medium">Session Timeout (minutes)</Label>
                <Input
                  type="number"
                  value={settings.sessionTimeout}
                  onChange={(e) => handleSettingChange("sessionTimeout", parseInt(e.target.value) || 30)}
                  className="w-full md:w-48"
                />
                <p className="text-xs text-muted-foreground">
                  Auto logout after inactivity period
                </p>
              </div>

              <Separator />

              <div className="flex items-center justify-between p-4 rounded-lg bg-accent/30 hover:bg-accent/50 transition-colors">
                <div className="space-y-0.5">
                  <Label className="font-medium">Enable SSL/TLS</Label>
                  <p className="text-xs text-muted-foreground">
                    Enforce secure HTTPS connections
                  </p>
                </div>
                <Switch
                  checked={settings.enableSSL}
                  onCheckedChange={(checked) => handleSettingChange("enableSSL", checked)}
                />
              </div>

              <Separator />

              <div className="space-y-2 p-4 rounded-lg bg-red-500/10 border border-red-500/20">
                <Label className="font-medium text-destructive flex items-center gap-2">
                  <AlertCircle className="h-4 w-4" />
                  Maintenance Mode
                </Label>
                <p className="text-xs text-muted-foreground">
                  Temporarily disable access for all non-admin users
                </p>
                <div className="mt-3">
                  <Switch
                    checked={settings.maintenanceMode}
                    onCheckedChange={(checked) => handleSettingChange("maintenanceMode", checked)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* API Settings Tab */}
        <TabsContent value="api" className="space-y-4">
          <Card className="border-border/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Server className="h-5 w-5 text-primary" />
                API Configuration
              </CardTitle>
              <CardDescription>Configure API and integration settings</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2 p-4 rounded-lg bg-accent/30">
                <Label className="font-medium">Rate Limit (requests/minute)</Label>
                <Input
                  type="number"
                  value={settings.rateLimit}
                  onChange={(e) => handleSettingChange("rateLimit", parseInt(e.target.value) || 100)}
                  className="w-full md:w-48"
                />
                <p className="text-xs text-muted-foreground">
                  Maximum API requests allowed per minute per user
                </p>
              </div>

              <Separator />

              <div className="space-y-2 p-4 rounded-lg bg-accent/30">
                <Label className="font-medium">API Timeout (seconds)</Label>
                <Input
                  type="number"
                  value={settings.apiTimeout}
                  onChange={(e) => handleSettingChange("apiTimeout", parseInt(e.target.value) || 30)}
                  className="w-full md:w-48"
                />
                <p className="text-xs text-muted-foreground">
                  Maximum time to wait for API responses
                </p>
              </div>

              <Separator />

              <div className="space-y-2 p-4 rounded-lg bg-accent/30">
                <Label className="font-medium">Max File Upload Size (MB)</Label>
                <Input
                  type="number"
                  value={settings.maxFileUploadSize}
                  onChange={(e) => handleSettingChange("maxFileUploadSize", parseInt(e.target.value) || 10)}
                  className="w-full md:w-48"
                />
                <p className="text-xs text-muted-foreground">
                  Maximum file size allowed for uploads
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* System Settings Tab */}
        <TabsContent value="system" className="space-y-4">
          <Card className="border-border/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5 text-primary" />
                System Information
              </CardTitle>
              <CardDescription>Database and system configuration details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="p-4 rounded-xl bg-gradient-to-br from-blue-500/20 to-blue-600/20 border border-blue-500/30">
                  <div className="flex items-start justify-between mb-2">
                    <p className="text-sm font-medium">Database</p>
                    <CheckCircle className="h-4 w-4 text-green-500" />
                  </div>
                  <p className="text-xs text-muted-foreground">Supabase PostgreSQL</p>
                  <p className="text-xs text-blue-600 dark:text-blue-400 mt-2">Version: 15.2</p>
                </div>

                <div className="p-4 rounded-xl bg-gradient-to-br from-green-500/20 to-green-600/20 border border-green-500/30">
                  <div className="flex items-start justify-between mb-2">
                    <p className="text-sm font-medium">Status</p>
                    <CheckCircle className="h-4 w-4 text-green-500" />
                  </div>
                  <p className="text-xs text-green-600 dark:text-green-400 font-medium">Connected & Operational</p>
                  <p className="text-xs text-muted-foreground mt-2">Last sync: 2 min ago</p>
                </div>

                <div className="p-4 rounded-xl bg-gradient-to-br from-purple-500/20 to-purple-600/20 border border-purple-500/30">
                  <p className="text-sm font-medium mb-2">Database Size</p>
                  <p className="text-lg font-bold text-purple-600 dark:text-purple-400">2.4 GB</p>
                  <p className="text-xs text-muted-foreground mt-2">Usage: 68% of quota</p>
                </div>

                <div className="p-4 rounded-xl bg-gradient-to-br from-amber-500/20 to-amber-600/20 border border-amber-500/30">
                  <p className="text-sm font-medium mb-2">Server Load</p>
                  <p className="text-lg font-bold text-amber-600 dark:text-amber-400">42%</p>
                  <p className="text-xs text-muted-foreground mt-2">Healthy - Low load</p>
                </div>
              </div>

              <Separator />

              <div className="space-y-2">
                <p className="text-sm font-medium">Configuration</p>
                <div className="grid gap-2 text-xs">
                  <div className="flex items-center justify-between p-3 rounded-lg bg-accent/30">
                    <span className="text-muted-foreground">API Endpoint</span>
                    <code className="text-xs bg-accent px-2 py-1 rounded">api.schema-weaver.local</code>
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-lg bg-accent/30">
                    <span className="text-muted-foreground">Environment</span>
                    <code className="text-xs bg-accent px-2 py-1 rounded">production</code>
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-lg bg-accent/30">
                    <span className="text-muted-foreground">Region</span>
                    <code className="text-xs bg-accent px-2 py-1 rounded">us-east-1</code>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>    </div>
  );
}