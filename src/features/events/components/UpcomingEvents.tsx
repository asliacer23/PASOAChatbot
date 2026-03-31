import { useState, useEffect } from "react";
import { Calendar, MapPin, Clock, Users, Star, Loader2, Eye } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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

export function UpcomingEvents() {
  const [events, setEvents] = useState<Event[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);

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

  const handleExpand = (id: string) => {
    setExpandedId((prev) => (prev === id ? null : id));
  };

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
      <div className="px-3 sm:px-6 md:px-8 lg:px-12 py-6 sm:py-8 md:py-12 space-y-8 sm:space-y-12 md:space-y-12 w-full max-w-none">
        {/* Header - Enhanced with gradient and better spacing */}
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
          <div className="space-y-5 sm:space-y-6">
            {/* Section Header */}
            <div className="flex items-start sm:items-center gap-3 px-0">
              <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center flex-shrink-0">
                <Star className="h-5 w-5 text-primary fill-primary" />
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-lg sm:text-2xl text-foreground">Featured Events</h3>
                <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">Don't miss these highlights</p>
              </div>
            </div>

            {/* Featured Events Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5 md:gap-6">
              {featuredEvents.map((event) => {
                const { month, day, time } = formatEventDate(event.event_date);
                const isExpanded = expandedId === event.id;

                return (
                  <div
                    key={event.id}
                    className="group"
                  >
                    <Card
                      onClick={() => handleExpand(event.id)}
                      className="h-full border border-primary/20 bg-gradient-to-br from-card to-card/80 hover:border-primary/40 hover:shadow-lg transition-all duration-300 active:scale-95 sm:active:scale-100 cursor-pointer"
                    >
                      <CardContent className="p-4 sm:p-6 space-y-4">
                        {/* Featured Badge */}
                        <div className="flex items-center gap-2">
                          <Star className="h-4 w-4 text-primary fill-primary" />
                          <span className="text-xs font-bold text-primary uppercase tracking-wider">Featured</span>
                        </div>

                        {/* Date & Time Row - Enhanced Mobile */}
                        <div className="flex items-center gap-3 sm:gap-4">
                          <div className="px-3 py-2 rounded-lg bg-gradient-to-br from-primary/15 to-primary/5 border border-primary/30 text-center min-w-max shrink-0">
                            <p className="text-xs font-semibold text-primary uppercase">{month}</p>
                            <p className="text-2xl sm:text-3xl font-bold text-foreground">{day}</p>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 text-sm sm:text-base font-medium text-muted-foreground">
                              <Clock className="h-4 w-4 text-primary flex-shrink-0" />
                              <span className="truncate">{time}</span>
                            </div>
                          </div>
                        </div>

                        {/* Title */}
                        <div className="space-y-2">
                          <h4 className="text-base sm:text-lg font-bold text-foreground line-clamp-3 leading-snug group-hover:text-primary transition-colors">
                            {event.title}
                          </h4>
                        </div>

                        {/* Event Details */}
                        <div className="space-y-3 text-xs sm:text-sm text-muted-foreground border-t border-border/40 pt-4">
                          {event.location && (
                            <div className="flex items-start gap-2">
                              <MapPin className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
                              <span className="line-clamp-2 break-words">{event.location}</span>
                            </div>
                          )}
                          {event.max_attendees && (
                            <div className="flex items-center gap-2">
                              <Users className="h-4 w-4 text-primary flex-shrink-0" />
                              <span>Up to {event.max_attendees} attendees</span>
                            </div>
                          )}
                          {event.category && (
                            <Badge variant="outline" className="bg-primary/5 text-primary border-primary/30 capitalize text-xs font-medium mt-1">
                              {event.category}
                            </Badge>
                          )}
                        </div>

                        {/* Description */}
                        {event.description && (
                          <p className={cn(
                            "text-xs sm:text-sm text-muted-foreground border-t border-border/40 pt-4 whitespace-pre-wrap",
                            !isExpanded && "line-clamp-2"
                          )}>
                            {event.description}
                          </p>
                        )}

                        <div className="flex justify-end border-t border-border/40 pt-3">
                          <Button variant="ghost" size="sm" className="text-xs h-8 px-3 text-primary hover:bg-primary/5 font-medium transition-all">
                            <Eye className="h-3.5 w-3.5 mr-1" />
                            {isExpanded ? "Less" : "More"}
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Regular Events - Enhanced Mobile */}
        <Card className="border border-border/40 bg-card/60 backdrop-blur-sm hover:border-border/60 transition-all duration-300">
          <CardHeader className="pb-4 sm:pb-5 p-4 sm:p-6 border-b border-border/40">
            <CardTitle className="text-lg sm:text-xl font-bold flex items-center gap-3">
              <Calendar className="h-5 w-5 text-primary" />
              Upcoming Events
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0 sm:p-6 sm:pt-0 space-y-0 sm:space-y-3">
            {regularEvents.length === 0 && featuredEvents.length > 0 ? (
              <p className="text-xs sm:text-sm text-muted-foreground text-center py-6 sm:py-8">
                All upcoming events are featured above!
              </p>
            ) : (
              regularEvents.map((event) => {
                const { month, day, time } = formatEventDate(event.event_date);
                const isExpanded = expandedId === event.id;

                return (
                  <div
                    key={event.id}
                    onClick={() => handleExpand(event.id)}
                    className="flex items-start gap-3 sm:gap-4 p-4 sm:p-5 hover:bg-accent/40 transition-colors border-b sm:border sm:border-border/30 sm:rounded-lg last:border-0 active:bg-accent/60 sm:active:bg-accent/40 cursor-pointer"
                  >
                    {/* Date Badge */}
                    <div className="text-center px-2 sm:px-3 py-2 rounded-lg bg-primary/10 border border-primary/20 shrink-0">
                      <p className="text-xs font-semibold text-primary uppercase leading-tight">{month}</p>
                      <p className="text-lg sm:text-xl font-bold text-foreground">{day}</p>
                    </div>

                    {/* Event Info */}
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-sm sm:text-base text-foreground line-clamp-2 leading-snug">
                        {event.title}
                      </h4>
                      <div className="flex flex-wrap items-center gap-x-2 sm:gap-x-3 gap-y-1.5 text-xs text-muted-foreground mt-2">
                        <span className="flex items-center gap-1">
                          <Clock className="h-3.5 w-3.5 flex-shrink-0" />
                          <span className="truncate">{time}</span>
                        </span>
                        {event.location && (
                          <span className="flex items-center gap-1 truncate">
                            <MapPin className="h-3.5 w-3.5 flex-shrink-0" />
                            <span className="truncate text-xs">{event.location}</span>
                          </span>
                        )}
                        {event.max_attendees && (
                          <span className="flex items-center gap-1">
                            <Users className="h-3.5 w-3.5 flex-shrink-0" />
                            <span className="text-xs">{event.max_attendees} spots</span>
                          </span>
                        )}
                      </div>
                      {event.category && (
                        <Badge variant="outline" className="text-xs mt-2 capitalize inline-block bg-primary/5 text-primary border-primary/20 font-medium">
                          {event.category}
                        </Badge>
                      )}
                      {event.description && (
                        <p className={cn(
                          "text-xs sm:text-sm text-muted-foreground mt-2 whitespace-pre-wrap",
                          !isExpanded && "line-clamp-2"
                        )}>
                          {event.description}
                        </p>
                      )}
                      <div className="flex justify-end mt-2">
                        <Button variant="ghost" size="sm" className="text-xs h-7 px-2 text-primary hover:bg-primary/5 font-medium transition-all">
                          <Eye className="h-3.5 w-3.5 mr-1" />
                          {isExpanded ? "Less" : "More"}
                        </Button>
                      </div>
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
