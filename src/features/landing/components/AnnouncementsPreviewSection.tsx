import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, Pin } from "lucide-react";

import { useEffect, useState } from "react";
import { fetchLandingAnnouncements } from "../landing.services";

const mockAnnouncements = [
  {
    id: 1,
    title: "CBA Mid-Year Internship Fair",
    category: "Events",
    categoryColor: "bg-blue-500/20 text-blue-700 border-blue-500/30",
    date: "Feb 15, 2026 • 2:00 PM",
    icon: "📅",
    isPinned: true,
    content: "Join us for the CBA Mid-Year Internship Fair featuring top companies seeking interns.",
  },
  {
    id: 2,
    title: "Spring Semester Class Schedule",
    category: "Academic",
    categoryColor: "bg-purple-500/20 text-purple-700 border-purple-500/30",
    date: "Feb 10, 2026 • 10:30 AM",
    icon: "📚",
    isPinned: false,
    content: "The Spring 2026 class schedule is now posted on your student portal.",
  },
  {
    id: 3,
    title: "Campus WiFi Maintenance Notice",
    category: "Facilities",
    categoryColor: "bg-orange-500/20 text-orange-700 border-orange-500/30",
    date: "Feb 8, 2026 • 3:45 PM",
    icon: "🔧",
    isPinned: false,
    content: "WiFi maintenance will be performed on Feb 12 from 11 PM to 4 AM.",
  },
];

export function AnnouncementsPreviewSection() {
  const [announcements, setAnnouncements] = useState(mockAnnouncements);
  useEffect(() => {
    fetchLandingAnnouncements()
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) setAnnouncements(data);
      })
      .catch(() => {});
  }, []);
  return (
    <section id="announcements" className="relative py-16 md:py-32 overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-0 w-96 h-96 bg-purple-500/5 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 md:gap-8 mb-12 md:mb-16">
          <div className="space-y-4">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold">
              <span className="block text-foreground mb-2">Latest Announcements</span>
              <span className="block bg-gradient-to-r from-purple-600 via-violet-600 to-indigo-600 bg-clip-text text-transparent">
                Stay Informed
              </span>
            </h2>
            <p className="text-sm sm:text-base md:text-lg text-muted-foreground max-w-xl">
              Never miss important updates. View all announcements from your college dashboard.
            </p>
          </div>

          <Button
            variant="outline"
            className="rounded-xl border-2 w-fit group hover:bg-accent"
          >
            View All Announcements
            <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
          </Button>
        </div>

        {/* Announcements Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
          {announcements.map((announcement, index) => (
            <div
              key={announcement.id}
              className="group relative rounded-2xl border border-border/40 bg-card/40 backdrop-blur-sm hover:border-purple-500/50 transition-all duration-300 hover:shadow-xl hover:shadow-purple-500/10 overflow-hidden hover:-translate-y-1 animate-in fade-in slide-in-from-bottom-4 duration-500"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              {/* Content */}
              <div className="p-4 sm:p-6 space-y-4">
                {/* Header with Pin */}
                <div className="flex items-start justify-between gap-3">
                  <div className="text-3xl">{announcement.icon || "📢"}</div>
                  {announcement.isPinned && (
                    <Pin className="w-4 h-4 text-purple-600 fill-purple-600" />
                  )}
                </div>

                {/* Title */}
                <h3 className="text-lg font-bold text-foreground line-clamp-2 group-hover:text-purple-600 transition-colors">
                  {announcement.title}
                </h3>

                {/* Content Preview */}
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {announcement.content}
                </p>

                {/* Footer */}
                <div className="flex items-center justify-between pt-4 border-t border-border/40">
                  <Badge
                    variant="outline"
                    className={`rounded-full text-xs font-semibold border ${announcement.categoryColor || "bg-gray-200 text-gray-700 border-gray-200"}`}
                  >
                    {announcement.category}
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    {announcement.date}
                  </span>
                </div>
              </div>

              {/* Hover Overlay */}
              <div className="absolute inset-0 bg-gradient-to-r from-purple-500/0 to-violet-500/0 group-hover:from-purple-500/5 group-hover:to-violet-500/5 transition-colors pointer-events-none rounded-2xl" />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
