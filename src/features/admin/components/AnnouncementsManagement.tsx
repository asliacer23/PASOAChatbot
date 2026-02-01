import { useState, useEffect } from "react";
import {
  Bell,
  Plus,
  Edit,
  Trash2,
  Eye,
  EyeOff,
  Pin,
  AlertTriangle,
  Loader2,
  Calendar,
  Search,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/features/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface Announcement {
  id: string;
  title: string;
  content: string;
  category_id: string | null;
  is_published: boolean;
  is_pinned: boolean;
  is_urgent: boolean;
  created_at: string;
  published_at: string | null;
  expires_at: string | null;
  category?: { name: string; color: string };
}

interface Category {
  id: string;
  name: string;
  color: string | null;
}

export function AnnouncementsManagement() {
  const { user } = useAuth();
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingAnnouncement, setEditingAnnouncement] = useState<Announcement | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [formData, setFormData] = useState({
    title: "",
    content: "",
    category_id: "",
    is_published: false,
    is_pinned: false,
    is_urgent: false,
    expires_at: "",
  });

  useEffect(() => {
    fetchAnnouncements();
    fetchCategories();
  }, []);

  const fetchAnnouncements = async () => {
    try {
      const { data, error } = await supabase
        .from("announcements")
        .select(`
          *,
          category:announcement_categories(name, color)
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setAnnouncements(data || []);
    } catch (error) {
      console.error("Error fetching announcements:", error);
      toast.error("Failed to load announcements");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const { data, error } = await supabase
        .from("announcement_categories")
        .select("*")
        .order("name");

      if (error) throw error;
      setCategories(data || []);
    } catch (error) {
      console.error("Error fetching categories:", error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    try {
      const announcementData = {
        title: formData.title,
        content: formData.content,
        category_id: formData.category_id || null,
        is_published: formData.is_published,
        is_pinned: formData.is_pinned,
        is_urgent: formData.is_urgent,
        expires_at: formData.expires_at || null,
        published_at: formData.is_published ? new Date().toISOString() : null,
        created_by: user.id,
        updated_by: user.id,
      };

      if (editingAnnouncement) {
        const { error } = await supabase
          .from("announcements")
          .update({ ...announcementData, updated_by: user.id })
          .eq("id", editingAnnouncement.id);

        if (error) throw error;
        toast.success("Announcement updated");
      } else {
        const { error } = await supabase
          .from("announcements")
          .insert(announcementData);

        if (error) throw error;

        // Create notifications for all users if published
        if (formData.is_published) {
          const { data: profiles } = await supabase
            .from("profiles")
            .select("id");

          if (profiles) {
            const notifications = profiles.map((profile) => ({
              user_id: profile.id,
              type: "announcement",
              title: "New Announcement",
              message: formData.title,
              link: "/announcements",
            }));

            await supabase.from("notifications").insert(notifications);
          }
        }

        toast.success("Announcement created");
      }

      setIsDialogOpen(false);
      resetForm();
      fetchAnnouncements();
    } catch (error) {
      console.error("Error saving announcement:", error);
      toast.error("Failed to save announcement");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this announcement?")) return;

    try {
      const { error } = await supabase
        .from("announcements")
        .delete()
        .eq("id", id);

      if (error) throw error;
      toast.success("Announcement deleted");
      fetchAnnouncements();
    } catch (error) {
      console.error("Error deleting announcement:", error);
      toast.error("Failed to delete announcement");
    }
  };

  const handleEdit = (announcement: Announcement) => {
    setEditingAnnouncement(announcement);
    setFormData({
      title: announcement.title,
      content: announcement.content,
      category_id: announcement.category_id || "",
      is_published: announcement.is_published,
      is_pinned: announcement.is_pinned,
      is_urgent: announcement.is_urgent,
      expires_at: announcement.expires_at?.split("T")[0] || "",
    });
    setIsDialogOpen(true);
  };

  const togglePublish = async (announcement: Announcement) => {
    try {
      const newStatus = !announcement.is_published;
      const { error } = await supabase
        .from("announcements")
        .update({
          is_published: newStatus,
          published_at: newStatus ? new Date().toISOString() : null,
        })
        .eq("id", announcement.id);

      if (error) throw error;

      // Create notifications if publishing
      if (newStatus) {
        const { data: profiles } = await supabase
          .from("profiles")
          .select("id");

        if (profiles) {
          const notifications = profiles.map((profile) => ({
            user_id: profile.id,
            type: "announcement",
            title: "New Announcement",
            message: announcement.title,
            link: "/announcements",
          }));

          await supabase.from("notifications").insert(notifications);
        }
      }

      toast.success(newStatus ? "Announcement published" : "Announcement unpublished");
      fetchAnnouncements();
    } catch (error) {
      console.error("Error toggling publish:", error);
      toast.error("Failed to update announcement");
    }
  };

  const resetForm = () => {
    setEditingAnnouncement(null);
    setFormData({
      title: "",
      content: "",
      category_id: "",
      is_published: false,
      is_pinned: false,
      is_urgent: false,
      expires_at: "",
    });
  };

  const filteredAnnouncements = announcements.filter((a) =>
    a.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    a.content.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <Card className="border-border/50">
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <CardTitle className="text-lg flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Announcements
          </CardTitle>
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 w-full sm:w-64"
              />
            </div>
            <Dialog open={isDialogOpen} onOpenChange={(open) => {
              setIsDialogOpen(open);
              if (!open) resetForm();
            }}>
              <DialogTrigger asChild>
                <Button size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Add
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-lg">
                <DialogHeader>
                  <DialogTitle>
                    {editingAnnouncement ? "Edit" : "Create"} Announcement
                  </DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="title">Title</Label>
                    <Input
                      id="title"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="content">Content</Label>
                    <Textarea
                      id="content"
                      value={formData.content}
                      onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                      rows={5}
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="category">Category</Label>
                      <Select
                        value={formData.category_id}
                        onValueChange={(value) => setFormData({ ...formData, category_id: value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select..." />
                        </SelectTrigger>
                        <SelectContent>
                          {categories.map((cat) => (
                            <SelectItem key={cat.id} value={cat.id}>
                              {cat.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="expires">Expires At</Label>
                      <Input
                        id="expires"
                        type="date"
                        value={formData.expires_at}
                        onChange={(e) => setFormData({ ...formData, expires_at: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-4">
                    <div className="flex items-center gap-2">
                      <Switch
                        id="published"
                        checked={formData.is_published}
                        onCheckedChange={(checked) => setFormData({ ...formData, is_published: checked })}
                      />
                      <Label htmlFor="published">Publish</Label>
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch
                        id="pinned"
                        checked={formData.is_pinned}
                        onCheckedChange={(checked) => setFormData({ ...formData, is_pinned: checked })}
                      />
                      <Label htmlFor="pinned">Pin</Label>
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch
                        id="urgent"
                        checked={formData.is_urgent}
                        onCheckedChange={(checked) => setFormData({ ...formData, is_urgent: checked })}
                      />
                      <Label htmlFor="urgent">Urgent</Label>
                    </div>
                  </div>

                  <div className="flex justify-end gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setIsDialogOpen(false)}
                    >
                      Cancel
                    </Button>
                    <Button type="submit">
                      {editingAnnouncement ? "Update" : "Create"}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Date</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredAnnouncements.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                    No announcements found
                  </TableCell>
                </TableRow>
              ) : (
                filteredAnnouncements.map((announcement) => (
                  <TableRow key={announcement.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {announcement.is_pinned && (
                          <Pin className="h-3 w-3 text-primary" />
                        )}
                        {announcement.is_urgent && (
                          <AlertTriangle className="h-3 w-3 text-destructive" />
                        )}
                        <span className="font-medium">{announcement.title}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {announcement.category && (
                        <Badge variant="secondary">{announcement.category.name}</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={announcement.is_published ? "default" : "secondary"}
                        className={cn(
                          announcement.is_published && "bg-green-500/20 text-green-500"
                        )}
                      >
                        {announcement.is_published ? "Published" : "Draft"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {new Date(announcement.created_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => togglePublish(announcement)}
                          title={announcement.is_published ? "Unpublish" : "Publish"}
                        >
                          {announcement.is_published ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEdit(announcement)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(announcement.id)}
                          className="hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
