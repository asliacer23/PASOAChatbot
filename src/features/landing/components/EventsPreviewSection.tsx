import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, MapPin, ArrowRight } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { fetchLandingEvents } from "../landing.services";

const mockEvents = [
  {
    id: 1,
    title: "CBA Leadership Summit 2026",
    category: "Professional Development",
    categoryColor: "bg-indigo-500/20 text-indigo-700 border-indigo-500/30",
    date: "Feb 22, 2026",
    time: "9:00 AM - 12:00 PM",
    location: "CBA Auditorium",
    attendees: 245,
    maxAttendees: 500,
    image: "🎤",
  },
  {
    id: 2,
    title: "Networking Coffee Session",
    category: "Networking",
    categoryColor: "bg-amber-500/20 text-amber-700 border-amber-500/30",
    date: "Feb 18, 2026",
    time: "2:00 PM - 3:30 PM",
    location: "Lounge Area, Building A",
    attendees: 38,
    maxAttendees: 60,
    image: "☕",
  },
  {
    id: 3,
    title: "Workshop: Excel for Business",
    category: "Skills Training",
    categoryColor: "bg-green-500/20 text-green-700 border-green-500/30",
    date: "Feb 25, 2026",
    time: "10:00 AM - 1:00 PM",
    location: "Computer Lab, Building B",
    attendees: 156,
    maxAttendees: 200,
    image: "📊",
  },
];

export function EventsPreviewSection() {
  const navigate = useNavigate();
  const [events, setEvents] = useState(mockEvents);

  useEffect(() => {
    fetchLandingEvents()
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) setEvents(data);
      })
      .catch(() => {});
  }, []);

  return (
    <section id="events" className="relative py-16 md:py-32 overflow-hidden">
      {/* Background Gradient Orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-violet-500/10 rounded-full blur-3xl" />
        <div className="absolute top-1/2 right-0 w-96 h-96 bg-indigo-500/5 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 w-full px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 md:gap-8 mb-12 md:mb-16">
          <div className="space-y-4">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold">
              <span className="block text-foreground mb-2">Upcoming Events</span>
              <span className="block bg-gradient-to-r from-purple-600 via-violet-600 to-indigo-600 bg-clip-text text-transparent">
                Don't Miss Out
              </span>
            </h2>
            <p className="text-sm sm:text-base md:text-lg text-muted-foreground max-w-xl">
              Discover and register for exciting campus events. Connect with fellow students and expand your network.
            </p>
          </div>

          <Button
            onClick={() => navigate("/auth")}
            variant="outline"
            className="rounded-xl border-2 w-fit group hover:bg-accent"
          >
            View All Events
            <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
          </Button>
        </div>

        {/* Events Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
          {events.map((event, index) => {
            return (
              <div
                key={event.id}
                onClick={() => navigate("/auth")}
                className="group relative cursor-pointer rounded-2xl border border-border/40 bg-card/40 backdrop-blur-sm hover:border-purple-500/50 transition-all duration-300 hover:shadow-xl hover:shadow-purple-500/10 overflow-hidden hover:-translate-y-1 animate-in fade-in slide-in-from-bottom-4 duration-500"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                {/* Image Section */}
                <div className="relative h-32 bg-gradient-to-br from-purple-500/20 via-violet-500/10 to-indigo-500/5 flex items-center justify-center border-b border-border/40 group-hover:from-purple-500/30 transition-all duration-300 overflow-hidden">
                  <div className="absolute inset-0 opacity-0 group-hover:opacity-30 bg-gradient-to-r from-purple-600 to-violet-600 transition-opacity" />
                  <div className="relative text-6xl">{event.image || "🎫"}</div>
                </div>

                {/* Content */}
                <div className="p-4 sm:p-6 space-y-4">
                  {/* Title */}
                  <h3 className="text-lg font-bold text-foreground line-clamp-2 group-hover:text-purple-600 transition-colors">
                    {event.title}
                  </h3>

                  {/* Category Badge */}
                  <Badge
                    variant="outline"
                    className={`rounded-full text-xs font-semibold border w-fit ${event.categoryColor || "bg-gray-200 text-gray-700 border-gray-200"}`}
                  >
                    {event.category}
                  </Badge>

                  {/* Event Details */}
                  <div className="space-y-2 text-sm text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-purple-600" />
                      <span>{event.date}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-purple-600" />
                      <span>{event.time}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-purple-600" />
                      <span>{event.location}</span>
                    </div>
                  </div>
                </div>

                {/* Corner Accent */}
                <div className="absolute top-0 right-0 w-12 h-12 bg-gradient-to-br from-purple-500/20 to-transparent rounded-bl-2xl opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

// Helper component for clock icon
function Clock({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <circle cx="12" cy="12" r="10"></circle>
      <polyline points="12 6 12 12 16 14"></polyline>
    </svg>
  );
}
