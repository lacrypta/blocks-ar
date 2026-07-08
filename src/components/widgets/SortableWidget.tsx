"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { WidgetDef } from "./registry";
import { cn } from "@/lib/cn";

export function SortableWidget({
  def,
  editMode,
  onHide,
}: {
  def: WidgetDef;
  editMode: boolean;
  onHide: () => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: def.id, disabled: !editMode });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const spanClass = def.span === "full" ? "lg:col-span-2" : "col-span-1";

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "relative col-span-1",
        spanClass,
        editMode &&
          "rounded-2xl outline-2 outline-dashed outline-offset-4 outline-primary/40",
        isDragging && "z-20 opacity-80",
      )}
    >
      {editMode && (
        <div className="pointer-events-none absolute inset-x-0 top-0 z-20 flex -translate-y-1/2 items-center justify-between gap-2 px-3">
          <button
            ref={setActivatorNodeRef}
            {...attributes}
            {...listeners}
            aria-label={`Mover ${def.title}`}
            className="pointer-events-auto inline-flex cursor-grab items-center gap-1.5 rounded-full border border-border bg-surface px-2.5 py-1 text-[11px] font-medium text-fg shadow-sm active:cursor-grabbing"
          >
            <GripIcon className="h-3.5 w-3.5 text-muted" />
            {def.title}
          </button>
          <button
            onClick={onHide}
            aria-label={`Ocultar ${def.title}`}
            className="pointer-events-auto inline-flex items-center gap-1 rounded-full border border-border bg-surface px-2.5 py-1 text-[11px] font-medium text-muted shadow-sm hover:text-down"
          >
            <EyeOffIcon className="h-3.5 w-3.5" />
            Ocultar
          </button>
        </div>
      )}

      <div className={cn(editMode && "pointer-events-none select-none")}>
        {def.render()}
      </div>
    </div>
  );
}

function GripIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <circle cx="9" cy="6" r="1.6" />
      <circle cx="15" cy="6" r="1.6" />
      <circle cx="9" cy="12" r="1.6" />
      <circle cx="15" cy="12" r="1.6" />
      <circle cx="9" cy="18" r="1.6" />
      <circle cx="15" cy="18" r="1.6" />
    </svg>
  );
}

function EyeOffIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
      <line x1="1" y1="1" x2="23" y2="23" />
    </svg>
  );
}
