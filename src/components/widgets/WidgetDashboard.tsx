"use client";

import {
  DndContext,
  PointerSensor,
  KeyboardSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  rectSortingStrategy,
  arrayMove,
} from "@dnd-kit/sortable";
import { useWidgetLayout } from "@/store/useWidgetLayout";
import { WIDGETS } from "./registry";
import { SortableWidget } from "./SortableWidget";

export function WidgetDashboard() {
  const { order, hidden, editMode, setOrder, toggleHidden, setEditMode, reset } =
    useWidgetLayout();

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const hiddenSet = new Set(hidden);
  const visibleIds = order.filter((id) => WIDGETS[id] && !hiddenSet.has(id));
  const hiddenIds = order.filter((id) => WIDGETS[id] && hiddenSet.has(id));

  const onDragEnd = (e: DragEndEvent) => {
    const { active, over } = e;
    if (!over || active.id === over.id) return;
    const from = order.indexOf(String(active.id));
    const to = order.indexOf(String(over.id));
    if (from === -1 || to === -1) return;
    setOrder(arrayMove(order, from, to));
  };

  return (
    <div className="flex flex-col gap-6">
      {editMode && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-primary/40 bg-primary/5 px-4 py-2.5">
          <span className="text-sm">
            <span className="font-semibold">Modo edición</span>
            <span className="text-muted">
              {" "}
              — arrastrá los widgets para reordenar u ocultalos.
            </span>
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={reset}
              className="rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-muted transition-colors hover:text-fg"
            >
              Restablecer
            </button>
            <button
              onClick={() => setEditMode(false)}
              className="rounded-lg bg-bitcoin px-3 py-1.5 text-xs font-semibold text-white"
            >
              Listo
            </button>
          </div>
        </div>
      )}

      {editMode && hiddenIds.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 rounded-xl border border-border bg-surface-2/40 px-3 py-2.5">
          <span className="text-xs font-medium text-muted">Ocultos:</span>
          {hiddenIds.map((id) => (
            <button
              key={id}
              onClick={() => toggleHidden(id)}
              className="inline-flex items-center gap-1 rounded-full border border-border bg-surface px-2.5 py-1 text-xs font-medium transition-colors hover:text-primary"
            >
              + {WIDGETS[id].title}
            </button>
          ))}
        </div>
      )}

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={onDragEnd}
      >
        <SortableContext items={visibleIds} strategy={rectSortingStrategy}>
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            {visibleIds.map((id) => (
              <SortableWidget
                key={id}
                def={WIDGETS[id]}
                editMode={editMode}
                onHide={() => toggleHidden(id)}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>
    </div>
  );
}
