import { useState, useEffect } from "react";
import {
  Calendar,
  Plus,
  Edit,
  Trash2,
  MapPin,
  Users,
  Clock,
  Eye,
  EyeOff,
  Star,
  Loader2,
  Search,
  Image,
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
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface Event {
  id: string;
  title: string;
  description: string | null;
  event_date: string;
  end_date: string | null;
  location: string | null;
  image_url: string | null;
  category: string;
  is_featured: boolean;
  is_published: boolean;
  max_attendees: number | null;
  created_at: string;
  registrations_count?: number;
}

const categories = [
  { value: "general", label: "General" },
  { value: "academic", label: "Academic" },
  { value: "sports", label: "Sports" },
  { value: "cultural", label: "Cultural" },
  { value: "workshop", label: "Workshop" },
  { value: "seminar", label: "Seminar" },
  { value: "social", label: "Social" },
];

export function EventsManagement() {
  const { user } = useAuth();
  const [events, setEvents] = useState<Event[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    event_date: "",
    end_date: "",
    location: "",
    category: "general",
    is_featured: false,
    is_published: false,
    max_attendees: "",
  });

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    try {
      const { data, error } = await supabase
        .from("events")
        .select("*")
        .order("event_date", { ascending: true });

      if (error) throw error;
      setEvents(data || []);
    } catch (error) {
      console.error("Error fetching events:", error);
      toast.error("Failed to load events");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    try {
      const eventData = {
        title: formData.title,
        description: formData.description || null,
        event_date: new Date(formData.event_date).toISOString(),
        end_date: formData.end_date ? new Date(formData.end_date).toISOString() : null,
        location: formData.location || null,
        category: formData.category,
        is_featured: formData.is_featured,
        is_published: formData.is_published,
        max_attendees: formData.max_attendees ? parseInt(formData.max_attendees) : null,
        created_by: user.id,
      };

      if (editingEvent) {
        const { error } = await supabase
          .from("events")
          .update(eventData)
          .eq("id", editingEvent.id);

        if (error) throw error;
        toast.success("Event updated");
      } else {
        const { error } = await supabase
          .from("events")
          .insert(eventData);

        if (error) throw error;
        toast.success("Event created");
      }

      setIsDialogOpen(false);
      resetForm();
      fetchEvents();
    } catch (error) {
      console.error("Error saving event:", error);
      toast.error("Failed to save event");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this event?")) return;

    try {
      const { error } = await supabase.from("events").delete().eq("id", id);
      if (error) throw error;
      toast.success("Event deleted");
      fetchEvents();
    } catch (error) {
      console.error("Error deleting event:", error);
      toast.error("Failed to delete event");
    }
  };

  const handleEdit = (event: Event) => {
    setEditingEvent(event);
    setFormData({
      title: event.title,
      description: event.description || "",
      event_date: event.event_date.slice(0, 16),
      end_date: event.end_date?.slice(0, 16) || "",
      location: event.location || "",
      category: event.category,
      is_featured: event.is_featured,
      is_published: event.is_published,
      max_attendees: event.max_attendees?.toString() || "",
    });
    setIsDialogOpen(true);
  };

  const togglePublish = async (event: Event) => {
    try {
      const { error } = await supabase
        .from("events")
        .update({ is_published: !event.is_published })
        .eq("id", event.id);

      if (error) throw error;
      toast.success(event.is_published ? "Event unpublished" : "Event published");
      fetchEvents();
    } catch (error) {
      toast.error("Failed to update event");
    }
  };

  const toggleFeatured = async (event: Event) => {
    try {
      const { error } = await supabase
        .from("events")
        .update({ is_featured: !event.is_featured })
        .eq("id", event.id);

      if (error) throw error;
      toast.success(event.is_featured ? "Removed from featured" : "Added to featured");
      fetchEvents();
    } catch (error) {
      toast.error("Failed to update event");
    }
  };

  const resetForm = () => {
    setEditingEvent(null);
    setFormData({
      title: "",
      description: "",
      event_date: "",
      end_date: "",
      location: "",
      category: "general",
      is_featured: false,
      is_published: false,
      max_attendees: "",
    });
  };

  const filteredEvents = events.filter((e) =>
    e.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    e.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const upcomingEvents = filteredEvents.filter(e => new Date(e.event_date) >= new Date());
  const pastEvents = filteredEvents.filter(e => new Date(e.event_date) < new Date());

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6 md:space-y-8">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 md:gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Calendar className="h-5 w-5 text-primary" />
            </div>
            <h2 className="text-2xl md:text-3xl font-bold">Events Management</h2>
          </div>
          <p className="text-sm md:text-base text-muted-foreground">
            Create and manage campus events
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={(open) => {
          setIsDialogOpen(open);
          if (!open) resetForm();
        }}>
          <DialogTrigger asChild>
            <Button className="bg-primary hover:bg-primary/90 h-10 whitespace-nowrap">
              <Plus className="h-4 w-4 mr-2" />
              Add Event
            </Button>
          </DialogTrigger>
            <DialogContent className="max-w-lg w-[95vw] sm:w-full max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="text-xl">
                  {editingEvent ? "Edit" : "Create"} Event
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="title" className="text-sm">Event Title</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="Enter event title"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description" className="text-sm">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Event description"
                    rows={3}
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="event_date" className="text-sm">Start Date & Time</Label>
                    <Input
                      id="event_date"
                      type="datetime-local"
                      value={formData.event_date}
                      onChange={(e) => setFormData({ ...formData, event_date: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="end_date" className="text-sm">End Date & Time</Label>
                    <Input
                      id="end_date"
                      type="datetime-local"
                      value={formData.end_date}
                      onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="location" className="text-sm">Location</Label>
                    <Input
                      id="location"
                      value={formData.location}
                      onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                      placeholder="e.g., CBA Auditorium"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="category" className="text-sm">Category</Label>
                    <Select
                      value={formData.category}
                      onValueChange={(value) => setFormData({ ...formData, category: value })}
                    >
                      <SelectTrigger id="category">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map((cat) => (
                          <SelectItem key={cat.value} value={cat.value}>
                            {cat.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="max_attendees" className="text-sm">Max Attendees (optional)</Label>
                  <Input
                    id="max_attendees"
                    type="number"
                    value={formData.max_attendees}
                    onChange={(e) => setFormData({ ...formData, max_attendees: e.target.value })}
                    placeholder="Leave empty for unlimited"
                  />
                </div>

                <div className="space-y-3 pt-4 border-t border-border/50">
                  <h4 className="font-semibold text-sm">Settings</h4>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="published" className="text-sm">Publish Event</Label>
                      <Switch
                        id="published"
                        checked={formData.is_published}
                        onCheckedChange={(checked) => setFormData({ ...formData, is_published: checked })}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label htmlFor="featured" className="text-sm">Feature Event</Label>
                      <Switch
                        id="featured"
                        checked={formData.is_featured}
                        onCheckedChange={(checked) => setFormData({ ...formData, is_featured: checked })}
                      />
                    </div>
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-4 border-t border-border/50">
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" className="bg-primary hover:bg-primary/90">
                    {editingEvent ? "Update Event" : "Create Event"}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
      </div>

      

      {/* Filters Section */}
      <Card className="border border-border/50 p-4 sm:p-6">
        <div className="space-y-4">
          <h3 className="font-semibold text-sm md:text-base">Search Events</h3>
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by title or description..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 rounded-lg bg-background border-border/50 focus:border-primary transition-colors"
            />
          </div>
        </div>
      </Card>

      {/* Events List */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-12 sm:py-16">
          <Loader2 className="h-8 w-8 sm:h-10 sm:w-10 animate-spin text-primary mb-3" />
          <p className="text-sm text-muted-foreground">Loading events...</p>
        </div>
      ) : (
        <div>
          {filteredEvents.length === 0 ? (
            <Card className="border border-border/50">
              <CardContent className="py-12 sm:py-16 text-center">
                <div className="flex flex-col items-center gap-3">
                  <Calendar className="h-8 w-8 text-muted-foreground/50" />
                  <div>
                    <p className="font-medium text-muted-foreground text-sm sm:text-base">No events found</p>
                    <p className="text-xs sm:text-sm text-muted-foreground mt-1">Try adjusting your search or create a new event</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-3 sm:gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
              {filteredEvents.map((event) => (
                <Card key={event.id} className={cn(
                  "border border-border/50 overflow-hidden hover:border-primary/30 transition-all duration-300",
                  event.is_featured && "ring-1 ring-primary/30"
                )}>
                  {/* Card Content */}
                  <CardContent className="p-4 sm:p-6 space-y-4">
                    {/* Title and Badges */}
                    <div className="space-y-3">
                      <div>
                        <h3 className="font-semibold text-sm sm:text-base line-clamp-2 text-foreground">{event.title}</h3>
                        <p className="text-xs sm:text-sm text-muted-foreground line-clamp-2 mt-1">
                          {event.description || "No description"}
                        </p>
                      </div>
                      <div className="flex items-center flex-wrap gap-2">
                        <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20 text-xs capitalize">
                          {event.category}
                        </Badge>
                        {event.is_featured && (
                          <Badge variant="outline" className="text-xs text-primary border-primary/30 bg-primary/5">
                            ⭐ Featured
                          </Badge>
                        )}
                      </div>
                    </div>

                    {/* Event Details */}
                    <div className="space-y-2 text-xs sm:text-sm text-muted-foreground border-t border-border/50 pt-4">
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-primary flex-shrink-0" />
                        <span className="line-clamp-1">
                          {new Date(event.event_date).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })} at {new Date(event.event_date).toLocaleTimeString("en-US", {
                            hour: "numeric",
                            minute: "2-digit",
                          })}
                        </span>
                      </div>
                      {event.location && (
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4 text-primary flex-shrink-0" />
                          <span className="line-clamp-1">{event.location}</span>
                        </div>
                      )}
                      {event.max_attendees && (
                        <div className="flex items-center gap-2">
                          <Users className="h-4 w-4 text-primary flex-shrink-0" />
                          <span>Max {event.max_attendees} attendees</span>
                        </div>
                      )}
                    </div>

                    {/* Status and Actions */}
                    <div className="flex items-center justify-between pt-4 border-t border-border/50">
                      <Badge variant={event.is_published ? "default" : "secondary"} className="text-xs">
                        {event.is_published ? "Published" : "Draft"}
                      </Badge>
                      <div className="flex items-center gap-1">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          onClick={() => togglePublish(event)}
                          className="h-8 w-8 hover:bg-accent transition-colors"
                          title={event.is_published ? "Unpublish" : "Publish"}
                        >
                          {event.is_published ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          onClick={() => toggleFeatured(event)}
                          className="h-8 w-8 hover:bg-accent transition-colors"
                          title={event.is_featured ? "Unfeature" : "Feature"}
                        >
                          <Star className={cn("h-4 w-4", event.is_featured && "fill-primary text-primary")} />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          onClick={() => handleEdit(event)}
                          className="h-8 w-8 hover:bg-accent transition-colors"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          onClick={() => handleDelete(event.id)}
                          className="h-8 w-8 hover:bg-destructive/10 text-destructive transition-colors"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
