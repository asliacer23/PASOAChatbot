import { useState, useRef, useEffect } from "react";
import { Send, Plus, RefreshCw, Image, X, Loader2, HelpCircle, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface ChatInputProps {
  onSendMessage: (content: string, imageUrl?: string) => void;
  onNewChat: () => void;
  onRequestHumanAgent: () => void;
  onRefresh: () => void;
  onTypingChange?: (isTyping: boolean) => void;
  isTyping: boolean;
  isHumanAgentRequested?: boolean;
  isAdminConnected?: boolean;
  maxMessageLength?: number;
}

const MAX_IMAGE_SIZE_MB = 5;
const MAX_IMAGES_PER_MESSAGE = 1;

export function ChatInput({
  onSendMessage,
  onNewChat,
  onRequestHumanAgent,
  onRefresh,
  onTypingChange,
  isTyping,
  isHumanAgentRequested,
  isAdminConnected,
  maxMessageLength = 500,
}: ChatInputProps) {
  const [input, setInput] = useState("");
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [typingTimeout, setTypingTimeout] = useState<NodeJS.Timeout | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const charactersRemaining = maxMessageLength - input.length;
  const isOverLimit = charactersRemaining < 0;

  // Handle typing indicator
  useEffect(() => {
    if (input.length > 0 && onTypingChange) {
      onTypingChange(true);
      
      // Clear existing timeout
      if (typingTimeout) {
        clearTimeout(typingTimeout);
      }
      
      // Set new timeout to stop typing after 2 seconds of inactivity
      const timeout = setTimeout(() => {
        onTypingChange(false);
      }, 2000);
      
      setTypingTimeout(timeout);
    } else if (input.length === 0 && onTypingChange) {
      onTypingChange(false);
    }
    
    return () => {
      if (typingTimeout) {
        clearTimeout(typingTimeout);
      }
    };
  }, [input]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if ((!input.trim() && !selectedImage) || isOverLimit) return;
    
    // Stop typing indicator
    if (onTypingChange) {
      onTypingChange(false);
    }
    
    onSendMessage(input.trim(), selectedImage || undefined);
    setInput("");
    setSelectedImage(null);
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file (JPG, PNG, GIF, WEBP)");
      return;
    }

    // Validate file size
    const sizeMB = file.size / (1024 * 1024);
    if (sizeMB > MAX_IMAGE_SIZE_MB) {
      toast.error(`Image must be less than ${MAX_IMAGE_SIZE_MB}MB (yours: ${sizeMB.toFixed(1)}MB)`);
      return;
    }

    setIsUploadingImage(true);
    const reader = new FileReader();
    reader.onloadend = () => {
      setSelectedImage(reader.result as string);
      setIsUploadingImage(false);
      toast.success("Image attached successfully");
    };
    reader.onerror = () => {
      toast.error("Failed to read image");
      setIsUploadingImage(false);
    };
    reader.readAsDataURL(file);
    
    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div className="pt-3 md:pt-4 md:pt-5 px-3 md:px-6 space-y-3 md:space-y-4">
      {/* Image Preview */}
      {selectedImage && (
        <div className="relative inline-block group">
          <img 
            src={selectedImage} 
            alt="Selected" 
            className="h-16 md:h-24 rounded-xl border-2 border-primary/30 object-cover shadow-lg hover:shadow-xl transition-shadow duration-200"
          />
          <Button
            type="button"
            variant="destructive"
            size="icon"
            className="absolute -top-2 -right-2 h-6 w-6 rounded-full shadow-lg hover:scale-110 transition-transform duration-200 active:scale-95"
            onClick={() => setSelectedImage(null)}
          >
            <X className="h-3.5 w-3.5" />
          </Button>
        </div>
      )}

      {/* Input Form */}
      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="flex gap-2 md:gap-3">
          <input
            type="file"
            ref={fileInputRef}
            accept="image/jpeg,image/png,image/gif,image/webp"
            onChange={handleImageSelect}
            className="hidden"
          />
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className="rounded-xl md:rounded-xl shrink-0 h-11 md:h-12 w-11 md:w-12 hover:bg-primary/20 hover:text-primary hover:border-primary transition-all duration-200 shadow-sm hover:shadow-md active:scale-95 border-border/30"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploadingImage || !!selectedImage}
                >
                  {isUploadingImage ? (
                    <Loader2 className="h-5 md:h-6 w-5 md:w-6 animate-spin" />
                  ) : (
                    <Image className="h-5 md:h-6 w-5 md:w-6" />
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p className="text-xs">Attach image (max {MAX_IMAGE_SIZE_MB}MB)</p>
              </TooltipContent>
            </Tooltip>
            <div className="flex-1 relative flex items-center">
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask something..."
                className={cn(
                  "rounded-xl bg-card/60 border-border/30 focus:border-primary text-xs md:text-sm h-11 md:h-12 pr-10 md:pr-12 transition-all duration-200 shadow-sm focus:shadow-md focus:ring-0 focus:ring-primary/20 backdrop-blur-sm",
                  isOverLimit && "border-destructive focus:border-destructive bg-destructive/5"
                )}
                maxLength={maxMessageLength + 50}
              />
              <span className={cn(
                "absolute right-3 md:right-4 text-[9px] md:text-xs font-medium transition-colors duration-200 pointer-events-none",
                isOverLimit ? "text-destructive font-semibold" : charactersRemaining <= 50 ? "text-orange-500 font-semibold" : "text-muted-foreground"
              )}>
                {charactersRemaining}
              </span>
            </div>
            <Button
              type="submit"
              size="icon"
              disabled={(!input.trim() && !selectedImage) || isTyping || isOverLimit}
              className="rounded-xl shrink-0 h-11 md:h-12 w-11 md:w-12 bg-gradient-to-br from-primary to-blue-600 hover:opacity-90 transition-all duration-200 shadow-md hover:shadow-lg disabled:opacity-50 active:scale-95"
            >
              <Send className="h-5 md:h-6 w-5 md:w-6" />
            </Button>
          </TooltipProvider>
        </div>

        {/* Character Counter Warning */}
        {charactersRemaining <= 50 && !isOverLimit && (
          <div className="text-xs text-orange-600 dark:text-orange-400 font-medium flex items-center gap-1">
            <AlertTriangle className="h-3.5 w-3.5" />
            {charactersRemaining} characters remaining
          </div>
        )}
      </form>

      {/* Action Buttons - Mobile Optimized */}
      <div className="flex items-center justify-center gap-2 md:gap-3 flex-wrap pb-3">
        <Button
          variant="outline"
          size="sm"
          className="rounded-xl text-xs md:text-sm h-9 md:h-10 px-3 md:px-4 border-border/30 hover:bg-primary/20 hover:text-primary hover:border-primary transition-all duration-200 shadow-sm hover:shadow-md active:scale-95"
          onClick={onNewChat}
        >
          <Plus className="h-4 md:h-4.5 w-4 md:w-4.5 mr-1.5" />
          New
        </Button>
        <Button
          variant={isAdminConnected ? "default" : isHumanAgentRequested ? "secondary" : "outline"}
          size="sm"
          className={cn(
            "rounded-xl text-xs md:text-sm h-9 md:h-10 px-3 md:px-4 transition-all duration-200 shadow-sm hover:shadow-md active:scale-95",
            isAdminConnected
              ? "bg-gradient-to-r from-green-500 to-green-600 text-white border-green-600 hover:opacity-90"
              : isHumanAgentRequested 
              ? "bg-orange-500/20 text-orange-600 dark:text-orange-400 border-orange-500/30 hover:bg-orange-500/30" 
              : "border-border/30 hover:bg-green-500/20 hover:text-green-600 hover:border-green-500/50"
          )}
          onClick={isAdminConnected ? undefined : onRequestHumanAgent}
          disabled={isAdminConnected || isHumanAgentRequested}
        >
          👤 {isAdminConnected ? "Connected" : isHumanAgentRequested ? "Waiting..." : "Agent"}
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="rounded-xl text-xs md:text-sm h-9 md:h-10 px-3 md:px-4 border-border/30 hover:bg-blue-500/20 hover:text-blue-600 hover:border-blue-500/50 transition-all duration-200 shadow-sm hover:shadow-md active:scale-95"
          onClick={onRefresh}
        >
          <RefreshCw className="h-3.5 md:h-4 w-3.5 md:w-4 mr-1" />
          <span className="hidden md:inline">Refresh</span>
        </Button>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="rounded-full h-8 md:h-9 w-8 md:w-9 hover:bg-accent transition-all duration-200 text-muted-foreground hover:text-foreground active:scale-95"
              >
                <HelpCircle className="h-4 md:h-5 w-4 md:w-5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent className="max-w-xs bg-card border border-border/50 shadow-lg">
              <div className="text-xs space-y-2">
                <p className="font-bold text-sm text-primary">💡 Tips:</p>
                <ul className="space-y-1.5">
                  <li>✨ <span className="font-medium">Ask specific</span> questions</li>
                  <li>📸 <span className="font-medium">Attach images</span> ({MAX_IMAGE_SIZE_MB}MB max)</li>
                  <li>👤 <span className="font-medium">Request support</span> anytime</li>
                  <li>⚡ Max {maxMessageLength} chars</li>
                </ul>
              </div>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>

      {/* Restrictions notice - Mobile Optimized */}
      {/* Removed empty div that was creating extra space */}
    </div>
  );
}
