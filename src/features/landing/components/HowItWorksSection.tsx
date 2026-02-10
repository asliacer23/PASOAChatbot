import {
  UserPlus,
  Mail,
  LogIn,
  Zap,
  ArrowRight,
} from "lucide-react";

const steps = [
  {
    number: "01",
    icon: UserPlus,
    title: "Sign Up",
    description: "Create your account using your student email address",
  },
  {
    number: "02",
    icon: Mail,
    title: "Verify Email",
    description: "Confirm your email to activate your PASOA Hub account",
  },
  {
    number: "03",
    icon: LogIn,
    title: "Access Platform",
    description: "Log in and explore announcements, events, and chat support",
  },
  {
    number: "04",
    icon: Zap,
    title: "Stay Connected",
    description: "Receive notifications and stay updated with your community",
  },
];

export function HowItWorksSection() {
  return (
    <section id="how-it-works" className="relative py-16 md:py-32 overflow-hidden">
      {/* Background Gradient */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -bottom-40 right-0 w-80 h-80 bg-violet-500/10 rounded-full blur-3xl" />
        <div className="absolute -top-40 left-1/2 w-96 h-96 bg-purple-500/5 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center space-y-4 mb-16 md:mb-20">
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold">
            <span className="block text-foreground mb-2">How It Works</span>
            <span className="block bg-gradient-to-r from-purple-600 via-violet-600 to-indigo-600 bg-clip-text text-transparent">
              Get Started in 4 Easy Steps
            </span>
          </h2>
          <p className="text-sm sm:text-base md:text-lg text-muted-foreground max-w-2xl mx-auto">
            Join the PASOA community in minutes and start enjoying all the benefits.
          </p>
        </div>

        {/* Steps Container */}
        <div className="relative">
          {/* Desktop Connection Line */}
          <div className="hidden lg:block absolute top-1/4 left-0 right-0 h-1 bg-gradient-to-r from-purple-500 via-violet-500 to-indigo-500 opacity-30" />

          {/* Steps Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 md:gap-6">
            {steps.map((step, index) => {
              const Icon = step.icon;
              return (
                <div key={index} className="relative">
                  {/* Step Card */}
                  <div className="space-y-4 md:space-y-6">
                    {/* Icon Circle */}
                    <div className="relative z-20 inline-block">
                      <div className="absolute inset-0 bg-gradient-to-br from-purple-600 to-violet-600 rounded-2xl blur-xl opacity-30 group-hover:opacity-50 transition-opacity" />
                      <div className="relative w-16 h-16 md:w-20 md:h-20 rounded-2xl bg-gradient-to-br from-purple-500 to-violet-600 flex items-center justify-center shadow-lg">
                        <Icon className="w-8 h-8 md:w-10 md:h-10 text-white" />
                      </div>

                      {/* Step Number */}
                      <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-background border-2 border-gradient-to-r from-purple-500 to-violet-600 rounded-full flex items-center justify-center text-xs font-bold text-purple-600">
                        {step.number}
                      </div>
                    </div>

                    {/* Arrow (hide on last item) */}
                    {index < steps.length - 1 && (
                      <div className="hidden lg:flex absolute top-8 -right-12 text-purple-500/40">
                        <ArrowRight className="w-8 h-8" />
                      </div>
                    )}

                    {/* Mobile Arrow (vertical) */}
                    {index < steps.length - 1 && (
                      <div className="lg:hidden absolute -bottom-8 left-8 text-purple-500/40">
                        <div className="w-0.5 h-8 bg-gradient-to-b from-purple-500 to-transparent" />
                      </div>
                    )}

                    {/* Text Content */}
                    <div className="space-y-2">
                      <h3 className="text-lg md:text-xl font-bold text-foreground">
                        {step.title}
                      </h3>
                      <p className="text-sm md:text-base text-muted-foreground leading-relaxed">
                        {step.description}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Bottom CTA */}
        <div className="mt-16 md:mt-20 text-center">
          <p className="text-muted-foreground mb-4">
            Ready to join the PASOA community?
          </p>
          <div className="inline-block px-6 py-3 rounded-xl bg-gradient-to-r from-purple-500/10 to-violet-500/10 border border-purple-500/30 hover:border-purple-500/60 transition-colors">
            <span className="text-sm font-semibold bg-gradient-to-r from-purple-600 to-violet-600 bg-clip-text text-transparent">
              It takes less than 2 minutes to get started
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
