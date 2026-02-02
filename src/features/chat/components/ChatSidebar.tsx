import { Plus, MessageCircle, Clock, UserCheck, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import type { Conversation } from "../hooks/useChatMessages";

interface ChatSidebarProps {
  conversations: Conversation[];
  currentConversation: Conversation | null;
  isLoading: boolean;
  onSelectConversation: (conv: Conversation) => void;
  onNewConversation: () => void;
}

export function ChatSidebar({
  conversations,
  currentConversation,
  isLoading,
  onSelectConversation,
  onNewConversation,
}: ChatSidebarProps) {
  return (
    <div className="w-full h-full flex flex-col p-2 sm:p-3 md:p-4 space-y-2 sm:space-y-3 md:space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-bold text-sm sm:text-base md:text-lg bg-gradient-to-r from-primary to-blue-500 bg-clip-text text-transparent">
            Conversations
          </h3>
          <p className="text-[10px] sm:text-xs text-muted-foreground mt-0.5 sm:mt-1">Your chat history</p>
        </div>
        <Button 
          size="icon" 
          variant="ghost" 
          onClick={onNewConversation} 
          className="h-8 sm:h-9 w-8 sm:w-9 rounded-lg hover:bg-primary/20 hover:text-primary transition-all duration-200 shadow-sm hover:shadow-md flex-shrink-0"
          title="New conversation"
        >
          <Plus className="h-4 sm:h-5 w-4 sm:w-5" />
        </Button>
      </div>
      
      {/* Conversations List */}
      <ScrollArea className="flex-1 rounded-lg border border-border/30 bg-card/50 backdrop-blur-sm overflow-hidden">
        <div className="p-1 sm:p-2 space-y-1 sm:space-y-2 pr-3 sm:pr-4">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-6 sm:py-8">
              <Loader2 className="h-5 sm:h-6 animate-spin text-primary mb-2" />
              <p className="text-[10px] sm:text-xs text-muted-foreground">Loading chats...</p>
            </div>
          ) : conversations.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-6 sm:py-8 text-center px-2 sm:px-4">
              <MessageCircle className="h-6 sm:h-8 text-muted-foreground/40 mb-2" />
              <p className="text-[10px] sm:text-xs text-muted-foreground">
                No conversations yet. Start a new one!
              </p>
            </div>
          ) : (
            conversations.map((conv, index) => (
              <div
                key={conv.id}
                onClick={() => onSelectConversation(conv)}
                className={cn(
                  "group p-2 sm:p-3 rounded-lg cursor-pointer transition-all duration-200 relative overflow-hidden",
                  "active:scale-95 md:active:scale-100",
                  currentConversation?.id === conv.id
                    ? "bg-gradient-to-r from-primary/20 to-blue-500/20 border border-primary/40 shadow-md"
                    : "hover:bg-accent/50 border border-transparent hover:border-border/50"
                )}
                style={{
                  animation: `fade-up 0.3s ease-out ${index * 50}ms both`
                }}
              >
                {/* Background glow effect */}
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200 bg-gradient-to-r from-primary/10 via-transparent to-blue-500/10 pointer-events-none" />
                
                <div className="relative z-10 flex items-start gap-1.5 sm:gap-2.5">
                  <div className={cn(
                    "h-7 sm:h-8 w-7 sm:w-8 rounded-full flex items-center justify-center flex-shrink-0 transition-all duration-200",
                    currentConversation?.id === conv.id
                      ? "bg-gradient-to-br from-primary to-blue-500 text-white shadow-md scale-100"
                      : "bg-muted text-muted-foreground group-hover:bg-primary/20 group-active:scale-95 md:group-active:scale-100"
                  )}>
                    <MessageCircle className="h-3 sm:h-4 w-3 sm:w-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={cn(
                      "text-[11px] sm:text-xs md:text-sm font-semibold truncate transition-colors duration-200",
                      currentConversation?.id === conv.id
                        ? "text-foreground"
                        : "text-foreground/70 group-hover:text-foreground"
                    )}>
                      {conv.title || "New Chat"}
                    </p>
                    <p className="text-[9px] sm:text-[10px] md:text-xs text-muted-foreground mt-0.5 sm:mt-1 flex items-center gap-1">
                      <Clock className="h-2.5 sm:h-3 w-2.5 sm:w-3" />
                      {new Date(conv.updated_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </p>
                  </div>
                  {(conv.requires_admin || conv.assigned_admin_id) && (
                    <div className={cn(
                      "flex-shrink-0 h-5 sm:h-5 md:h-6 px-1 sm:px-1.5 md:px-2 rounded-full text-[8px] sm:text-[9px] md:text-xs font-medium flex items-center gap-1",
                      conv.assigned_admin_id
                        ? "bg-green-500/20 text-green-700 dark:text-green-400"
                        : "bg-orange-500/20 text-orange-700 dark:text-orange-400"
                    )}>
                      {conv.assigned_admin_id ? (
                        <>
                          <span className="w-1 h-1 sm:w-1.5 sm:h-1.5 rounded-full bg-green-500 animate-pulse" />
                          <span className="hidden sm:inline">A</span>
                        </>
                      ) : (
                        <>
                          <span className="w-1 h-1 sm:w-1.5 sm:h-1.5 rounded-full bg-orange-500" />
                          <span className="hidden sm:inline">P</span>
                        </>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
