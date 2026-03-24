import { useState, useEffect } from "react";
import { Calendar, MapPin, Clock, Users, Star, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";

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

export function UpcomingEvents() {
  const [events, setEvents] = useState<Event[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchEvents();
  }, []);

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
    <div className="w-full min-h-screen bg-background">
      <div className="px-4 sm:px-6 md:px-8 lg:px-12 py-6 sm:py-8 md:py-12 space-y-6 sm:space-y-8 md:space-y-8 w-full max-w-none">
        {/* Header - Clean */}
        <section className="space-y-3">
          <div className="flex items-center gap-3 sm:gap-4">
            <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
              <Calendar className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-foreground">Upcoming Events</h1>
              <p className="text-xs sm:text-sm text-muted-foreground">
                Discover and join exciting campus events
              </p>
            </div>
          </div>
        </section>
        {featuredEvents.length > 0 && (
          <div className="space-y-4 sm:space-y-6">
            {/* Section Header */}
            <div className="flex items-center gap-3 px-1">
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Star className="h-5 w-5 text-primary fill-primary" />
              </div>
              <div>
                <h3 className="font-bold text-xl sm:text-2xl text-foreground">Featured Events</h3>
                <p className="text-xs sm:text-sm text-muted-foreground">Don't miss these highlights</p>
              </div>
            </div>

            <ScrollArea className="w-full whitespace-nowrap pb-4 sm:pb-6 -mx-4 sm:-mx-6 px-4 sm:px-6">
              <div className="flex gap-4 sm:gap-6">
                {featuredEvents.map((event) => {
                  const { month, day, time } = formatEventDate(event.event_date);
                  return (
                    <div
                      key={event.id}
                      className="w-full sm:w-[360px] shrink-0"
                    >
                      <Card className="h-full border border-border/50 bg-card hover:border-primary/30 transition-all duration-300">
                        <CardContent className="p-5 sm:p-6 space-y-4">
                          {/* Featured Badge */}
                          <div className="flex items-center gap-2">
                            <Star className="h-4 w-4 text-primary fill-primary" />
                            <span className="text-xs font-semibold text-primary uppercase tracking-wider">Featured</span>
                          </div>

                          {/* Date & Time Row */}
                          <div className="flex items-center gap-3">
                            <div className="px-3 py-2 rounded-lg bg-primary/10 border border-primary/20 text-center min-w-max">
                              <p className="text-xs font-semibold text-primary uppercase">{month}</p>
                              <p className="text-2xl font-bold text-foreground">{day}</p>
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                                <Clock className="h-4 w-4 text-primary flex-shrink-0" />
                                <span>{time}</span>
                              </div>
                            </div>
                          </div>

                          {/* Title */}
                          <div className="space-y-2">
                            <h4 className="text-lg sm:text-xl font-semibold text-foreground line-clamp-2">
                              {event.title}
                            </h4>
                          </div>

                          {/* Event Details */}
                          <div className="space-y-2 text-sm text-muted-foreground border-t border-border/50 pt-4">
                            {event.location && (
                              <div className="flex items-start gap-2">
                                <MapPin className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
                                <span className="line-clamp-2">{event.location}</span>
                              </div>
                            )}
                            {event.max_attendees && (
                              <div className="flex items-center gap-2">
                                <Users className="h-4 w-4 text-primary flex-shrink-0" />
                                <span>Up to {event.max_attendees} attendees</span>
                              </div>
                            )}
                            {event.category && (
                              <Badge variant="outline" className="bg-transparent text-primary border-primary/30 capitalize text-xs mt-2">
                                {event.category}
                              </Badge>
                            )}
                          </div>

                          {/* Description */}
                          {event.description && (
                            <p className="text-sm text-muted-foreground line-clamp-2 border-t border-border/50 pt-4">
                              {event.description}
                            </p>
                          )}
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

        {/* Regular Events - Clean */}
        <Card className="border border-border/50 bg-card hover:border-border transition-all duration-300">
          <CardHeader className="pb-3 sm:pb-4 p-5 sm:p-6 border-b border-border/50">
            <CardTitle className="text-lg sm:text-xl font-semibold flex items-center gap-3">
              <Calendar className="h-5 w-5 text-primary" />
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
                return (
                  <div
                    key={event.id}
                    className="flex items-start sm:items-center gap-3 sm:gap-4 p-4 sm:p-5 rounded-lg hover:bg-accent/50 transition-all border border-border/30"
                  >
                    <div className="text-center px-3 py-2 rounded-lg bg-primary/10 border border-primary/20 shrink-0">
                      <p className="text-xs font-semibold text-primary uppercase">{month}</p>
                      <p className="text-lg sm:text-xl font-bold text-foreground">{day}</p>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-sm sm:text-base truncate text-foreground">{event.title}</h4>
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
                      <Badge variant="outline" className="text-xs mt-2 capitalize inline-block bg-primary/5 text-primary border-primary/20">
                        {event.category}
                      </Badge>
                    </div>
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


