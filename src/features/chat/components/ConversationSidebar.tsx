import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Loader2, Plus, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";

interface ConversationSidebarProps {
  conversations: any[];
  currentConversation: any;
  onSelectConversation: (conversation: any) => void;
  onNewConversation: () => void;
  isLoading: boolean;
  onClose?: () => void;
}

export function ConversationSidebar({
  conversations,
  currentConversation,
  onSelectConversation,
  onNewConversation,
  isLoading,
  onClose,
}: ConversationSidebarProps) {
  const [hoverId, setHoverId] = useState<string | null>(null);

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between p-2.5 sm:p-4 border-b border-border/30">
        <h3 className="font-semibold text-sm sm:text-base">Chat History</h3>
        <div className="flex gap-1 sm:gap-2">
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 sm:h-8 sm:w-8"
            onClick={onNewConversation}
            title="New chat"
          >
            <Plus className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 sm:h-8 sm:w-8 md:hidden"
            onClick={onClose}
          >
            <X className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
          </Button>
        </div>
      </div>

      {/* Conversations List */}
      <ScrollArea className="flex-1">
        <div className="space-y-1.5 sm:space-y-2 p-2 sm:p-3">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-4 w-4 sm:h-5 sm:w-5 animate-spin text-primary" />
            </div>
          ) : conversations.length === 0 ? (
            <p className="text-[10px] sm:text-xs text-muted-foreground text-center py-8">
              No conversations yet. Start one to begin!
            </p>
          ) : (
            conversations.map((conversation) => (
              <div
                key={conversation.id}
                onMouseEnter={() => setHoverId(conversation.id)}
                onMouseLeave={() => setHoverId(null)}
                className={cn(
                  "relative p-2.5 sm:p-3 rounded-lg cursor-pointer transition-all group",
                  currentConversation?.id === conversation.id
                    ? "bg-primary/20 border border-primary/50"
                    : "hover:bg-accent/50 border border-transparent"
                )}
                onClick={() => onSelectConversation(conversation)}
              >
                {/* Title */}
                <p className="text-xs sm:text-sm font-medium truncate">
                  {conversation.title || "Untitled"}
                </p>

                {/* Status & Date */}
                <div className="flex items-center justify-between mt-0.5 sm:mt-1 gap-2">
                  <div className="flex items-center gap-1 text-[9px] sm:text-xs flex-1 min-w-0">
                    {conversation.status === "closed" ? (
                      <>
                        <div className="w-1.5 h-1.5 rounded-full bg-red-500" />
                        <span className="text-red-600 dark:text-red-400 font-medium">Closed</span>
                      </>
                    ) : conversation.status === "archived" ? (
                      <>
                        <div className="w-1.5 h-1.5 rounded-full bg-gray-500" />
                        <span className="text-gray-600 dark:text-gray-400">Archived</span>
                      </>
                    ) : conversation.assigned_admin_id ? (
                      <>
                        <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
                        <span className="text-green-600 dark:text-green-400 font-medium">Admin</span>
                      </>
                    ) : conversation.requires_admin ? (
                      <>
                        <div className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
                        <span className="text-blue-600 dark:text-blue-400 font-medium">Waiting</span>
                      </>
                    ) : (
                      <>
                        <div className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                        <span className="text-amber-600 dark:text-amber-400">Active</span>
                      </>
                    )}
                  </div>
                  <p className="text-[9px] sm:text-xs text-muted-foreground flex-shrink-0">
                    {new Date(conversation.updated_at).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                    })}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      </ScrollArea>

      {/* Footer */}
      <div className="border-t border-border/30 p-2 sm:p-3 text-[10px] sm:text-xs text-muted-foreground text-center">
        {conversations.length} conversation{conversations.length !== 1 ? "s" : ""}
      </div>
    </div>
  );
}
