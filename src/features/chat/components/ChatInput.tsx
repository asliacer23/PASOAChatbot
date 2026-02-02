import { useState, useRef, useEffect } from "react";
import { Send, Plus, Image, X, Loader2, HelpCircle, AlertTriangle, Menu } from "lucide-react";
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
  onToggleHistory?: () => void;
  onTypingChange?: (isTyping: boolean) => void;
  isTyping: boolean;
  isHumanAgentRequested?: boolean;
  isAdminConnected?: boolean;
  maxMessageLength?: number;
  isMobile?: boolean;
}

const MAX_IMAGE_SIZE_MB = 5;
const MAX_IMAGES_PER_MESSAGE = 1;

export function ChatInput({
  onSendMessage,
  onNewChat,
  onRequestHumanAgent,
  onRefresh,
  onToggleHistory,
  onTypingChange,
  isTyping,
  isHumanAgentRequested,
  isAdminConnected,
  maxMessageLength = 500,
  isMobile = false,
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
    <div className={cn(
      "flex flex-col w-full",
      isMobile ? "gap-1 md:gap-1.5" : "gap-1.5 md:gap-2 lg:gap-2.5"
    )}>
      {/* Image Preview */}
      {selectedImage && (
        <div className="relative inline-block group">
          <img 
            src={selectedImage} 
            alt="Selected" 
            className={cn(
              "rounded-lg border-2 border-primary/30 object-cover shadow-lg hover:shadow-xl transition-shadow duration-200",
              isMobile ? "h-10 sm:h-12 w-14 sm:w-16" : "h-14 md:h-20"
            )}
          />
          <Button
            type="button"
            variant="destructive"
            size="icon"
            className="absolute -top-2 -right-2 h-5 w-5 rounded-full shadow-lg hover:scale-110 transition-transform duration-200 active:scale-95 text-xs"
            onClick={() => setSelectedImage(null)}
          >
            <X className="h-3 w-3" />
          </Button>
        </div>
      )}

      {/* Input Form */}
      <form onSubmit={handleSubmit} className={cn("space-y-1", isMobile ? "" : "md:space-y-1.5")}>
        {/* Input Row - Horizontal on all devices */}
        <div className={cn(
          "flex gap-1 sm:gap-1.5 md:gap-2 items-end",
          isMobile ? "gap-1" : ""
        )}>
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
                  className={cn(
                    "rounded-lg shrink-0 hover:bg-primary/20 hover:text-primary hover:border-primary transition-all duration-200 shadow-sm hover:shadow-md active:scale-95 border-border/30",
                    isMobile ? "h-9 w-9" : "sm:h-9 sm:w-9 md:h-10 md:w-10 h-9 w-9"
                  )}
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploadingImage || !!selectedImage}
                >
                  {isUploadingImage ? (
                    <Loader2 className={cn("animate-spin", isMobile ? "h-4 w-4" : "sm:h-4 sm:w-4 md:h-5 md:w-5")} />
                  ) : (
                    <Image className={cn(isMobile ? "h-4 w-4" : "sm:h-4 sm:w-4 md:h-5 md:w-5")} />
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p className="text-xs">Attach image (max {MAX_IMAGE_SIZE_MB}MB)</p>
              </TooltipContent>
            </Tooltip>

            {/* Input Field */}
            <div className="flex-1 relative flex items-center">
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={isMobile ? "Ask..." : "Ask something..."}
                className={cn(
                  "rounded-lg bg-card/60 border-border/30 focus:border-primary text-xs sm:text-sm md:text-sm transition-all duration-200 shadow-sm focus:shadow-md focus:ring-0 focus:ring-primary/20 backdrop-blur-sm",
                  isMobile ? "h-9 pr-8 text-xs" : "sm:h-9 md:h-10 h-9 sm:pr-10 md:pr-12 pr-8",
                  isOverLimit && "border-destructive focus:border-destructive bg-destructive/5"
                )}
                maxLength={maxMessageLength + 50}
              />
              <span className={cn(
                "absolute transition-colors duration-200 pointer-events-none font-medium text-[8px] sm:text-[9px] md:text-xs",
                isMobile ? "right-2" : "sm:right-3 md:right-4 right-2",
                isOverLimit ? "text-destructive font-semibold" : charactersRemaining <= 50 ? "text-orange-500 font-semibold" : "text-muted-foreground"
              )}>
                {charactersRemaining}
              </span>
            </div>

            {/* Send Button */}
            <Button
              type="submit"
              size="icon"
              disabled={(!input.trim() && !selectedImage) || isTyping || isOverLimit}
              className={cn(
                "rounded-lg shrink-0 bg-gradient-to-br from-primary to-blue-600 hover:opacity-90 transition-all duration-200 shadow-md hover:shadow-lg disabled:opacity-50 active:scale-95",
                isMobile ? "h-9 w-9" : "sm:h-9 sm:w-9 md:h-10 md:w-10 h-9 w-9"
              )}
            >
              <Send className={cn(isMobile ? "h-4 w-4" : "sm:h-4 sm:w-4 md:h-5 md:w-5")} />
            </Button>
          </TooltipProvider>
        </div>

        {/* Character Counter Warning */}
        {charactersRemaining <= 50 && !isOverLimit && (
          <div className={cn(
            "font-medium flex items-center gap-1 text-orange-600 dark:text-orange-400",
            isMobile ? "text-[8px] px-1" : "sm:text-[9px] md:text-xs text-[8px]"
          )}>
            <AlertTriangle className={cn(isMobile ? "h-2 w-2" : "sm:h-2.5 sm:w-2.5 md:h-3 md:w-3 h-2 w-2")} />
            <span className={isMobile ? "hidden sm:inline" : ""}>{charactersRemaining} chars left</span>
          </div>
        )}
      </form>

      {/* Action Buttons Row - More compact */}
      <div className={cn(
        "flex items-center gap-0.5 sm:gap-1 md:gap-1.5 flex-wrap",
        isMobile ? "justify-between px-0" : "justify-center"
      )}>
        <Button
          variant="outline"
          size="sm"
          className={cn(
            "rounded-lg border-border/30 hover:bg-primary/20 hover:text-primary hover:border-primary transition-all duration-200 shadow-sm hover:shadow-md active:scale-95 flex-1 min-w-max",
            isMobile ? "text-[9px] h-8 px-1.5 sm:px-2" : "sm:text-xs md:text-sm md:h-9 md:px-3 text-xs h-8 px-2"
          )}
          onClick={onNewChat}
        >
          <Plus className={cn("mr-0.5 sm:mr-1", isMobile ? "h-3 w-3" : "sm:h-3 sm:w-3 md:h-3.5 md:w-3.5")} />
          <span className={isMobile ? "hidden xs:inline" : ""}>New</span>
        </Button>

        <Button
          variant={isAdminConnected ? "default" : isHumanAgentRequested ? "secondary" : "outline"}
          size="sm"
          className={cn(
            "rounded-lg transition-all duration-200 shadow-sm hover:shadow-md active:scale-95 flex-1 min-w-max",
            isMobile ? "text-[8px] sm:text-[9px] h-8 px-1.5 sm:px-2 font-medium" : "sm:text-xs md:text-sm md:h-9 md:px-3 text-xs h-8 px-2",
            isAdminConnected
              ? "bg-gradient-to-r from-green-500 to-green-600 text-white border-green-600 hover:opacity-90"
              : isHumanAgentRequested 
              ? "bg-orange-500/20 text-orange-600 dark:text-orange-400 border-orange-500/30 hover:bg-orange-500/30" 
              : "border-border/30 hover:bg-green-500/20 hover:text-green-600 hover:border-green-500/50"
          )}
          onClick={isAdminConnected ? undefined : onRequestHumanAgent}
          disabled={isAdminConnected || isHumanAgentRequested}
        >
          <span className="hidden sm:inline">{isAdminConnected ? "✓ Connected" : isHumanAgentRequested ? "⏳ Waiting" : "👤 Agent"}</span>
          <span className="sm:hidden">{isAdminConnected ? "✓" : isHumanAgentRequested ? "⏳" : "👤"}</span>
        </Button>

        {onToggleHistory && (
          <Button
            variant="outline"
            size="sm"
            className={cn(
              "rounded-lg border-border/30 hover:bg-purple-500/20 hover:text-purple-600 hover:border-purple-500/50 transition-all duration-200 shadow-sm hover:shadow-md active:scale-95 flex-1 min-w-max",
              isMobile ? "text-[9px] h-8 px-1.5 sm:px-2" : "sm:text-xs md:text-sm md:h-9 md:px-3 text-xs h-8 px-2"
            )}
            onClick={onToggleHistory}
            title="Chat History"
          >
            <Menu className={cn("mr-0.5 sm:mr-1", isMobile ? "h-3 w-3" : "sm:h-3 sm:w-3 md:h-3.5 md:w-3.5")} />
            <span className={isMobile ? "hidden xs:inline" : ""}>History</span>
          </Button>
        )}

        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className={cn(
                  "rounded-full hover:bg-accent transition-all duration-200 text-muted-foreground hover:text-foreground active:scale-95 flex-1 min-w-max",
                  isMobile ? "h-8 w-8" : "sm:h-8 sm:w-8 md:h-9 md:w-9 h-8 w-8"
                )}
              >
                <HelpCircle className={cn(isMobile ? "h-3.5 w-3.5" : "sm:h-3.5 sm:w-3.5 md:h-4 md:w-4")} />
              </Button>
            </TooltipTrigger>
            <TooltipContent className="max-w-xs bg-card border border-border/50 shadow-lg">
              <div className="text-xs space-y-1.5">
                <p className="font-bold text-sm text-primary">💡 Tips:</p>
                <ul className="space-y-1">
                  <li>✨ Ask specific questions</li>
                  <li>📸 Attach images ({MAX_IMAGE_SIZE_MB}MB)</li>
                  <li>👤 Request support anytime</li>
                  <li>⚡ Max {maxMessageLength} chars</li>
                </ul>
              </div>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
    </div>
  );
}
