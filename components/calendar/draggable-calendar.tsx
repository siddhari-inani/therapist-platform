"use client";

import { useState } from "react";
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { CalendarView } from "./calendar-view";
import type { Appointment } from "@/types/database.types";
import { createClient } from "@/lib/supabase/client";

interface DraggableCalendarProps {
  appointments: Appointment[];
  onAppointmentClick?: (appointment: Appointment) => void;
  onDateClick?: (date: Date) => void;
  onAppointmentMove?: (appointmentId: string, newStartTime: Date) => void;
  onAppointmentDelete?: (appointmentId: string) => void;
}

export function DraggableCalendar({
  appointments,
  onAppointmentClick,
  onDateClick,
  onAppointmentMove,
  onAppointmentDelete,
}: DraggableCalendarProps) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const supabase = createClient();

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (!over) return;

    const appointmentId = active.id as string;
    const appointment = appointments.find((apt) => apt.id === appointmentId);

    if (!appointment) return;

    // Calculate new time based on drop location
    // In a real implementation, you'd calculate the exact time slot from the drop coordinates
    const newStartTime = new Date(over.id as string);

    // Update appointment in Supabase
    try {
      const { error } = await supabase
        .from("appointments")
        .update({
          start_time: newStartTime.toISOString(),
          end_time: new Date(
            newStartTime.getTime() +
              (new Date(appointment.end_time).getTime() -
                new Date(appointment.start_time).getTime())
          ).toISOString(),
        })
        .eq("id", appointmentId);

      if (error) {
        console.error("Error updating appointment:", error);
      } else {
        onAppointmentMove?.(appointmentId, newStartTime);
      }
    } catch (error) {
      console.error("Error:", error);
    }
  };

  const activeAppointment = activeId
    ? appointments.find((apt) => apt.id === activeId)
    : null;

  return (
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <CalendarView
        appointments={appointments}
        onAppointmentClick={onAppointmentClick}
        onDateClick={onDateClick}
        onAppointmentDelete={onAppointmentDelete}
      />
      <DragOverlay>
        {activeAppointment ? (
          <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-xl min-w-[160px]">
            <div className="text-xs font-medium text-slate-500 dark:text-slate-400 tabular-nums">
              {new Date(activeAppointment.start_time).toLocaleTimeString(
                "en-US",
                { hour: "numeric", minute: "2-digit" }
              )}
            </div>
            <div className="text-sm font-semibold mt-0.5 text-slate-900 dark:text-slate-100">
              {activeAppointment.title || "Appointment"}
            </div>
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
