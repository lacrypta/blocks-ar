"use client";

import { useWidgetLayout } from "@/store/useWidgetLayout";
import { cn } from "@/lib/cn";

export function WidgetEditButton() {
  const { editMode, setEditMode } = useWidgetLayout();

  return (
    <button
      type="button"
      onClick={() => setEditMode(!editMode)}
      aria-pressed={editMode}
      aria-label={editMode ? "Salir de editar bloques" : "Editar bloques"}
      title={editMode ? "Salir de editar bloques" : "Editar bloques"}
      className={cn(
        "glass-pill hidden h-9 items-center gap-1.5 rounded-lg border px-2.5 text-xs font-medium transition-colors md:inline-flex",
        editMode
          ? "border-bitcoin/35 text-bitcoin"
          : "text-muted hover:text-fg",
      )}
    >
      <LayoutIcon className="h-4 w-4" />
      <span className="hidden sm:inline">
        {editMode ? "Listo" : "Editar Bloques"}
      </span>
    </button>
  );
}

function LayoutIcon({ className }: { className?: string }) {
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
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <line x1="3" y1="9" x2="21" y2="9" />
      <line x1="12" y1="9" x2="12" y2="21" />
    </svg>
  );
}
