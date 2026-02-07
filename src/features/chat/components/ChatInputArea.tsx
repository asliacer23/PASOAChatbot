import { useState, useRef } from "react";
import { Send, Paperclip } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface ChatInputAreaProps {
  onSendMessage: (message: string, file?: File) => void;
  onRequestAgent: () => void;
  isWaitingForAgent?: boolean;
  isAdminConnected?: boolean;
  maxMessageLength?: number;
  disabled?: boolean;
}

export function ChatInputArea({
  onSendMessage,
  onRequestAgent,
  isWaitingForAgent,
  isAdminConnected,
  maxMessageLength = 1000,
  disabled = false,
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

  return (
    <div className="border-t border-border/30 bg-card/60 backdrop-blur-sm p-1.5 sm:p-3 space-y-1.5 sm:space-y-2">
      {/* Admin Status Banner */}
      {isAdminConnected ? (
        <div className="bg-green-500/15 border border-green-500/30 rounded-lg px-2 sm:px-3 py-1.5 sm:py-2 flex items-start gap-2">
          <div className="flex-shrink-0 mt-0.5">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
          </div>
          <div className="flex-1">
            <p className="text-[9px] sm:text-xs text-green-700 dark:text-green-300 font-medium">
              Connected with Support
            </p>
            <p className="text-[8px] sm:text-[9px] text-green-600 dark:text-green-400 opacity-80">
              An admin is now assisting you
            </p>
          </div>
        </div>
      ) : isWaitingForAgent ? (
        <div className="bg-blue-500/15 border border-blue-500/30 rounded-lg px-2 sm:px-3 py-1.5 sm:py-2 flex items-start gap-2">
          <div className="flex-shrink-0 mt-0.5">
            <div className="flex space-x-[2px]">
              <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-bounce" />
              <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-bounce" style={{ animationDelay: "0.1s" }} />
              <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-bounce" style={{ animationDelay: "0.2s" }} />
            </div>
          </div>
          <div className="flex-1">
            <p className="text-[9px] sm:text-xs text-blue-700 dark:text-blue-300 font-medium">
              Waiting for Admin
            </p>
            <p className="text-[8px] sm:text-[9px] text-blue-600 dark:text-blue-400 opacity-80">
              An admin will respond shortly
            </p>
          </div>
        </div>
      ) : null}

      {/* Selected Image Preview */}
      {selectedFile && (
        <div className="relative w-fit">
          <img
            src={URL.createObjectURL(selectedFile)}
            alt="preview"
            className="max-w-[80px] sm:max-w-[120px] max-h-[80px] sm:max-h-[120px] rounded-lg border border-border/50"
          />
          <Button
            variant="ghost"
            size="icon"
            className="absolute -top-2 -right-2 h-4 w-4 sm:h-5 sm:w-5 rounded-full bg-destructive text-white text-xs hover:bg-destructive/90"
            onClick={() => setSelectedFile(null)}
          >
            ✕
          </Button>
        </div>
      )}

      {/* Input Area */}
      <div className="flex gap-1.5 sm:gap-2 items-end">
        {/* Textarea */}
        <div className="flex-1 relative">
          <Textarea
            ref={textareaRef}
            value={message}
            onChange={handleTextChange}
            onKeyDown={handleKeyDown}
            placeholder="Type your message..."
            className="resize-none rounded-2xl px-3 sm:px-3 py-1.5 sm:py-2 pr-7 sm:pr-9 max-h-[100px] sm:max-h-[120px] text-xs sm:text-sm"
            disabled={disabled}
            rows={1}
          />

          {/* Character count */}
          <p className={cn(
            "absolute bottom-1.5 right-2 text-[8px] sm:text-xs",
            message.length > maxMessageLength * 0.9 ? "text-destructive" : "text-muted-foreground"
          )}>
            {message.length}/{maxMessageLength}
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-0.5 sm:gap-1 items-end">
          {/* Attach Image */}
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 sm:h-9 sm:w-9"
            onClick={() => fileInputRef.current?.click()}
            disabled={disabled}
            title="Attach image"
          >
            <Paperclip className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
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
            className="h-7 w-7 sm:h-9 sm:w-9 rounded-full"
            size="icon"
          >
            <Send className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
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
          className="w-full text-xs sm:text-sm py-1.5 sm:py-2 h-auto"
        >
          Request Human Support
        </Button>
      )}
    </div>
  );
}
