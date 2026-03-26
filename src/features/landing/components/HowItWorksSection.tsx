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
    description: "Confirm your email to activate your PASOA Student Hub account",
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
    <section id="how-it-works" className="relative py-14 sm:py-20 md:py-28 overflow-hidden">
      
      {/* Background Glow */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute -bottom-32 right-0 w-72 h-72 bg-violet-500/10 rounded-full blur-3xl" />
        <div className="absolute -top-32 left-1/3 w-96 h-96 bg-purple-500/5 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 w-full px-4 sm:px-6 lg:px-8">

        {/* Header */}
        <div className="text-center space-y-3 mb-12 md:mb-16">
          <h2 className="text-3xl sm:text-4xl md:text-6xl font-black tracking-tight leading-tight">
            <span className="block text-foreground">How It Works</span>
            <span className="block bg-gradient-to-r from-purple-600 via-violet-600 to-indigo-600 bg-clip-text text-transparent">
              Get Started in 4 Easy Steps
            </span>
          </h2>

          <p className="text-sm sm:text-base text-muted-foreground max-w-xl mx-auto font-medium">
            Join the PASOA community in minutes and start enjoying all the benefits.
          </p>
        </div>

        {/* Desktop Timeline Line */}
        <div className="hidden lg:block absolute top-[42%] left-0 right-0 h-1 bg-gradient-to-r from-purple-500 via-violet-500 to-indigo-500 opacity-25" />

        {/* Steps Grid */}
        <div className="grid gap-10 sm:gap-12 md:grid-cols-2 lg:grid-cols-4">

          {steps.map((step, index) => {
            const Icon = step.icon;

            return (
              <div key={index} className="relative flex flex-col items-center text-center lg:text-left lg:items-start">

                {/* Icon */}
                <div className="relative mb-4">
                  <div className="absolute inset-0 bg-gradient-to-br from-purple-600 to-violet-600 blur-xl opacity-25 rounded-2xl" />

                  <div className="relative w-14 h-14 sm:w-16 sm:h-16 md:w-20 md:h-20 rounded-2xl bg-gradient-to-br from-purple-500 to-violet-600 flex items-center justify-center shadow-lg">
                    <Icon className="w-7 h-7 sm:w-8 sm:h-8 md:w-10 md:h-10 text-white" />
                  </div>

                  {/* Step Badge */}
                  <div className="absolute -bottom-2 -right-2 w-7 h-7 bg-background border border-purple-500 rounded-full flex items-center justify-center text-[10px] font-bold text-purple-600">
                    {step.number}
                  </div>
                </div>

                {/* Desktop Arrow */}
                {index < steps.length - 1 && (
                  <div className="hidden lg:flex absolute top-7 -right-14 text-purple-500/40">
                    <ArrowRight className="w-7 h-7" />
                  </div>
                )}

                {/* Mobile Vertical Connector */}
                {index < steps.length - 1 && (
                  <div className="lg:hidden mt-6 mb-2">
                    <div className="w-[2px] h-10 bg-gradient-to-b from-purple-500/50 to-transparent mx-auto" />
                  </div>
                )}

                {/* Text */}
                <div className="space-y-1 sm:space-y-2 max-w-xs">
                  <h3 className="text-base sm:text-lg md:text-xl font-bold text-foreground">
                    {step.title}
                  </h3>

                  <p className="text-xs sm:text-sm md:text-base text-muted-foreground leading-relaxed">
                    {step.description}
                  </p>
                </div>

              </div>
            );
          })}
        </div>

        {/* Bottom CTA */}
        <div className="mt-14 md:mt-20 text-center space-y-4">
          <p className="text-muted-foreground text-sm sm:text-base">
            Ready to join the PASOA community?
          </p>

          <div className="inline-block px-5 py-3 rounded-xl bg-gradient-to-r from-purple-500/10 to-violet-500/10 border border-purple-500/30 hover:border-purple-500/60 transition">
            <span className="text-sm font-semibold bg-gradient-to-r from-purple-600 to-violet-600 bg-clip-text text-transparent">
              It takes less than 2 minutes to get started
            </span>
          </div>
        </div>

      </div>
    </section>
  );
}
