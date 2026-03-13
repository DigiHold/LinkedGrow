"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { FabricObject, Textbox, Rect, Circle, Line, FabricImage, Group, Path } from "fabric";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  X,
  Eye,
  EyeOff,
  Copy,
  Trash2,
  GripVertical,
  ChevronRight,
  Type,
  Image as ImageIcon,
  Square,
  Circle as CircleIcon,
  Minus,
  Layers,
  Frame,
  Pen,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { CanvasWorkspaceRef } from "./CanvasWorkspace";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

interface LayersPanelProps {
  canvasRef: React.RefObject<CanvasWorkspaceRef | null>;
  onClose: () => void;
}

interface LayerItem {
  id: string;
  fabricObject: FabricObject;
  type: string;
  label: string;
  visible: boolean;
  children?: LayerItem[];
}

// Stable object ID mapping
const objectIdMap = new WeakMap<FabricObject, string>();
let idCounter = 0;
function getObjectId(obj: FabricObject): string {
  if (!objectIdMap.has(obj)) {
    objectIdMap.set(obj, `layer-${++idCounter}`);
  }
  return objectIdMap.get(obj)!;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function prop(obj: FabricObject, key: string): any { return (obj as any)[key]; }

function getLayerLabel(obj: FabricObject): string {
  if (obj instanceof Textbox) {
    const text = obj.text || 'Text';
    return text.length > 20 ? text.substring(0, 20) + '...' : text;
  }
  if (prop(obj, '_isFrame')) {
    const frameId = prop(obj, '_frameId');
    return frameId ? `Frame: ${frameId}` : 'Frame';
  }
  if (prop(obj, '_isSvgIcon')) return 'Icon';
  if (obj instanceof FabricImage) return 'Image';
  if (obj instanceof Circle) return 'Circle';
  if (obj instanceof Rect) return 'Rectangle';
  if (obj instanceof Line) return 'Line';
  if (obj instanceof Group) return 'Group';
  if (obj instanceof Path) return 'Path';
  return obj.type || 'Element';
}

function getLayerIcon(obj: FabricObject) {
  if (obj instanceof Textbox) return <Type className="w-3.5 h-3.5" />;
  if (prop(obj, '_isFrame')) return <Frame className="w-3.5 h-3.5" />;
  if (prop(obj, '_isSvgIcon')) return <Pen className="w-3.5 h-3.5" />;
  if (obj instanceof FabricImage) return <ImageIcon className="w-3.5 h-3.5" />;
  if (obj instanceof Circle) return <CircleIcon className="w-3.5 h-3.5" />;
  if (obj instanceof Rect) return <Square className="w-3.5 h-3.5" />;
  if (obj instanceof Line) return <Minus className="w-3.5 h-3.5" />;
  if (obj instanceof Group) return <Layers className="w-3.5 h-3.5" />;
  if (obj instanceof Path) return <Pen className="w-3.5 h-3.5" />;
  return <Square className="w-3.5 h-3.5" />;
}

function buildLayerItem(obj: FabricObject): LayerItem {
  const item: LayerItem = {
    id: getObjectId(obj),
    fabricObject: obj,
    type: obj.type || 'object',
    label: getLayerLabel(obj),
    visible: obj.visible !== false,
  };
  if (obj instanceof Group) {
    const children = obj.getObjects();
    item.children = children.map(child => buildLayerItem(child));
  }
  return item;
}

// Sortable layer row component
function SortableLayerRow({
  item,
  isSelected,
  depth,
  expandedGroups,
  onSelect,
  onToggleVisibility,
  onDuplicate,
  onDelete,
  onToggleExpand,
}: {
  item: LayerItem;
  isSelected: boolean;
  depth: number;
  expandedGroups: Set<string>;
  onSelect: (obj: FabricObject) => void;
  onToggleVisibility: (obj: FabricObject) => void;
  onDuplicate: (obj: FabricObject) => void;
  onDelete: (obj: FabricObject) => void;
  onToggleExpand: (id: string) => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const isGroup = item.children && item.children.length > 0;
  const isExpanded = expandedGroups.has(item.id);

  return (
    <>
      <div
        ref={setNodeRef}
        style={style}
        className={cn(
          "flex items-center gap-1.5 px-2 py-1.5 rounded-md cursor-pointer group transition-colors",
          isSelected && "bg-cyan-50 dark:bg-cyan-900/20 ring-1 ring-cyan-200 dark:ring-cyan-800",
          !isSelected && "hover:bg-slate-100 dark:hover:bg-slate-800",
          isDragging && "z-50 opacity-80 shadow-lg bg-background",
          !item.visible && "opacity-50"
        )}
        onClick={() => onSelect(item.fabricObject)}
      >
        {/* Drag handle */}
        <div
          {...attributes}
          {...listeners}
          className="cursor-grab active:cursor-grabbing text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
          style={{ marginLeft: depth * 16 }}
        >
          <GripVertical className="w-3 h-3" />
        </div>

        {/* Group expand/collapse */}
        {isGroup ? (
          <button
            className="shrink-0 p-0.5 rounded hover:bg-slate-200 dark:hover:bg-slate-700"
            onClick={(e) => { e.stopPropagation(); onToggleExpand(item.id); }}
          >
            <ChevronRight className={cn("w-3 h-3 transition-transform", isExpanded && "rotate-90")} />
          </button>
        ) : (
          <div className="w-4 shrink-0" />
        )}

        {/* Type icon */}
        <div className="text-muted-foreground shrink-0">
          {getLayerIcon(item.fabricObject)}
        </div>

        {/* Label */}
        <span className="text-xs truncate flex-1 select-none">{item.label}</span>

        {/* Action buttons - visible on hover */}
        <div className="flex items-center gap-0 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
          <button
            className="p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-700"
            onClick={(e) => { e.stopPropagation(); onToggleVisibility(item.fabricObject); }}
            title={item.visible ? "Hide" : "Show"}
          >
            {item.visible ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3 text-muted-foreground" />}
          </button>
          <button
            className="p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-700"
            onClick={(e) => { e.stopPropagation(); onDuplicate(item.fabricObject); }}
            title="Duplicate"
          >
            <Copy className="w-3 h-3" />
          </button>
          <button
            className="p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-700 hover:text-red-500"
            onClick={(e) => { e.stopPropagation(); onDelete(item.fabricObject); }}
            title="Delete"
          >
            <Trash2 className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* Group children */}
      {isGroup && isExpanded && item.children?.map((child) => (
        <SortableLayerRow
          key={child.id}
          item={child}
          isSelected={false}
          depth={depth + 1}
          expandedGroups={expandedGroups}
          onSelect={onSelect}
          onToggleVisibility={onToggleVisibility}
          onDuplicate={onDuplicate}
          onDelete={onDelete}
          onToggleExpand={onToggleExpand}
        />
      ))}
    </>
  );
}

export function LayersPanel({ canvasRef, onClose }: LayersPanelProps) {
  const [layerItems, setLayerItems] = useState<LayerItem[]>([]);
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
  const [, forceRender] = useState(0);
  const refreshCountRef = useRef(0);

  const refreshLayers = useCallback(() => {
    const canvas = canvasRef.current?.getCanvas();
    if (!canvas) return;

    const objects = canvas.getObjects();
    const layers: LayerItem[] = [];

    // Reverse order: top z-order first
    for (let i = objects.length - 1; i >= 0; i--) {
      const obj = objects[i];
      if (prop(obj, 'isBackgroundRect')) continue;
      layers.push(buildLayerItem(obj));
    }

    setLayerItems(layers);
    refreshCountRef.current++;
  }, [canvasRef]);

  // Subscribe to canvas events
  useEffect(() => {
    const canvas = canvasRef.current?.getCanvas();
    if (!canvas) return;

    const onChanged = () => refreshLayers();
    const onSelection = () => forceRender(c => c + 1);

    canvas.on('object:added', onChanged);
    canvas.on('object:removed', onChanged);
    canvas.on('object:modified', onChanged);
    canvas.on('selection:created', onSelection);
    canvas.on('selection:updated', onSelection);
    canvas.on('selection:cleared', onSelection);

    // Initial load
    refreshLayers();

    return () => {
      canvas.off('object:added', onChanged);
      canvas.off('object:removed', onChanged);
      canvas.off('object:modified', onChanged);
      canvas.off('selection:created', onSelection);
      canvas.off('selection:updated', onSelection);
      canvas.off('selection:cleared', onSelection);
    };
  }, [canvasRef, refreshLayers]);

  const selectObject = useCallback((obj: FabricObject) => {
    const canvas = canvasRef.current?.getCanvas();
    if (!canvas) return;
    canvas.setActiveObject(obj);
    canvas.renderAll();
  }, [canvasRef]);

  const toggleVisibility = useCallback((obj: FabricObject) => {
    const canvas = canvasRef.current?.getCanvas();
    if (!canvas) return;
    obj.visible = !obj.visible;
    if (!obj.visible) {
      const active = canvas.getActiveObject();
      if (active === obj) canvas.discardActiveObject();
    }
    canvas.renderAll();
    refreshLayers();
  }, [canvasRef, refreshLayers]);

  const duplicateObject = useCallback((obj: FabricObject) => {
    const canvas = canvasRef.current?.getCanvas();
    if (!canvas) return;
    obj.clone().then((cloned: FabricObject) => {
      cloned.set({ left: (obj.left || 0) + 20, top: (obj.top || 0) + 20 });
      canvas.add(cloned);
      canvas.setActiveObject(cloned);
      canvas.renderAll();
    });
  }, [canvasRef]);

  const deleteObject = useCallback((obj: FabricObject) => {
    const canvas = canvasRef.current?.getCanvas();
    if (!canvas) return;
    const active = canvas.getActiveObject();
    if (active === obj) canvas.discardActiveObject();
    canvas.remove(obj);
    canvas.renderAll();
  }, [canvasRef]);

  const toggleExpand = useCallback((id: string) => {
    setExpandedGroups(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  // Drag-and-drop sensors
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const canvas = canvasRef.current?.getCanvas();
    if (!canvas) return;

    const objects = canvas.getObjects().filter(o => !prop(o, 'isBackgroundRect'));
    const reversedObjects = [...objects].reverse(); // UI order (top first)

    const oldIndex = reversedObjects.findIndex(o => getObjectId(o) === active.id);
    const newIndex = reversedObjects.findIndex(o => getObjectId(o) === over.id);
    if (oldIndex === -1 || newIndex === -1) return;

    const reordered = arrayMove(reversedObjects, oldIndex, newIndex);
    // Reverse back to z-order and apply
    const newZOrder = [...reordered].reverse();
    const bgCount = canvas.getObjects().filter(o => prop(o, 'isBackgroundRect')).length;

    newZOrder.forEach((obj, index) => {
      canvas.moveObjectTo(obj, index + bgCount);
    });

    canvas.renderAll();
    refreshLayers();
  }, [canvasRef, refreshLayers]);

  // Get active object for highlighting
  const canvas = canvasRef.current?.getCanvas();
  const activeObject = canvas?.getActiveObject();

  const layerIds = layerItems.map(item => item.id);

  return (
    <div className="h-full flex flex-col border-l border-border bg-background">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border shrink-0">
        <div className="flex items-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M13 13.74a2 2 0 0 1-2 0L2.5 8.87a1 1 0 0 1 0-1.74L11 2.26a2 2 0 0 1 2 0l8.5 4.87a1 1 0 0 1 0 1.74z"/><path d="m20 14.285 1.5.845a1 1 0 0 1 0 1.74L13 21.74a2 2 0 0 1-2 0l-8.5-4.87a1 1 0 0 1 0-1.74l1.5-.845"/></svg>
          <span className="font-semibold text-sm">Layers</span>
        </div>
        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onClose}>
          <X className="w-4 h-4" />
        </Button>
      </div>

      {/* Layer list */}
      <ScrollArea className="flex-1">
        <div className="p-2 space-y-0.5">
          {layerItems.length === 0 ? (
            <div className="text-center py-8 text-xs text-muted-foreground">
              No elements on canvas
            </div>
          ) : (
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
              <SortableContext items={layerIds} strategy={verticalListSortingStrategy}>
                {layerItems.map((item) => (
                  <SortableLayerRow
                    key={item.id}
                    item={item}
                    isSelected={activeObject === item.fabricObject}
                    depth={0}
                    expandedGroups={expandedGroups}
                    onSelect={selectObject}
                    onToggleVisibility={toggleVisibility}
                    onDuplicate={duplicateObject}
                    onDelete={deleteObject}
                    onToggleExpand={toggleExpand}
                  />
                ))}
              </SortableContext>
            </DndContext>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
