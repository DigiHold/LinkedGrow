"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Loader2,
  Layers,
  Trash2,
  Copy,
  FolderOpen,
  Search,
  MoreVertical,
  Calendar,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";

interface SavedCarousel {
  id: string;
  name: string;
  description: string | null;
  thumbnail: string | null;
  slideCount: number;
  createdAt: string;
  updatedAt: string;
}

interface CarouselData {
  id: string;
  name: string;
  description: string | null;
  slidesJson: string;
}

interface MyCarouselsProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onLoadCarousel: (data: CarouselData) => void;
  onDuplicateCarousel: (slidesJson: string, name: string) => void;
}

export function MyCarousels({
  open,
  onOpenChange,
  onLoadCarousel,
  onDuplicateCarousel,
}: MyCarouselsProps) {
  const [carousels, setCarousels] = useState<SavedCarousel[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [loadingId, setLoadingId] = useState<string | null>(null);

  const fetchCarousels = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/carousels");
      if (response.ok) {
        const data = await response.json();
        setCarousels(data.carousels || []);
      }
    } catch (error) {
} finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (open) {
      fetchCarousels();
    }
  }, [open, fetchCarousels]);

  const handleLoad = async (id: string) => {
    setLoadingId(id);
    try {
      const response = await fetch(`/api/carousels/${id}`);
      if (response.ok) {
        const data = await response.json();
        const carousel = data.carousel;
        onLoadCarousel({
          id: carousel.id,
          name: carousel.name,
          description: carousel.description,
          slidesJson: carousel.slidesJson,
        });
        onOpenChange(false);
      }
    } catch (error) {
} finally {
      setLoadingId(null);
    }
  };

  const handleDuplicate = async (id: string, name: string) => {
    setLoadingId(id);
    try {
      const response = await fetch(`/api/carousels/${id}`);
      if (response.ok) {
        const data = await response.json();
        onDuplicateCarousel(data.carousel.slidesJson, `${name} (Copy)`);
        onOpenChange(false);
      }
    } catch (error) {
} finally {
      setLoadingId(null);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    setIsDeleting(true);
    try {
      const response = await fetch(`/api/carousels/${deleteId}`, {
        method: "DELETE",
      });
      if (response.ok) {
        setCarousels((prev) => prev.filter((c) => c.id !== deleteId));
      }
    } catch (error) {
} finally {
      setIsDeleting(false);
      setDeleteId(null);
    }
  };

  const filteredCarousels = carousels.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.description?.toLowerCase().includes(search.toLowerCase())
  );

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-3xl max-h-[85vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Layers className="w-5 h-5 text-cyan-600" />
              My Saved Carousels
            </DialogTitle>
          </DialogHeader>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 dark:text-slate-400" />
            <Input
              placeholder="Search carousels..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>

          {/* Carousels Grid */}
          <ScrollArea className="flex-1 min-h-0">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-6 h-6 animate-spin text-slate-500 dark:text-slate-400" />
              </div>
            ) : filteredCarousels.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-4">
                  <Layers className="w-8 h-8 text-slate-500 dark:text-slate-400" />
                </div>
                <h3 className="font-medium mb-1">No carousels saved yet</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 max-w-sm">
                  Create a carousel in the editor and click "Save Carousel" to save it here for reuse.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 p-1">
                {filteredCarousels.map((carousel) => (
                  <div
                    key={carousel.id}
                    className={cn(
                      "group relative rounded-lg border border-border bg-card overflow-hidden",
                      "hover:border-cyan-300 transition-colors hover:border-slate-300 dark:hover:border-white/20 duration-200"
                    )}
                  >
                    {/* Thumbnail */}
                    <div
                      className="aspect-[4/5] bg-slate-100 dark:bg-slate-800 relative cursor-pointer"
                      onClick={() => handleLoad(carousel.id)}
                    >
                      {carousel.thumbnail ? (
                        <img
                          src={carousel.thumbnail}
                          alt={carousel.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <Layers className="w-12 h-12 text-slate-500 dark:text-slate-400/30" />
                        </div>
                      )}

                      {/* Slide count badge */}
                      <div className="absolute top-2 left-2 px-2 py-0.5 rounded-full bg-black/60 text-white text-xs">
                        {carousel.slideCount} slides
                      </div>

                      {/* Loading overlay */}
                      {loadingId === carousel.id && (
                        <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                          <Loader2 className="w-6 h-6 animate-spin text-white" />
                        </div>
                      )}

                      {/* Hover overlay */}
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                        <Button
                          size="sm"
                          className="bg-white text-black hover:bg-white/90"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleLoad(carousel.id);
                          }}
                        >
                          <FolderOpen className="w-4 h-4 mr-1" />
                          Open
                        </Button>
                      </div>
                    </div>

                    {/* Info */}
                    <div className="p-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <h3 className="font-medium text-sm truncate">
                            {carousel.name}
                          </h3>
                          <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1 mt-0.5">
                            <Calendar className="w-3 h-3" />
                            {formatDate(carousel.updatedAt)}
                          </p>
                        </div>

                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 shrink-0"
                            >
                              <MoreVertical className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={() => handleLoad(carousel.id)}
                            >
                              <FolderOpen className="w-4 h-4 mr-2" />
                              Open
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() =>
                                handleDuplicate(carousel.id, carousel.name)
                              }
                            >
                              <Copy className="w-4 h-4 mr-2" />
                              Duplicate
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => setDeleteId(carousel.id)}
                              className="text-destructive focus:text-destructive"
                            >
                              <Trash2 className="w-4 h-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Carousel?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this carousel. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : (
                <Trash2 className="w-4 h-4 mr-2" />
              )}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
