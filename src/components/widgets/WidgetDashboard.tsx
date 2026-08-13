"use client";

import dynamic from "next/dynamic";
import { useWidgetLayout } from "@/store/useWidgetLayout";
import { WIDGETS } from "./registry";

const EditableWidgetDashboard = dynamic(
  () =>
    import("./EditableWidgetDashboard").then(
      (m) => m.EditableWidgetDashboard,
    ),
  { ssr: false },
);

export function WidgetDashboard() {
  const { order, hidden, editMode } = useWidgetLayout();

  if (editMode) return <EditableWidgetDashboard />;

  const hiddenSet = new Set(hidden);
  const visibleIds = order.filter((id) => WIDGETS[id] && !hiddenSet.has(id));

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
      {visibleIds.map((id) => {
        const def = WIDGETS[id];
        return (
          <div
            key={id}
            className={
              def.span === "full" ? "col-span-1 lg:col-span-2" : "col-span-1"
            }
          >
            {def.render()}
          </div>
        );
      })}
    </div>
  );
}
