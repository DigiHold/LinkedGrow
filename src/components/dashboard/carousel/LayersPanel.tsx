"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { FabricObject, Textbox, Rect, Circle, Line, FabricImage, Group, Path, ActiveSelection } from "fabric";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  X,
  Eye,
  EyeOff,
  Copy,
  Trash2,
  ChevronRight,
  Type,
  Image as ImageIcon,
  Square,
  Circle as CircleIcon,
  Minus,
  Layers,
  Frame,
  Pen,
  ArrowUp,
  Group as GroupIcon,
  Ungroup as UngroupIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { CanvasWorkspaceRef } from "./CanvasWorkspace";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

interface LayersPanelProps {
  canvasRef: React.RefObject<CanvasWorkspaceRef | null>;
  onClose: () => void;
}

interface ContextMenuState {
  x: number;
  y: number;
  items: FlatLayerItem[];
}

interface FlatLayerItem {
  id: string;
  fabricObject: FabricObject;
  label: string;
  visible: boolean;
  depth: number;
  parentGroup: Group | null;
  isGroup: boolean;
  isExpanded: boolean;
  hasChildren: boolean;
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

function isUserGroup(obj: FabricObject): boolean {
  return obj instanceof Group && !prop(obj, '_isSvgIcon');
}

function getLayerLabel(obj: FabricObject): string {
  // Custom name takes priority
  const customName = prop(obj, '_layerName');
  if (customName) return customName;

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

// Build a flat list of all layers (including nested group children)
function buildFlatList(objects: FabricObject[], expandedGroups: Set<string>): FlatLayerItem[] {
  const result: FlatLayerItem[] = [];

  function addItem(obj: FabricObject, depth: number, parentGroup: Group | null) {
    if (prop(obj, 'isBackgroundRect')) return;

    const id = getObjectId(obj);
    const userGroup = isUserGroup(obj);
    const isExpanded = userGroup && expandedGroups.has(id);
    const children = userGroup ? (obj as Group).getObjects() : [];

    result.push({
      id,
      fabricObject: obj,
      label: getLayerLabel(obj),
      visible: obj.visible !== false,
      depth,
      parentGroup,
      isGroup: userGroup,
      isExpanded,
      hasChildren: children.length > 0,
    });

    if (isExpanded) {
      // Show children in reverse z-order (highest z first in list)
      for (let i = children.length - 1; i >= 0; i--) {
        addItem(children[i], depth + 1, obj as Group);
      }
    }
  }

  // Canvas objects: last has highest z-index, show first in list
  for (let i = objects.length - 1; i >= 0; i--) {
    addItem(objects[i], 0, null);
  }

  return result;
}

// Remove empty groups recursively up the chain
function cleanupEmptyGroup(group: Group, canvas: { remove: (obj: FabricObject) => void }) {
  if (group.getObjects().length > 0) return;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const parent = (group as any).parent as Group | undefined;
  if (parent && parent instanceof Group) {
    parent.remove(group);
    cleanupEmptyGroup(parent, canvas);
  } else {
    canvas.remove(group);
  }
}

// Sortable layer row
function SortableLayerRow({
  item,
  isSelected,
  onSelect,
  onMultiSelect,
  onContextMenu,
  onToggleVisibility,
  onDuplicate,
  onDelete,
  onToggleExpand,
  onMoveOut,
  onRename,
}: {
  item: FlatLayerItem;
  isSelected: boolean;
  onSelect: (obj: FabricObject) => void;
  onMultiSelect: (obj: FabricObject) => void;
  onContextMenu: (e: React.MouseEvent, item: FlatLayerItem) => void;
  onToggleVisibility: (obj: FabricObject) => void;
  onDuplicate: (obj: FabricObject) => void;
  onDelete: (obj: FabricObject) => void;
  onToggleExpand: (id: string) => void;
  onMoveOut: (obj: FabricObject, parent: Group) => void;
  onRename: (obj: FabricObject, name: string) => void;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

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

  const startRename = () => {
    setEditValue(item.label);
    setIsEditing(true);
    setTimeout(() => inputRef.current?.select(), 0);
  };

  const commitRename = () => {
    const trimmed = editValue.trim();
    if (trimmed && trimmed !== item.label) {
      onRename(item.fabricObject, trimmed);
    }
    setIsEditing(false);
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "flex items-center gap-1 px-2 py-1.5 rounded-md cursor-pointer group/layer transition-colors",
        isSelected && "bg-cyan-50 dark:bg-cyan-900/20 ring-1 ring-cyan-200 dark:ring-cyan-800",
        !isSelected && "hover:bg-slate-100 dark:hover:bg-slate-800",
        isDragging && "z-50 opacity-70 shadow-lg bg-background ring-1 ring-cyan-300",
        !item.visible && "opacity-50"
      )}
      onClick={(e) => {
        if (e.metaKey || e.ctrlKey) {
          onMultiSelect(item.fabricObject);
        } else {
          onSelect(item.fabricObject);
        }
      }}
      onContextMenu={(e) => { e.preventDefault(); e.stopPropagation(); onContextMenu(e, item); }}
      {...attributes}
      {...listeners}
    >
      {/* Depth indent + visual connector */}
      {item.depth > 0 && (
        <div className="flex items-center shrink-0" style={{ width: item.depth * 14 }}>
          <div className="w-px h-full bg-border/40 ml-1.5" />
        </div>
      )}

      {/* Group expand/collapse */}
      {item.isGroup && item.hasChildren ? (
        <button
          className="shrink-0 p-0.5 rounded hover:bg-slate-200 dark:hover:bg-slate-700"
          onPointerDown={(e) => e.stopPropagation()}
          onClick={(e) => { e.stopPropagation(); onToggleExpand(item.id); }}
        >
          <ChevronRight className={cn("w-3 h-3 transition-transform", item.isExpanded && "rotate-90")} />
        </button>
      ) : (
        <div className="w-4 shrink-0" />
      )}

      {/* Type icon */}
      <div className="text-muted-foreground shrink-0">
        {getLayerIcon(item.fabricObject)}
      </div>

      {/* Label - double-click to rename */}
      {isEditing ? (
        <input
          ref={inputRef}
          className="text-xs flex-1 bg-background border border-cyan-300 rounded px-1 py-0.5 outline-none focus:ring-1 focus:ring-cyan-400 min-w-0"
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onBlur={commitRename}
          onKeyDown={(e) => {
            if (e.key === 'Enter') commitRename();
            if (e.key === 'Escape') setIsEditing(false);
          }}
          onPointerDown={(e) => e.stopPropagation()}
          onClick={(e) => e.stopPropagation()}
        />
      ) : (
        <span
          className="text-xs truncate flex-1 select-none"
          onDoubleClick={(e) => { e.stopPropagation(); startRename(); }}
        >
          {item.label}
        </span>
      )}

      {/* Action buttons */}
      <div className="flex items-center gap-0 opacity-0 group-hover/layer:opacity-100 transition-opacity shrink-0">
        {/* Move out of group button */}
        {item.depth > 0 && item.parentGroup && (
          <button
            className="p-1 rounded hover:bg-cyan-100 dark:hover:bg-cyan-900/30 text-cyan-600 dark:text-cyan-400"
            onPointerDown={(e) => e.stopPropagation()}
            onClick={(e) => { e.stopPropagation(); onMoveOut(item.fabricObject, item.parentGroup!); }}
            title="Move out of group"
          >
            <ArrowUp className="w-3 h-3" />
          </button>
        )}
        <button
          className="p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-700"
          onPointerDown={(e) => e.stopPropagation()}
          onClick={(e) => { e.stopPropagation(); onToggleVisibility(item.fabricObject); }}
          title={item.visible ? "Hide" : "Show"}
        >
          {item.visible ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3 text-muted-foreground" />}
        </button>
        <button
          className="p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-700"
          onPointerDown={(e) => e.stopPropagation()}
          onClick={(e) => { e.stopPropagation(); onDuplicate(item.fabricObject); }}
          title="Duplicate"
        >
          <Copy className="w-3 h-3" />
        </button>
        <button
          className="p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-700 hover:text-red-500"
          onPointerDown={(e) => e.stopPropagation()}
          onClick={(e) => { e.stopPropagation(); onDelete(item.fabricObject); }}
          title="Delete"
        >
          <Trash2 className="w-3 h-3" />
        </button>
      </div>
    </div>
  );
}

export function LayersPanel({ canvasRef, onClose }: LayersPanelProps) {
  const [flatItems, setFlatItems] = useState<FlatLayerItem[]>([]);
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
  const [, forceRender] = useState(0);
  const [contextMenu, setContextMenu] = useState<ContextMenuState | null>(null);
  const expandedGroupsRef = useRef<Set<string>>(new Set());
  const flatItemsRef = useRef<FlatLayerItem[]>([]);
  const isDraggingRef = useRef(false);
  const panelRef = useRef<HTMLDivElement>(null);

  const refreshLayers = useCallback(() => {
    if (isDraggingRef.current) return; // Don't refresh mid-drag
    const canvas = canvasRef.current?.getCanvas();
    if (!canvas) return;
    const items = buildFlatList(canvas.getObjects(), expandedGroupsRef.current);
    setFlatItems(items);
    flatItemsRef.current = items;
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

  const multiSelectObject = useCallback((obj: FabricObject) => {
    const canvas = canvasRef.current?.getCanvas();
    if (!canvas) return;
    const active = canvas.getActiveObject();
    if (!active) {
      canvas.setActiveObject(obj);
    } else if (active instanceof ActiveSelection) {
      const objects = active.getObjects();
      if (objects.includes(obj)) {
        // Remove from selection - rebuild without this object
        const remaining = objects.filter(o => o !== obj);
        canvas.discardActiveObject();
        if (remaining.length === 1) {
          canvas.setActiveObject(remaining[0]);
        } else if (remaining.length > 1) {
          const selection = new ActiveSelection(remaining, { canvas });
          canvas.setActiveObject(selection);
        }
      } else {
        // Add to selection - rebuild with this object
        canvas.discardActiveObject();
        const selection = new ActiveSelection([...objects, obj], { canvas });
        canvas.setActiveObject(selection);
      }
    } else if (active === obj) {
      canvas.discardActiveObject();
    } else {
      // One object selected, CMD+clicking another - create ActiveSelection
      canvas.discardActiveObject();
      const selection = new ActiveSelection([active, obj], { canvas });
      canvas.setActiveObject(selection);
    }
    canvas.renderAll();
  }, [canvasRef]);

  // Close context menu on click anywhere
  useEffect(() => {
    if (!contextMenu) return;
    const handleClick = () => setContextMenu(null);
    window.addEventListener('click', handleClick);
    window.addEventListener('contextmenu', handleClick);
    return () => {
      window.removeEventListener('click', handleClick);
      window.removeEventListener('contextmenu', handleClick);
    };
  }, [contextMenu]);

  const handleContextMenu = useCallback((e: React.MouseEvent, item: FlatLayerItem) => {
    const canvas = canvasRef.current?.getCanvas();
    if (!canvas) return;
    const active = canvas.getActiveObject();
    // If right-clicked item is not in current selection, select it
    const isInSelection = active instanceof ActiveSelection && active.getObjects().includes(item.fabricObject);
    if (active !== item.fabricObject && !isInSelection) {
      canvas.setActiveObject(item.fabricObject);
      canvas.renderAll();
    }
    // Determine which items are contextually relevant
    const selectedItems: FlatLayerItem[] = [];
    const currentActive = canvas.getActiveObject();
    if (currentActive instanceof ActiveSelection) {
      const objs = currentActive.getObjects();
      for (const fi of flatItemsRef.current) {
        if (objs.includes(fi.fabricObject)) selectedItems.push(fi);
      }
    } else {
      selectedItems.push(item);
    }
    // Position relative to the panel
    const rect = panelRef.current?.getBoundingClientRect();
    setContextMenu({
      x: e.clientX - (rect?.left || 0),
      y: e.clientY - (rect?.top || 0),
      items: selectedItems,
    });
  }, [canvasRef]);

  const groupSelectedLayers = useCallback(() => {
    canvasRef.current?.groupSelected();
    setContextMenu(null);
    refreshLayers();
  }, [canvasRef, refreshLayers]);

  const ungroupSelectedLayers = useCallback(() => {
    canvasRef.current?.ungroupSelected();
    setContextMenu(null);
    refreshLayers();
  }, [canvasRef, refreshLayers]);

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
    // If inside a group, remove from group
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const parent = (obj as any).parent as Group | undefined;
    if (parent && parent instanceof Group) {
      parent.remove(obj);
      cleanupEmptyGroup(parent, canvas);
    } else {
      canvas.remove(obj);
    }
    canvas.renderAll();
    refreshLayers();
  }, [canvasRef, refreshLayers]);

  const duplicateContextItems = useCallback(() => {
    if (!contextMenu) return;
    for (const item of contextMenu.items) {
      duplicateObject(item.fabricObject);
    }
    setContextMenu(null);
  }, [contextMenu, duplicateObject]);

  const deleteContextItems = useCallback(() => {
    if (!contextMenu) return;
    for (const item of contextMenu.items) {
      deleteObject(item.fabricObject);
    }
    setContextMenu(null);
  }, [contextMenu, deleteObject]);

  const toggleExpand = useCallback((id: string) => {
    setExpandedGroups(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      expandedGroupsRef.current = next;
      return next;
    });
    // Refresh with new expanded state
    setTimeout(() => refreshLayers(), 0);
  }, [refreshLayers]);

  // Move an object out of its parent group
  const moveOutOfGroup = useCallback((obj: FabricObject, parentGroup: Group) => {
    const canvas = canvasRef.current?.getCanvas();
    if (!canvas) return;

    // Remove from group (Fabric.js auto-converts coords to absolute)
    parentGroup.remove(obj);
    obj.setCoords();

    // Add to parent's parent or canvas root
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const grandParent = (parentGroup as any).parent as Group | undefined;
    if (grandParent && grandParent instanceof Group) {
      // Insert after the parent group within grandparent
      const parentIdx = grandParent.getObjects().indexOf(parentGroup);
      grandParent.insertAt(parentIdx + 1, obj);
      grandParent.setCoords();
    } else {
      // Add to canvas, position right after the parent group in z-order
      canvas.add(obj);
      const parentIdx = canvas.getObjects().indexOf(parentGroup);
      if (parentIdx >= 0) {
        canvas.moveObjectTo(obj, parentIdx + 1);
      }
    }

    // Cleanup empty source group
    cleanupEmptyGroup(parentGroup, canvas);

    canvas.setActiveObject(obj);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (canvas as any).fire('object:modified', { target: obj });
    canvas.renderAll();
    refreshLayers();
  }, [canvasRef, refreshLayers]);

  // Rename a layer (stores custom name on the Fabric object, persists in JSON)
  const renameObject = useCallback((obj: FabricObject, name: string) => {
    (obj as any)._layerName = name;
    const canvas = canvasRef.current?.getCanvas();
    if (canvas) {
      (canvas as any).fire('object:modified', { target: obj });
    }
    refreshLayers();
  }, [canvasRef, refreshLayers]);

  // DnD sensors - entire row is draggable with distance activation
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  );

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    isDraggingRef.current = false;
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const canvas = canvasRef.current?.getCanvas();
    if (!canvas) return;

