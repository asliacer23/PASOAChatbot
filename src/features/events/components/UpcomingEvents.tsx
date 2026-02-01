import { useState, useEffect } from "react";
import { Calendar, MapPin, Clock, Users, ChevronRight, Star, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/features/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface Event {
  id: string;
  title: string;
  description: string | null;
  event_date: string;
  end_date: string | null;
  location: string | null;
  category: string;
  is_featured: boolean;
  max_attendees: number | null;
}

interface Registration {
  event_id: string;
}

export function UpcomingEvents() {
  const { user } = useAuth();
  const [events, setEvents] = useState<Event[]>([]);
  const [registrations, setRegistrations] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [registeringId, setRegisteringId] = useState<string | null>(null);

  useEffect(() => {
    fetchEvents();
    if (user) {
      fetchRegistrations();
    }
  }, [user]);

  const fetchEvents = async () => {
    try {
      const { data, error } = await supabase
        .from("events")
        .select("*")
        .eq("is_published", true)
        .order("event_date", { ascending: true });

      if (error) throw error;
      setEvents(data || []);
    } catch (error) {
      console.error("Error fetching events:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchRegistrations = async () => {
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from("event_registrations")
        .select("event_id")
        .eq("user_id", user.id);

      if (error) throw error;
      setRegistrations((data || []).map((r: Registration) => r.event_id));
    } catch (error) {
      console.error("Error fetching registrations:", error);
    }
  };

  const handleRegister = async (eventId: string) => {
    if (!user) {
      toast.error("Please sign in to register");
      return;
    }

    setRegisteringId(eventId);
    try {
      if (registrations.includes(eventId)) {
        // Unregister
        const { error } = await supabase
          .from("event_registrations")
          .delete()
          .eq("event_id", eventId)
          .eq("user_id", user.id);

        if (error) throw error;
        setRegistrations((prev) => prev.filter((id) => id !== eventId));
        toast.success("Unregistered from event");
      } else {
        // Register
        const { error } = await supabase
          .from("event_registrations")
          .insert({ event_id: eventId, user_id: user.id });

        if (error) throw error;
        setRegistrations((prev) => [...prev, eventId]);
        toast.success("Registered for event!");
      }
    } catch (error) {
      console.error("Error with registration:", error);
      toast.error("Failed to update registration");
    } finally {
      setRegisteringId(null);
    }
  };

  const formatEventDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return {
      month: date.toLocaleDateString("en-US", { month: "short" }),
      day: date.getDate(),
      time: date.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" }),
    };
  };

  const featuredEvents = events.filter((e) => e.is_featured);
  const regularEvents = events.filter((e) => !e.is_featured);

  if (isLoading) {
    return (
      <Card className="border-border/50">
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 sm:h-8 sm:w-8 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  if (events.length === 0) {
    return (
      <Card className="border-border/50">
        <CardContent className="flex flex-col items-center justify-center py-8 sm:py-12 text-center">
          <Calendar className="h-8 w-8 sm:h-12 sm:w-12 text-muted-foreground/50 mb-2 sm:mb-4" />
          <h3 className="font-semibold text-sm sm:text-base mb-1">No Upcoming Events</h3>
          <p className="text-xs sm:text-sm text-muted-foreground">
            Check back later for new campus events!
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="w-full min-h-screen bg-gradient-to-b from-background via-background to-accent/5">
      <div className="px-4 sm:px-6 md:px-8 lg:px-12 py-6 sm:py-8 md:py-12 space-y-6 sm:space-y-8 md:space-y-8 animate-fade-up w-full max-w-none">
        {/* Header - Enhanced */}
        <section className="space-y-3 relative">
          <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-accent/5 rounded-2xl blur-3xl -z-10" />
          <div className="flex items-center gap-3 sm:gap-4">
            <div className="h-11 w-11 sm:h-13 sm:w-13 rounded-xl sm:rounded-2xl bg-gradient-to-r from-primary to-blue-600 flex items-center justify-center flex-shrink-0 shadow-md">
              <Calendar className="h-5 w-5 sm:h-6 sm:w-6 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold bg-gradient-to-r from-foreground to-muted-foreground bg-clip-text text-transparent">Upcoming Events</h1>
              <p className="text-xs sm:text-sm text-muted-foreground">
                Discover and join exciting campus events
              </p>
            </div>
          </div>
        </section>
        {featuredEvents.length > 0 && (
          <div className="space-y-4 sm:space-y-6">
            {/* Section Header */}
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-primary/10 via-primary/5 to-transparent rounded-2xl blur-xl -z-10" />
              <div className="flex items-center gap-3 px-1">
                <div className="h-11 w-11 rounded-xl bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center shadow-lg">
                  <Star className="h-6 w-6 text-white fill-white" />
                </div>
                <div>
                  <h3 className="font-black text-2xl sm:text-3xl bg-gradient-to-r from-primary via-primary/80 to-primary/60 bg-clip-text text-transparent">Featured Events</h3>
                  <p className="text-xs sm:text-sm text-muted-foreground font-medium">Curated highlights you shouldn't miss</p>
                </div>
              </div>
            </div>

            <ScrollArea className="w-full whitespace-nowrap pb-4 sm:pb-6 -mx-4 sm:-mx-6 px-4 sm:px-6">
              <div className="flex gap-5 sm:gap-6">
                {featuredEvents.map((event) => {
                  const { month, day, time } = formatEventDate(event.event_date);
                  const isRegistered = registrations.includes(event.id);
                  return (
                    <div
                      key={event.id}
                      className="w-full sm:w-[380px] shrink-0 group"
                    >
                      <Card className="h-full border-0 bg-gradient-to-b from-card/95 to-card/70 backdrop-blur-2xl overflow-hidden shadow-2xl hover:shadow-[0_20px_60px_rgba(var(--primary)/0.15)] transition-all duration-500">
                        {/* Premium Header Section */}
                        <div className="relative h-40 sm:h-48 overflow-hidden bg-gradient-to-br from-primary/40 via-primary/30 to-primary/20">
                          {/* Animated background elements */}
                          <div className="absolute inset-0 opacity-20">
                            <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-bl from-primary rounded-full blur-3xl" />
                            <div className="absolute bottom-0 left-0 w-32 h-32 bg-gradient-to-tr from-primary/80 rounded-full blur-3xl" />
                          </div>
                          
                          {/* Gradient overlay */}
                          <div className="absolute inset-0 bg-gradient-to-t from-card via-transparent to-transparent" />
                          
                          {/* Large calendar icon */}
                          <div className="absolute inset-0 flex items-center justify-center">
                            <Calendar className="h-24 sm:h-32 text-primary/20 transition-transform duration-500" />
                          </div>

                          {/* Featured Badge - Premium */}
                          <div className="absolute top-4 right-4 z-20">
                            <div className="px-4 py-2 rounded-full bg-gradient-to-r from-primary to-primary/80 shadow-xl shadow-primary/30 backdrop-blur-md border border-primary/50">
                              <div className="flex items-center gap-2 text-white">
                                <Star className="h-4 w-4 fill-white" />
                                <span className="font-black text-sm">FEATURED</span>
                              </div>
                            </div>
                          </div>
                        </div>

                        <CardContent className="p-6 sm:p-7 space-y-5">
                          {/* Date & Time Row */}
                          <div className="flex items-center gap-4">
                            <div className="relative">
                              <div className="absolute inset-0 bg-gradient-to-br from-primary/30 to-primary/20 rounded-xl blur" />
                              <div className="relative px-4 py-3 rounded-xl bg-gradient-to-br from-primary/20 to-primary/10 border border-primary/40 backdrop-blur-sm text-center min-w-max">
                                <p className="text-xs font-black text-primary uppercase tracking-wider">{month}</p>
                                <p className="text-3xl font-black bg-gradient-to-br from-primary to-primary/70 bg-clip-text text-transparent">{day}</p>
                              </div>
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                                <Clock className="h-5 w-5 text-primary flex-shrink-0" />
                                <span>{time}</span>
                              </div>
                            </div>
                          </div>

                          {/* Title - Large & Bold */}
                          <div className="space-y-2">
                            <h4 className="text-xl sm:text-2xl font-black text-foreground line-clamp-2 transition-all duration-300">
                              {event.title}
                            </h4>
                          </div>

                          {/* Event Details - Compact but Rich */}
                          <div className="space-y-2.5 bg-primary/5 rounded-lg p-4 border border-primary/10">
                            {event.location && (
                              <div className="flex items-start gap-3">
                                <MapPin className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
                                <span className="text-sm font-medium text-foreground">{event.location}</span>
                              </div>
                            )}
                            {event.max_attendees && (
                              <div className="flex items-center gap-3">
                                <Users className="h-4 w-4 text-primary flex-shrink-0" />
                                <span className="text-sm font-medium text-foreground">Up to {event.max_attendees} attendees</span>
                              </div>
                            )}
                            {event.category && (
                              <div className="flex items-center gap-3">
                                <div className="h-1 w-1 rounded-full bg-primary" />
                                <Badge variant="outline" className="bg-primary/10 text-primary border-primary/30 font-black capitalize text-xs">
                                  {event.category}
                                </Badge>
                              </div>
                            )}
                          </div>

                          {/* Description */}
                          {event.description && (
                            <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">
                              {event.description}
                            </p>
                          )}

                          {/* Register Button - Premium */}
                          <Button
                            className={cn(
                              "w-full h-12 font-black text-sm sm:text-base rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl",
                              isRegistered
                                ? "bg-gradient-to-r from-green-500 to-emerald-600 hover:shadow-emerald-500/40 text-white border-0"
                                : "bg-gradient-to-r from-violet-600 to-violet-700 hover:bg-gradient-to-r hover:from-violet-500 hover:to-violet-600 hover:shadow-violet-500/40 text-white border-0"
                            )}
                            onClick={() => handleRegister(event.id)}
                            disabled={registeringId === event.id}
                          >
                            {registeringId === event.id ? (
                              <Loader2 className="h-5 w-5 animate-spin" />
                            ) : isRegistered ? (
                              <span className="flex items-center gap-2 font-black">
                                <Star className="h-5 w-5 fill-white" />
                                You're Registered
                              </span>
                            ) : (
                              <span className="flex items-center gap-2 font-black">
                                <Star className="h-5 w-5 fill-white" />
                                Secure Your Spot
                              </span>
                            )}
                          </Button>
                        </CardContent>
                      </Card>
                    </div>
                  );
                })}
              </div>
              <ScrollBar orientation="horizontal" />
            </ScrollArea>
          </div>
        )}

        {/* Regular Events - Enhanced */}
        <Card className="border-border/30 bg-card/60 backdrop-blur-sm hover:shadow-md transition-all duration-300">
          <CardHeader className="pb-3 sm:pb-4 p-5 sm:p-6">
            <CardTitle className="text-lg sm:text-xl font-semibold flex items-center gap-3">
              <Calendar className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
              Upcoming Events
            </CardTitle>
          </CardHeader>
          <CardContent className="p-5 sm:p-6 pt-0 space-y-2 sm:space-y-3">
            {regularEvents.length === 0 && featuredEvents.length > 0 ? (
              <p className="text-xs sm:text-sm text-muted-foreground text-center py-4">
                All upcoming events are featured above!
              </p>
            ) : (
              regularEvents.map((event) => {
                const { month, day, time } = formatEventDate(event.event_date);
                const isRegistered = registrations.includes(event.id);
                return (
                  <div
                    key={event.id}
                    className="flex items-start sm:items-center gap-3 sm:gap-4 p-4 sm:p-5 rounded-xl sm:rounded-2xl hover:bg-card/80 transition-all border border-border/20 bg-card/50 active:scale-95"
                  >
                    <div className="text-center px-3 py-2 rounded-lg bg-primary/10 shrink-0">
                      <p className="text-xs font-semibold text-primary uppercase">{month}</p>
                      <p className="text-lg sm:text-xl font-bold">{day}</p>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-sm sm:text-base truncate">{event.title}</h4>
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground mt-1">
                        <span className="flex items-center gap-1">
                          <Clock className="h-3.5 w-3.5" />
                          {time}
                        </span>
                        {event.location && (
                          <span className="flex items-center gap-1">
                            <MapPin className="h-3.5 w-3.5" />
                            <span className="truncate">{event.location}</span>
                          </span>
                        )}
                        {event.max_attendees && (
                          <span className="flex items-center gap-1">
                            <Users className="h-3.5 w-3.5" />
                            {event.max_attendees} spots
                          </span>
                        )}
                      </div>
                      <Badge variant="outline" className="text-xs mt-2 capitalize inline-block bg-primary/5 text-primary border-primary/20 font-medium">
                        {event.category}
                      </Badge>
                    </div>
                    <Button
                      size="sm"
                      variant={isRegistered ? "default" : "outline"}
                      className={cn(
                        "shrink-0 text-xs sm:text-sm h-9 px-3 font-medium transition-all",
                        isRegistered && "bg-green-500 hover:bg-green-600 border-green-500 text-white"
                      )}
                      onClick={() => handleRegister(event.id)}
                      disabled={registeringId === event.id}
                    >
                      {registeringId === event.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : isRegistered ? (
                        <span className="hidden sm:inline">Going ✓</span>
                      ) : (
                        <span className="hidden sm:inline">Join</span>
                      )}
                      {registeringId !== event.id && (
                        <span className="inline sm:hidden">{isRegistered ? "✓" : "+"}</span>
                      )}
                    </Button>
                  </div>
                );
              })
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
