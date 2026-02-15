import { useState, useRef } from "react";
import { Send, Paperclip, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { SuggestionsCarousel } from "./SuggestionsCarousel";

interface ChatInputAreaProps {
  onSendMessage: (message: string, file?: File) => void;
  onRequestAgent: () => void;
  isWaitingForAgent?: boolean;
  isAdminConnected?: boolean;
  maxMessageLength?: number;
  disabled?: boolean;
  suggestions?: string[];
  showSuggestions?: boolean;
  onToggleSuggestions?: (show: boolean) => void;
}

export function ChatInputArea({
  onSendMessage,
  onRequestAgent,
  isWaitingForAgent,
  isAdminConnected,
  maxMessageLength = 1000,
  disabled = false,
  suggestions = [],
  showSuggestions = true,
  onToggleSuggestions,
}: ChatInputAreaProps) {
  const [message, setMessage] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSend = () => {
    if (!message.trim() && !selectedFile) {
      toast.error("Please enter a message or select a file");
      return;
    }

    onSendMessage(message, selectedFile || undefined);
    setMessage("");
    setSelectedFile(null);

    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    if (value.length <= maxMessageLength) {
      setMessage(value);
    }

    // Auto-resize textarea
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = "auto";
      textarea.style.height = Math.min(textarea.scrollHeight, 120) + "px";
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error("File size must be less than 5MB");
      return;
    }

    setSelectedFile(file);
    toast.success("Image selected");
  };

  const charPercentage = (message.length / maxMessageLength) * 100;

  return (
    <div className="sticky bottom-0 left-0 right-0 z-20 border-t border-border/40 bg-gradient-to-t from-background via-background/95 to-background/90 backdrop-blur-md pt-2 sm:pt-3 pb-2.5 sm:pb-3 px-2 sm:px-4 space-y-2 sm:space-y-2.5 shadow-xl">
      {/* Suggestions Section */}
      {suggestions.length > 0 && showSuggestions && (
        <div className="px-1 sm:px-0 space-y-1.5">
          <div className="flex items-center justify-between gap-2">
            <p className="text-[11px] sm:text-xs font-medium text-muted-foreground/80">
              💡 Suggested Questions
            </p>
            <button
              onClick={() => onToggleSuggestions?.(false)}
              className="text-[10px] sm:text-xs text-muted-foreground/60 hover:text-muted-foreground transition-colors underline"
            >
              Hide
            </button>
          </div>
          <SuggestionsCarousel
            suggestions={suggestions}
            onSuggestionClick={onSendMessage}
            disabled={disabled}
          />
        </div>
      )}

      {/* Show Suggestions Button */}
      {suggestions.length > 0 && !showSuggestions && (
        <button
          onClick={() => onToggleSuggestions?.(true)}
          className="text-xs sm:text-sm text-primary hover:text-primary/80 transition-colors underline font-medium px-1"
        >
          💡 Show Suggestions
        </button>
      )}

      {/* Admin Status Banner */}
      {isAdminConnected ? (
        <div className="bg-gradient-to-r from-green-500/20 to-emerald-500/20 border border-green-500/40 rounded-xl px-3 sm:px-4 py-2 sm:py-2.5 flex items-start gap-2.5 animate-pulse">
          <div className="flex-shrink-0 mt-1">
            <div className="w-2.5 h-2.5 rounded-full bg-green-500 shadow-lg shadow-green-500/50" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs sm:text-sm text-green-700 dark:text-green-300 font-semibold">
              Connected with Support
            </p>
            <p className="text-[11px] sm:text-xs text-green-600 dark:text-green-400 opacity-75">
              An admin is now assisting you
            </p>
          </div>
        </div>
      ) : isWaitingForAgent ? (
        <div className="bg-gradient-to-r from-blue-500/20 to-cyan-500/20 border border-blue-500/40 rounded-xl px-3 sm:px-4 py-2 sm:py-2.5 flex items-start gap-2.5">
          <div className="flex-shrink-0 mt-1">
            <div className="flex space-x-1.5">
              <div className="w-2 h-2 rounded-full bg-blue-500 animate-bounce" />
              <div className="w-2 h-2 rounded-full bg-blue-500 animate-bounce" style={{ animationDelay: "0.1s" }} />
              <div className="w-2 h-2 rounded-full bg-blue-500 animate-bounce" style={{ animationDelay: "0.2s" }} />
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs sm:text-sm text-blue-700 dark:text-blue-300 font-semibold">
              Waiting for Support
            </p>
            <p className="text-[11px] sm:text-xs text-blue-600 dark:text-blue-400 opacity-75">
              An admin will respond shortly
            </p>
          </div>
        </div>
      ) : null}

      {/* Selected Image Preview */}
      {selectedFile && (
        <div className="flex items-end gap-2 pb-1">
          <div className="relative group">
            <img
              src={URL.createObjectURL(selectedFile)}
              alt="preview"
              className="max-w-[90px] sm:max-w-[140px] max-h-[90px] sm:max-h-[140px] rounded-lg border-2 border-primary/30 shadow-md object-cover"
            />
            <Button
              variant="ghost"
              size="icon"
              className="absolute -top-2 -right-2 h-6 w-6 sm:h-7 sm:w-7 rounded-full bg-destructive/90 text-white hover:bg-destructive shadow-lg"
              onClick={() => setSelectedFile(null)}
            >
              <X className="h-3.5 w-3.5" />
            </Button>
          </div>
          <span className="text-[10px] sm:text-xs text-muted-foreground truncate">
            {selectedFile.name}
          </span>
        </div>
      )}

      {/* Input Area */}
      <div className="flex gap-2 items-end">
        {/* Textarea Container */}
        <div className="flex-1 relative">
          <Textarea
            ref={textareaRef}
            value={message}
            onChange={handleTextChange}
            onKeyDown={handleKeyDown}
            placeholder="Type your message here..."
            className={cn(
              "resize-none rounded-2xl px-4 sm:px-4 py-2.5 sm:py-3 pr-10 sm:pr-11",
              "max-h-[110px] sm:max-h-[130px] text-sm sm:text-base leading-relaxed",
              "bg-muted/40 border-2 border-border/50 transition-all duration-200",
              "focus:bg-card focus:border-primary/60 focus:ring-2 focus:ring-primary/20 focus:outline-none",
              "hover:border-border/80 hover:bg-muted/60",
              "placeholder:text-muted-foreground/70"
            )}
            disabled={disabled}
            rows={1}
          />

          {/* Character Count Bar and Text */}
          <div className="absolute bottom-0 right-0 flex flex-col items-end gap-1 p-2 sm:p-2.5">
            {/* Count Bar */}
            <div className="w-12 sm:w-16 h-1 bg-muted rounded-full overflow-hidden">
              <div
                className={cn(
                  "h-full transition-all duration-300 rounded-full",
                  charPercentage > 90 ? "bg-destructive" : "bg-primary"
                )}
                style={{ width: `${Math.min(charPercentage, 100)}%` }}
              />
            </div>
            {/* Count Text */}
            <p className={cn(
              "text-[9px] sm:text-xs font-medium transition-colors",
              message.length > maxMessageLength * 0.85 ? "text-destructive" : "text-muted-foreground"
            )}>
              {message.length}/{maxMessageLength}
            </p>
          </div>
        </div>

        {/* Action Buttons Container */}
        <div className="flex gap-1.5 sm:gap-2 items-end pb-0.5">
          {/* Attach Image Button */}
          <Button
            variant="outline"
            size="icon"
            className={cn(
              "h-10 w-10 sm:h-11 sm:w-11 rounded-xl transition-all duration-200",
              "hover:bg-accent hover:border-primary/50 hover:scale-105",
              "focus:ring-2 focus:ring-primary/30"
            )}
            onClick={() => fileInputRef.current?.click()}
            disabled={disabled}
            title="Attach an image"
          >
            <Paperclip className="h-5 sm:h-5 w-5 sm:w-5" />
          </Button>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            className="hidden"
          />

          {/* Send Button */}
          <Button
            onClick={handleSend}
            disabled={disabled || (!message.trim() && !selectedFile)}
            className={cn(
              "h-10 w-10 sm:h-11 sm:w-11 rounded-full transition-all duration-200",
              "bg-gradient-to-r from-primary to-primary/80 hover:shadow-lg hover:shadow-primary/30",
              "hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed",
              "focus:ring-2 focus:ring-primary/30 focus:outline-none"
            )}
            size="icon"
            title="Send message (Shift+Enter for new line)"
          >
            <Send className="h-5 sm:h-5 w-5 sm:w-5" />
          </Button>
        </div>
      </div>

      {/* Agent Request Button */}
      {!isWaitingForAgent && !isAdminConnected && (
        <Button
          variant="outline"
          size="sm"
          onClick={onRequestAgent}
          disabled={disabled}
          className={cn(
            "w-full text-xs sm:text-sm py-2 sm:py-2.5 h-auto rounded-xl transition-all duration-200",
            "hover:bg-accent hover:border-primary/50 active:scale-95",
            "focus:ring-2 focus:ring-primary/30"
          )}
        >
          Request Human Support
        </Button>
      )}
    </div>
  );
}
