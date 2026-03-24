import { useState, useEffect, useRef } from "react";
import { Send, ArrowRight, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Message {
  id: string;
  text: string;
  sender: "user" | "bot";
  timestamp: Date;
}

const suggestionQuestions = [
  "What announcements are available?",
  "How do I register for events?",
  "What's the FAQ system?",
  "How do I contact support?",
];

const botResponses: Record<string, string> = {
  "What announcements are available?":
    "You can see all announcements in your dashboard! We have Academic, Events, General, Urgent, and Facilities categories. Check your notification center for the latest updates.",
  "How do I register for events?":
    "Navigate to the Events section and browse available campus events. Click Register on any event to join. You can manage your registrations from your dashboard.",
  "What's the FAQ system?":
    "Our FAQ system is searchable and organized by categories like Internship, Enrollment, Events, and Requirements. You can quickly find answers to common questions.",
  "How do I contact support?":
    "You can reach out through this chat anytime! For further assistance, contact us at pasoastudenthub@gmail.com",
};

export function InteractiveChatbot() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      text: "Hello! Welcome to PASOA Hub. I'm here to help answer your questions. What would you like to know?",
      sender: "bot",
      timestamp: new Date(),
    },
  ]);
  const [isTyping, setIsTyping] = useState(false);
  const [carouselIndex, setCarouselIndex] = useState(0);
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [isTyping]); // Only scroll when typing state changes, not on every message

  const handleSuggestionClick = (suggestion: string) => {
    // Add user message
    const userMessage: Message = {
      id: Date.now().toString(),
      text: suggestion,
      sender: "user",
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMessage]);

    // Simulate typing
    setIsTyping(true);

    // Simulate bot response delay
    setTimeout(() => {
      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: botResponses[suggestion] || "That's a great question! Let me help you with that.",
        sender: "bot",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, botMessage]);
      setIsTyping(false);
    }, 1000);
  };

  const handleSendMessage = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const input = e.currentTarget.elements.namedItem("message") as HTMLInputElement;
    const text = input.value.trim();

    if (!text) return;

    // Add user message
    const userMessage: Message = {
      id: Date.now().toString(),
      text,
      sender: "user",
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMessage]);
    input.value = "";

    // Simulate typing
    setIsTyping(true);

    // Simulate bot response
    setTimeout(() => {
      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: "Thanks for reaching out! For more detailed support, please contact us at pasoastudenthub@gmail.com",
        sender: "bot",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, botMessage]);
      setIsTyping(false);
    }, 1500);
  };

  return (
    <div className="flex flex-col h-full bg-gradient-to-br from-card/50 to-card/30 rounded-2xl border border-border/40 backdrop-blur-sm overflow-hidden">
      {/* Messages Container */}
      <div ref={messagesContainerRef} className="flex-1 overflow-y-auto scrollbar-hide space-y-4 p-4 md:p-6">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.sender === "user" ? "justify-end" : "justify-start"} animate-in fade-in slide-in-from-bottom-2 duration-300`}
          >
            <div
              className={`max-w-xs md:max-w-md px-4 py-3 rounded-xl ${
                message.sender === "user"
                  ? "bg-gradient-to-r from-purple-600 to-violet-600 text-white rounded-br-none"
                  : "bg-background/50 text-foreground border border-border/40 rounded-bl-none"
              }`}
            >
              <p className="text-sm md:text-base leading-relaxed">{message.text}</p>
              <span
                className={`text-xs mt-2 block ${
                  message.sender === "user" ? "text-purple-100" : "text-muted-foreground"
                }`}
              >
                {message.timestamp.toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>
            </div>
          </div>
        ))}

        {/* Typing Indicator */}
        {isTyping && (
          <div className="flex justify-start">
            <div className="bg-background/50 text-foreground border border-border/40 px-4 py-3 rounded-xl rounded-bl-none">
              <div className="flex gap-1">
                <span className="w-2 h-2 rounded-full bg-muted-foreground animate-bounce" />
                <span className="w-2 h-2 rounded-full bg-muted-foreground animate-bounce delay-100" />
                <span className="w-2 h-2 rounded-full bg-muted-foreground animate-bounce delay-200" />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Suggestions Carousel (show only if no user messages yet) */}
      {messages.length <= 1 && !isTyping && (
        <div className="px-4 md:px-6 py-4 border-t border-border/40 space-y-3">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
            Quick suggestions
          </p>
          <div className="flex items-center gap-2">
            {/* Previous Button */}
            <button
              onClick={() => setCarouselIndex((prev) => (prev === 0 ? suggestionQuestions.length - 1 : prev - 1))}
              className="flex-shrink-0 p-2 rounded-lg bg-accent/50 hover:bg-accent transition-colors border border-accent/50 hover:border-accent"
              aria-label="Previous suggestion"
            >
              <ChevronLeft className="w-4 h-4 text-foreground" />
            </button>

            {/* Carousel Items */}
            <div className="flex-1 overflow-hidden">
              <div className="flex transition-transform duration-300" style={{transform: `translateX(-${carouselIndex * 100}%)`}}>
                {suggestionQuestions.map((question, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSuggestionClick(question)}
                    className="min-w-full px-3 py-2 mx-1 rounded-lg bg-accent/50 hover:bg-accent transition-colors border border-accent/50 hover:border-accent text-sm group"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-foreground text-left line-clamp-2">{question}</span>
                      <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:translate-x-1 transition-transform flex-shrink-0" />
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Next Button */}
            <button
              onClick={() => setCarouselIndex((prev) => (prev === suggestionQuestions.length - 1 ? 0 : prev + 1))}
              className="flex-shrink-0 p-2 rounded-lg bg-accent/50 hover:bg-accent transition-colors border border-accent/50 hover:border-accent"
              aria-label="Next suggestion"
            >
              <ChevronRight className="w-4 h-4 text-foreground" />
            </button>
          </div>

          {/* Carousel Indicators */}
          <div className="flex justify-center gap-1.5">
            {suggestionQuestions.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCarouselIndex(idx)}
                className={`h-1.5 rounded-full transition-all ${
                  idx === carouselIndex ? "w-6 bg-purple-600" : "w-1.5 bg-muted-foreground/30 hover:bg-muted-foreground/50"
                }`}
                aria-label={`Go to suggestion ${idx + 1}`}
              />
            ))}
          </div>
        </div>
      )}

      {/* Input Area */}
      <form
        onSubmit={handleSendMessage}
        className="border-t border-border/40 p-4 md:p-6 space-y-3"
      >
        <input
          type="text"
          name="message"
          placeholder="Type your message..."
          className="w-full px-4 py-2 rounded-lg bg-background/50 border border-border/40 focus:border-purple-500 focus:outline-none transition-colors text-sm"
          disabled={isTyping}
        />
        <Button
          type="submit"
          disabled={isTyping}
          className="w-full rounded-lg bg-gradient-to-r from-purple-600 to-violet-600 hover:shadow-lg transition-all group"
        >
          Send Message
          <Send className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
        </Button>
      </form>
    </div>
  );
}
