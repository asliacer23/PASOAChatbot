import {
  MessageCircle,
  Bell,
  Calendar,
  HelpCircle,
  Zap,
  Gauge,
} from "lucide-react";

const features = [
  {
    icon: MessageCircle,
    title: "Chatbot Support",
    description:
      "Get instant answers to your questions 24/7. Smart FAQ matching and real-time support from our chatbot.",
    color: "from-blue-500 to-cyan-500",
  },
  {
    icon: Bell,
    title: "Announcements Center",
    description:
      "Stay updated with important announcements. Color-coded categories, pinned updates, and real-time notifications.",
    color: "from-purple-500 to-violet-500",
  },
  {
    icon: Calendar,
    title: "Campus Events & Registration",
    description:
      "Discover and register for campus events. Track attendees, manage capacity, and get automatic notifications.",
    color: "from-orange-500 to-pink-500",
  },
  {
    icon: HelpCircle,
    title: "Smart FAQ System",
    description:
      "Categorized FAQ database with powerful search. Organized by topics like Internships, Enrollment, and more.",
    color: "from-green-500 to-teal-500",
  },
  {
    icon: Zap,
    title: "Real-Time Notifications",
    description:
      "Get instant alerts for announcements, events, and messages. Customize your notification preferences.",
    color: "from-yellow-500 to-orange-500",
  },
  {
    icon: Gauge,
    title: "Personalized Dashboard",
    description:
      "Your personalized space with quick actions, announcements feed, and easy access to all platform features.",
    color: "from-indigo-500 to-purple-500",
  },
];

export function FeaturesSection() {
  return (
    <section id="features" className="relative py-16 md:py-32 overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-purple-500/5 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center space-y-4 mb-12 md:mb-20">
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold">
            <span className="block text-foreground mb-2">Powerful Features</span>
            <span className="block bg-gradient-to-r from-purple-600 via-violet-600 to-indigo-600 bg-clip-text text-transparent">
              Built for Student Success
            </span>
          </h2>
          <p className="text-sm sm:text-base md:text-lg text-muted-foreground max-w-2xl mx-auto">
            Everything you need to stay connected, informed, and supported throughout your college journey.
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-8">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <div
                key={index}
                className="group relative rounded-2xl border border-border/40 bg-card/40 backdrop-blur-sm p-4 sm:p-6 md:p-8 hover:border-purple-500/50 transition-all duration-300 hover:shadow-xl hover:shadow-purple-500/10 hover:-translate-y-1 overflow-hidden"
              >
                {/* Gradient Overlay on Hover */}
                <div className={`absolute inset-0 bg-gradient-to-br ${feature.color} opacity-0 group-hover:opacity-5 transition-opacity duration-300 rounded-2xl`} />

                {/* Icon Background */}
                <div className={`absolute -top-8 -right-8 w-24 h-24 bg-gradient-to-br ${feature.color} opacity-10 rounded-full blur-2xl group-hover:opacity-20 transition-opacity duration-300`} />

                {/* Content */}
                <div className="relative z-10 space-y-4">
                  {/* Icon */}
                  <div className="inline-block p-3 rounded-xl bg-gradient-to-br from-purple-500/20 to-violet-500/20 border border-purple-500/20 group-hover:border-purple-500/50 transition-colors">
                    <div className={`relative w-6 h-6 bg-gradient-to-br ${feature.color} rounded-md flex items-center justify-center`}>
                      <Icon className="w-5 h-5 text-white drop-shadow-lg" />
                    </div>
                  </div>
                  {/* Title */}
                  <h3 className="text-base sm:text-lg md:text-xl font-bold text-foreground">
                    {feature.title}
                  </h3>

                  {/* Description */}
                  <p className="text-xs sm:text-sm md:text-base text-muted-foreground leading-relaxed">
                    {feature.description}
                  </p>
                </div>

                {/* Bottom Border Accent */}
                <div className={`absolute bottom-0 left-0 h-0.5 bg-gradient-to-r ${feature.color} w-0 group-hover:w-full transition-all duration-300`} />
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
