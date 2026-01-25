"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import {
  Plus,
  Copy,
  Trash2,
  GripVertical,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  horizontalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

export interface SlideState {
  id: string;
  canvasJSON: string;
  thumbnail: string;
}

interface SlideManagerProps {
  slides: SlideState[];
  currentSlideIndex: number;
  onSlideSelect: (index: number) => void;
  onSlideAdd: () => void;
  onSlideDuplicate: (index: number) => void;
  onSlideDelete: (index: number) => void;
  onSlidesReorder: (slides: SlideState[]) => void;
  className?: string;
}

interface SortableSlideProps {
  slide: SlideState;
  index: number;
  isActive: boolean;
  totalSlides: number;
  onSelect: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
}

function SortableSlide({
  slide,
  index,
  isActive,
  totalSlides,
  onSelect,
  onDuplicate,
  onDelete,
}: SortableSlideProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: slide.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "group relative flex-shrink-0 cursor-pointer transition-all",
        isActive && "ring-2 ring-cyan-500 ring-offset-2",
        isDragging && "z-50"
      )}
    >
      {/* Slide Number Badge */}
      <div className="absolute -top-2 -left-2 z-10 w-6 h-6 rounded-full bg-slate-800 text-white text-xs flex items-center justify-center font-medium">
        {index + 1}
      </div>

      {/* Drag Handle */}
      <button
        {...attributes}
        {...listeners}
        className="absolute -top-2 left-1/2 -translate-x-1/2 z-10 p-1 rounded bg-slate-200 dark:bg-slate-700 opacity-0 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing"
      >
        <GripVertical className="w-3 h-3" />
      </button>

      {/* Thumbnail */}
      <div
        onClick={onSelect}
        className={cn(
          "w-24 h-30 rounded-lg overflow-hidden border-2 transition-all bg-white",
          isActive ? "border-cyan-500" : "border-border hover:border-cyan-300"
        )}
      >
        {slide.thumbnail ? (
          <img
            src={slide.thumbnail}
            alt={`Slide ${index + 1}`}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-slate-100 dark:bg-slate-800">
            <span className="text-xs text-muted-foreground">Empty</span>
          </div>
        )}
      </div>

      {/* Actions (visible on hover) */}
      <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <Button
          variant="secondary"
          size="icon"
          className="h-6 w-6"
          onClick={(e) => {
            e.stopPropagation();
            onDuplicate();
          }}
          title="Duplicate slide"
        >
          <Copy className="w-3 h-3" />
        </Button>
        {totalSlides > 1 && (
          <Button
            variant="secondary"
            size="icon"
            className="h-6 w-6 hover:bg-destructive hover:text-destructive-foreground"
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            title="Delete slide"
          >
            <Trash2 className="w-3 h-3" />
          </Button>
        )}
      </div>
    </div>
  );
}

export function SlideManager({
  slides,
  currentSlideIndex,
  onSlideSelect,
  onSlideAdd,
  onSlideDuplicate,
  onSlideDelete,
  onSlidesReorder,
  className,
}: SlideManagerProps) {
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = slides.findIndex((s) => s.id === active.id);
      const newIndex = slides.findIndex((s) => s.id === over.id);

      const newSlides = arrayMove(slides, oldIndex, newIndex);
      onSlidesReorder(newSlides);

      // Update current slide index if needed
      if (currentSlideIndex === oldIndex) {
        onSlideSelect(newIndex);
      } else if (
        currentSlideIndex > oldIndex &&
        currentSlideIndex <= newIndex
      ) {
        onSlideSelect(currentSlideIndex - 1);
      } else if (
        currentSlideIndex < oldIndex &&
        currentSlideIndex >= newIndex
      ) {
        onSlideSelect(currentSlideIndex + 1);
      }
    }
  };

  const handlePrevSlide = () => {
    if (currentSlideIndex > 0) {
      onSlideSelect(currentSlideIndex - 1);
    }
  };

  const handleNextSlide = () => {
    if (currentSlideIndex < slides.length - 1) {
      onSlideSelect(currentSlideIndex + 1);
    }
  };

  return (
    <div
      className={cn(
        "h-40 bg-slate-50 dark:bg-slate-900 border-t flex items-center",
        className
      )}
    >
      {/* Navigation - Previous */}
      <Button
        variant="ghost"
        size="icon"
        className="h-full w-10 rounded-none shrink-0"
        onClick={handlePrevSlide}
        disabled={currentSlideIndex === 0}
      >
        <ChevronLeft className="w-5 h-5" />
      </Button>

      {/* Slides Container */}
      <div className="flex-1 overflow-hidden">
        <ScrollArea className="w-full">
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={slides.map((s) => s.id)}
              strategy={horizontalListSortingStrategy}
            >
              <div className="flex gap-6 p-4 items-center min-w-max">
                {slides.map((slide, index) => (
                  <SortableSlide
                    key={slide.id}
                    slide={slide}
                    index={index}
                    isActive={index === currentSlideIndex}
                    totalSlides={slides.length}
                    onSelect={() => onSlideSelect(index)}
                    onDuplicate={() => onSlideDuplicate(index)}
                    onDelete={() => onSlideDelete(index)}
                  />
                ))}

                {/* Add Slide Button */}
                <Button
                  variant="outline"
                  className="w-24 h-30 flex-shrink-0 flex flex-col gap-2 border-dashed hover:border-cyan-500 hover:bg-cyan-50 dark:hover:bg-cyan-950"
                  onClick={onSlideAdd}
                >
                  <Plus className="w-5 h-5" />
                  <span className="text-xs">Add Slide</span>
                </Button>
              </div>
            </SortableContext>
          </DndContext>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>
      </div>

      {/* Navigation - Next */}
      <Button
        variant="ghost"
        size="icon"
        className="h-full w-10 rounded-none shrink-0"
        onClick={handleNextSlide}
        disabled={currentSlideIndex === slides.length - 1}
      >
        <ChevronRight className="w-5 h-5" />
      </Button>

      {/* Slide Counter */}
      <div className="px-4 text-sm text-muted-foreground shrink-0 border-l">
        <span className="font-medium text-foreground">
          {currentSlideIndex + 1}
        </span>
        <span> / {slides.length}</span>
      </div>
    </div>
  );
}