    const items = flatItemsRef.current;
    const activeItem = items.find(i => i.id === active.id);
    const overItem = items.find(i => i.id === over.id);
    if (!activeItem || !overItem) return;

    const obj = activeItem.fabricObject;
    const sourceParent = activeItem.parentGroup;
    const targetParent = overItem.parentGroup;

    // Prevent dragging a group into itself or its descendants
    if (activeItem.isGroup) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let check: FabricObject | undefined = targetParent || undefined;
      while (check) {
        if (check === obj) return;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        check = (check as any).parent;
      }
    }

    if (sourceParent === targetParent) {
      // Same parent - reorder within that parent
      if (sourceParent) {
        // Within a group
        const children = sourceParent.getObjects();
        const reversed = [...children].reverse(); // flat list order (highest z first)
        const oldIdx = reversed.indexOf(obj);
        const newIdx = reversed.indexOf(overItem.fabricObject);
        if (oldIdx === -1 || newIdx === -1) return;

        const reordered = arrayMove(reversed, oldIdx, newIdx);
        [...reordered].reverse().forEach((o, i) => {
          sourceParent.moveObjectTo(o, i);
        });
        sourceParent.setCoords();
      } else {
        // Canvas root
        const objects = canvas.getObjects().filter(o => !prop(o, 'isBackgroundRect'));
        const reversed = [...objects].reverse();
        const oldIdx = reversed.indexOf(obj);
        const newIdx = reversed.indexOf(overItem.fabricObject);
        if (oldIdx === -1 || newIdx === -1) return;

        const reordered = arrayMove(reversed, oldIdx, newIdx);
        const bgCount = canvas.getObjects().filter(o => prop(o, 'isBackgroundRect')).length;
        [...reordered].reverse().forEach((o, i) => {
          canvas.moveObjectTo(o, i + bgCount);
        });
      }
    } else {
      // Cross-parent move: element moves between groups or between group and canvas

      // Remove from source (Fabric.js auto-converts coords to absolute via _exitGroup)
      if (sourceParent) {
        sourceParent.remove(obj);
        obj.setCoords();
        cleanupEmptyGroup(sourceParent, canvas);
      } else {
        canvas.remove(obj);
      }

      // Add to target (Fabric.js auto-converts coords to group-relative via _enterGroup)
      if (targetParent) {
        const overIdx = targetParent.getObjects().indexOf(overItem.fabricObject);
        if (overIdx >= 0) {
          targetParent.insertAt(overIdx, obj);
        } else {
          targetParent.add(obj);
        }
        targetParent.setCoords();
      } else {
        canvas.add(obj);
        // Position near the over item in z-order
        const overIdx = canvas.getObjects().indexOf(overItem.fabricObject);
        if (overIdx >= 0) {
          canvas.moveObjectTo(obj, overIdx);
        }
      }
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (canvas as any).fire('object:modified', { target: obj });
    canvas.renderAll();
    refreshLayers();
  }, [canvasRef, refreshLayers]);

  // Get active object for highlighting (supports multi-select)
  const canvas = canvasRef.current?.getCanvas();
  const activeObject = canvas?.getActiveObject();
  const selectedObjects = activeObject instanceof ActiveSelection
    ? new Set(activeObject.getObjects())
    : activeObject ? new Set([activeObject]) : new Set<FabricObject>();

  // Context menu: determine if group/ungroup is available
  const canGroup = contextMenu && contextMenu.items.length >= 2 && contextMenu.items.every(i => i.depth === 0);
  const canUngroup = contextMenu && contextMenu.items.length === 1 && contextMenu.items[0].isGroup;

  const sortableIds = flatItems.map(item => item.id);

  return (
    <div ref={panelRef} className="h-full flex flex-col border-r border-border bg-background relative">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border shrink-0">
        <div className="flex items-center gap-2">
          <Layers className="w-4 h-4" />
          <span className="font-semibold text-sm">Layers</span>
        </div>
        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onClose}>
          <X className="w-4 h-4" />
        </Button>
      </div>

      {/* Layer list */}
      <ScrollArea className="flex-1">
        <div className="p-2 space-y-0.5">
          {flatItems.length === 0 ? (
            <div className="text-center py-8 text-xs text-muted-foreground">
              No elements on canvas
            </div>
          ) : (
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragStart={() => { isDraggingRef.current = true; }}
              onDragEnd={handleDragEnd}
              onDragCancel={() => { isDraggingRef.current = false; }}
            >
              <SortableContext items={sortableIds} strategy={verticalListSortingStrategy}>
                {flatItems.map((item) => (
                  <SortableLayerRow
                    key={item.id}
                    item={item}
                    isSelected={selectedObjects.has(item.fabricObject)}
                    onSelect={selectObject}
                    onMultiSelect={multiSelectObject}
                    onContextMenu={handleContextMenu}
                    onToggleVisibility={toggleVisibility}
                    onDuplicate={duplicateObject}
                    onDelete={deleteObject}
                    onToggleExpand={toggleExpand}
                    onMoveOut={moveOutOfGroup}
                    onRename={renameObject}
                  />
                ))}
              </SortableContext>
            </DndContext>
          )}
        </div>
      </ScrollArea>

      {/* Right-click context menu */}
      {contextMenu && (
        <div
          className="absolute z-100 bg-popover border border-border rounded-lg shadow-lg py-1 min-w-40"
          style={{ left: contextMenu.x, top: contextMenu.y }}
          onClick={(e) => e.stopPropagation()}
        >
          <button
            className="flex items-center gap-2 w-full px-3 py-1.5 text-xs hover:bg-accent text-left"
            onClick={duplicateContextItems}
          >
            <Copy className="w-3.5 h-3.5" />
            Duplicate
          </button>
          {canGroup && (
            <button
              className="flex items-center gap-2 w-full px-3 py-1.5 text-xs hover:bg-accent text-left"
              onClick={groupSelectedLayers}
            >
              <GroupIcon className="w-3.5 h-3.5" />
              Group
            </button>
          )}
          {canUngroup && (
            <button
              className="flex items-center gap-2 w-full px-3 py-1.5 text-xs hover:bg-accent text-left"
              onClick={ungroupSelectedLayers}
            >
              <UngroupIcon className="w-3.5 h-3.5" />
              Ungroup
            </button>
          )}
          <div className="h-px bg-border my-1" />
          <button
            className="flex items-center gap-2 w-full px-3 py-1.5 text-xs hover:bg-accent text-left text-red-500"
            onClick={deleteContextItems}
          >
            <Trash2 className="w-3.5 h-3.5" />
            Delete
          </button>
        </div>
      )}
    </div>
  );
}
