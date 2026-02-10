import { useState, useEffect } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ZoomIn, ZoomOut, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface ImageViewerProps {
  isOpen: boolean;
  imageUrl: string | null;
  onClose: () => void;
}

export function ImageViewer({ isOpen, imageUrl, onClose }: ImageViewerProps) {
  const [zoom, setZoom] = useState(1);
  const [isLoading, setIsLoading] = useState(true);

  // Reset zoom when image changes
  useEffect(() => {
    setZoom(1);
  }, [imageUrl]);

  const handleZoomIn = () => {
    setZoom((prev) => Math.min(prev + 0.2, 3));
  };

  const handleZoomOut = () => {
    setZoom((prev) => Math.max(prev - 0.2, 0.5));
  };

  const handleReset = () => {
    setZoom(1);
  };

  // Handle keyboard shortcuts
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      } else if (e.key === "+") {
        handleZoomIn();
      } else if (e.key === "-") {
        handleZoomOut();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] w-full p-0 bg-black/90 border-0">
        <div className="relative w-full h-full flex flex-col">
          {/* Close Button */}
          <div className="absolute top-4 right-4 z-50 flex gap-2">
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 rounded-full bg-white/10 hover:bg-white/20"
              onClick={onClose}
            >
              <X className="h-5 w-5 text-white" />
            </Button>
          </div>

          {/* Image Container */}
          <div className="flex-1 flex items-center justify-center overflow-auto p-4">
            <div className="relative">
              {isLoading && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-2 border-white border-t-transparent"></div>
                </div>
              )}
              {imageUrl && (
                <img
                  src={imageUrl}
                  alt="Expanded view"
                  onLoad={() => setIsLoading(false)}
                  style={{
                    transform: `scale(${zoom})`,
                    transition: "transform 0.2s ease-in-out",
                    maxWidth: "100%",
                    maxHeight: "70vh",
                  }}
                  className={cn(
                    "rounded-lg",
                    isLoading && "opacity-0",
                    "cursor-zoom-in"
                  )}
                />
              )}
            </div>
          </div>

          {/* Controls Footer */}
          <div className="border-t border-white/10 bg-black/50 backdrop-blur-sm p-4 flex items-center justify-between gap-4">
            <div className="flex-1"></div>
            
            {/* Zoom Controls */}
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9 bg-white/10 hover:bg-white/20"
                onClick={handleZoomOut}
                disabled={zoom <= 0.5}
              >
                <ZoomOut className="h-4 w-4 text-white" />
              </Button>

              <div className="px-3 py-1.5 bg-white/10 rounded-md text-white text-sm min-w-[60px] text-center">
                {Math.round(zoom * 100)}%
              </div>

              <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9 bg-white/10 hover:bg-white/20"
                onClick={handleZoomIn}
                disabled={zoom >= 3}
              >
                <ZoomIn className="h-4 w-4 text-white" />
              </Button>

              <div className="w-px h-6 bg-white/20"></div>

              <Button
                variant="ghost"
                size="sm"
                className="h-9 px-3 bg-white/10 hover:bg-white/20 text-white"
                onClick={handleReset}
              >
                Reset
              </Button>
            </div>

            <div className="flex-1 text-right text-xs text-white/50">
              Use +/- keys or scroll to zoom
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
