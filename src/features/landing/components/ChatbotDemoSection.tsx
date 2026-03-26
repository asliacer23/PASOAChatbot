import { InteractiveChatbot } from "./InteractiveChatbot";

export function ChatbotDemoSection() {
  return (
    <section className="relative py-16 md:py-32 overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-0 w-96 h-96 bg-purple-500/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-violet-500/5 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 w-full px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="grid md:grid-cols-2 gap-8 md:gap-12 items-center">
          {/* Left Content */}
          <div className="space-y-6 md:space-y-8 order-2 md:order-1">
            <div className="space-y-4">
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold">
                <span className="block text-foreground mb-2">Chat Support</span>
                <span className="block bg-gradient-to-r from-purple-600 via-violet-600 to-indigo-600 bg-clip-text text-transparent">
                  Always There to Help
                </span>
              </h2>
              <p className="text-sm sm:text-base md:text-lg text-muted-foreground leading-relaxed max-w-lg">
                Get instant answers to your questions 24/7. Our chatbot helps you find information about announcements, events, FAQs, and more. Try asking a question or click on a suggestion above.
              </p>
            </div>

            {/* Features List */}
            <div className="space-y-3">
              {[
                "Instant responses to common questions",
                "Smart FAQ matching and suggestions",
                "Available 24/7 for student support",
                "Easy escalation to human support",
              ].map((feature, idx) => (
                <div key={idx} className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-6 h-6 rounded-full bg-gradient-to-br from-purple-500 to-violet-600 flex items-center justify-center mt-1">
                    <svg
                      className="w-4 h-4 text-white"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  </div>
                  <span className="text-xs sm:text-sm md:text-base text-foreground">{feature}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Right - Chatbot Demo */}
          <div className="relative h-80 sm:h-96 md:h-full md:min-h-[480px] order-1 md:order-2">
            <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 via-transparent to-violet-500/10 rounded-3xl blur-2xl" />
            <div className="relative z-10 h-full">
              <InteractiveChatbot />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

