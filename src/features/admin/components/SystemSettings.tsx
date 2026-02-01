import { useState } from "react";
import {
  Settings,
  Bell,
  MessageCircle,
  Shield,
  Database,
  Mail,
  Save,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";

export function SystemSettings() {
  const [settings, setSettings] = useState({
    enableChatbot: true,
    enableHumanAgent: true,
    autoAssignConversations: false,
    enableEmailNotifications: true,
    maxConversationsPerAdmin: 10,
    sessionTimeout: 30,
    maintenanceMode: false,
  });

  const handleSave = () => {
    // In a real app, this would save to database
    toast.success("Settings saved successfully");
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <Settings className="h-5 w-5" />
          System Settings
        </h2>
        <Button onClick={handleSave}>
          <Save className="h-4 w-4 mr-2" />
          Save Changes
        </Button>
      </div>

      {/* Chat Settings */}
      <Card className="border-border/50">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <MessageCircle className="h-5 w-5" />
            Chat Settings
          </CardTitle>
          <CardDescription>Configure chatbot and conversation settings</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="font-medium">Enable Chatbot</Label>
              <p className="text-xs text-muted-foreground">
                Allow students to use the AI chatbot
              </p>
            </div>
            <Switch
              checked={settings.enableChatbot}
              onCheckedChange={(checked) =>
                setSettings({ ...settings, enableChatbot: checked })
              }
            />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="font-medium">Enable Human Agent</Label>
              <p className="text-xs text-muted-foreground">
                Allow students to request human support
              </p>
            </div>
            <Switch
              checked={settings.enableHumanAgent}
              onCheckedChange={(checked) =>
                setSettings({ ...settings, enableHumanAgent: checked })
              }
            />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="font-medium">Auto-Assign Conversations</Label>
              <p className="text-xs text-muted-foreground">
                Automatically assign new conversations to available admins
              </p>
            </div>
            <Switch
              checked={settings.autoAssignConversations}
              onCheckedChange={(checked) =>
                setSettings({ ...settings, autoAssignConversations: checked })
              }
            />
          </div>

          <Separator />

          <div className="space-y-2">
            <Label className="font-medium">Max Conversations per Admin</Label>
            <Input
              type="number"
              value={settings.maxConversationsPerAdmin}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  maxConversationsPerAdmin: parseInt(e.target.value) || 10,
                })
              }
              className="w-32"
            />
            <p className="text-xs text-muted-foreground">
              Maximum simultaneous conversations an admin can handle
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Notification Settings */}
      <Card className="border-border/50">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Notification Settings
          </CardTitle>
          <CardDescription>Configure system notifications</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="font-medium">Email Notifications</Label>
              <p className="text-xs text-muted-foreground">
                Send email notifications for important events
              </p>
            </div>
            <Switch
              checked={settings.enableEmailNotifications}
              onCheckedChange={(checked) =>
                setSettings({ ...settings, enableEmailNotifications: checked })
              }
            />
          </div>
        </CardContent>
      </Card>

      {/* Security Settings */}
      <Card className="border-border/50">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Security Settings
          </CardTitle>
          <CardDescription>Configure security and access settings</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label className="font-medium">Session Timeout (minutes)</Label>
            <Input
              type="number"
              value={settings.sessionTimeout}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  sessionTimeout: parseInt(e.target.value) || 30,
                })
              }
              className="w-32"
            />
            <p className="text-xs text-muted-foreground">
              Auto logout after inactivity
            </p>
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="font-medium text-destructive">Maintenance Mode</Label>
              <p className="text-xs text-muted-foreground">
                Temporarily disable access for non-admin users
              </p>
            </div>
            <Switch
              checked={settings.maintenanceMode}
              onCheckedChange={(checked) =>
                setSettings({ ...settings, maintenanceMode: checked })
              }
            />
          </div>
        </CardContent>
      </Card>

      {/* Database Info */}
      <Card className="border-border/50">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Database className="h-5 w-5" />
            Database Information
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="p-4 rounded-xl bg-accent/30">
              <p className="text-sm font-medium">Database</p>
              <p className="text-xs text-muted-foreground">Supabase PostgreSQL</p>
            </div>
            <div className="p-4 rounded-xl bg-accent/30">
              <p className="text-sm font-medium">Status</p>
              <p className="text-xs text-green-500">Connected</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
