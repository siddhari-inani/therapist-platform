"use client";

import React, { useState } from "react";
import { useDroppable } from "@dnd-kit/core";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AppointmentItem } from "./appointment-item";
import type { Appointment } from "@/types/database.types";

type ViewMode = "day" | "week" | "month";

function DayDropZone({
  date,
  children,
}: {
  date: Date;
  children: React.ReactNode;
}) {
  const { setNodeRef, isOver } = useDroppable({
    id: date.toISOString(),
  });

  return (
    <div
      ref={setNodeRef}
      className={`min-h-[320px] transition-colors rounded-b-lg ${
        isOver ? "bg-primary/5 dark:bg-primary/10 ring-2 ring-primary/30 ring-inset" : ""
      }`}
    >
      {children}
    </div>
  );
}

interface CalendarViewProps {
  appointments: Appointment[];
  onAppointmentClick?: (appointment: Appointment) => void;
  onDateClick?: (date: Date) => void;
  onAppointmentDelete?: (appointmentId: string) => void;
}

export function CalendarView({
  appointments,
  onAppointmentClick,
  onDateClick,
  onAppointmentDelete,
}: CalendarViewProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<ViewMode>("week");

  const navigateDate = (direction: "prev" | "next") => {
    const newDate = new Date(currentDate);
    if (viewMode === "day") {
      newDate.setDate(newDate.getDate() + (direction === "next" ? 1 : -1));
    } else if (viewMode === "week") {
      newDate.setDate(newDate.getDate() + (direction === "next" ? 7 : -7));
    } else {
      newDate.setMonth(newDate.getMonth() + (direction === "next" ? 1 : -1));
    }
    setCurrentDate(newDate);
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  const getDaysInView = (): Date[] => {
    if (viewMode === "day") {
      return [new Date(currentDate)];
    } else if (viewMode === "week") {
      const start = new Date(currentDate);
      const day = start.getDay();
      const diff = start.getDate() - day;
      start.setDate(diff);
      return Array.from({ length: 7 }, (_, i) => {
        const date = new Date(start);
        date.setDate(start.getDate() + i);
        return date;
      });
    } else {
      const year = currentDate.getFullYear();
      const month = currentDate.getMonth();
      const lastDay = new Date(year, month + 1, 0);
      const days: Date[] = [];
      for (let i = 1; i <= lastDay.getDate(); i++) {
        days.push(new Date(year, month, i));
      }
      return days;
    }
  };

  const getAppointmentsForDate = (date: Date): Appointment[] => {
    return appointments.filter((apt) => {
      const aptDate = new Date(apt.start_time);
      return (
        aptDate.getDate() === date.getDate() &&
        aptDate.getMonth() === date.getMonth() &&
        aptDate.getFullYear() === date.getFullYear()
      );
    });
  };

  const formatDateHeader = (): string => {
    if (viewMode === "day") {
      return currentDate.toLocaleDateString("en-US", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    } else if (viewMode === "week") {
      const start = new Date(currentDate);
      const day = start.getDay();
      const diff = start.getDate() - day;
      start.setDate(diff);
      const end = new Date(start);
      end.setDate(end.getDate() + 6);
      return `${start.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      })} - ${end.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      })}`;
    } else {
      return currentDate.toLocaleDateString("en-US", {
        month: "long",
        year: "numeric",
      });
    }
  };

  const days = getDaysInView();

  return (
    <div className="flex h-full flex-col">
      <Card className="border border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-slate-900/80 shadow-sm overflow-hidden rounded-xl">
        <CardHeader className="pb-4 border-b border-slate-200/80 dark:border-slate-800/80">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <CardTitle className="text-lg font-semibold text-slate-900 dark:text-slate-100">
              {formatDateHeader()}
            </CardTitle>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={goToToday} className="rounded-lg">
                Today
              </Button>
              <div className="flex items-center rounded-lg border border-slate-200 dark:border-slate-700 p-0.5">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 rounded-md"
                  onClick={() => navigateDate("prev")}
                  aria-label="Previous"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 rounded-md"
                  onClick={() => navigateDate("next")}
                  aria-label="Next"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
          <div className="inline-flex rounded-lg bg-slate-100 dark:bg-slate-800/80 p-1 mt-2">
            <Button
              variant={viewMode === "day" ? "default" : "ghost"}
              size="sm"
              className={`rounded-md text-sm ${viewMode === "day" ? "shadow-sm" : "text-slate-600 dark:text-slate-400"}`}
              onClick={() => setViewMode("day")}
            >
              Day
            </Button>
            <Button
              variant={viewMode === "week" ? "default" : "ghost"}
              size="sm"
              className={`rounded-md text-sm ${viewMode === "week" ? "shadow-sm" : "text-slate-600 dark:text-slate-400"}`}
              onClick={() => setViewMode("week")}
            >
              Week
            </Button>
            <Button
              variant={viewMode === "month" ? "default" : "ghost"}
              size="sm"
              className={`rounded-md text-sm ${viewMode === "month" ? "shadow-sm" : "text-slate-600 dark:text-slate-400"}`}
              onClick={() => setViewMode("month")}
            >
              Month
            </Button>
          </div>
        </CardHeader>
        <CardContent className="pt-4">
          {viewMode === "month" ? (
            <div className="grid grid-cols-7 gap-px rounded-lg overflow-hidden bg-slate-200 dark:bg-slate-700">
              {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(
                (day) => (
                  <div
                    key={day}
                    className="p-2 text-center text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider bg-slate-50 dark:bg-slate-800/80"
                  >
                    {day}
                  </div>
                )
              )}
              {days.map((date, idx) => {
                const dayAppointments = getAppointmentsForDate(date);
                const isToday =
                  date.toDateString() === new Date().toDateString();
                return (
                  <div
                    key={idx}
                    className={`min-h-[100px] p-2 bg-white dark:bg-slate-900/80 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors ${
                      isToday ? "ring-inset ring-2 ring-primary/40 bg-primary/5 dark:bg-primary/10" : ""
                    }`}
                    onClick={() => onDateClick?.(date)}
                  >
                    <div
                      className={`text-sm font-medium mb-2 ${
                        isToday
                          ? "text-primary font-semibold"
                          : "text-slate-700 dark:text-slate-300"
                      }`}
                    >
                      {date.getDate()}
                    </div>
                    <div className="space-y-1.5">
                      {dayAppointments.slice(0, 3).map((apt) => (
                        <AppointmentItem
                          key={apt.id}
                          appointment={apt}
                          compact
                          onClick={(e) => {
                            e?.stopPropagation();
                            onAppointmentClick?.(apt);
                          }}
                          onDelete={(id) => {
                            onAppointmentDelete?.(id);
                          }}
                        />
                      ))}
                      {dayAppointments.length > 3 && (
                        <div className="text-xs text-slate-500 dark:text-slate-400 pl-1">
                          +{dayAppointments.length - 3} more
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="grid grid-cols-7 gap-0 border border-slate-200/80 dark:border-slate-800/80 rounded-lg overflow-hidden">
              {days.map((date, idx) => {
                const dayAppointments = getAppointmentsForDate(date);
                const isToday =
                  date.toDateString() === new Date().toDateString();
                return (
                  <div
                    key={idx}
                    className={`flex flex-col border-r border-slate-200/80 dark:border-slate-800/80 last:border-r-0 ${
                      isToday ? "bg-primary/5 dark:bg-primary/10" : "bg-slate-50/50 dark:bg-slate-900/30"
                    }`}
                  >
                    <div
                      className={`p-3 border-b border-slate-200/80 dark:border-slate-800/80 shrink-0 ${
                        isToday ? "border-primary/20" : ""
                      }`}
                    >
                      <div
                        className={`text-xs font-medium uppercase tracking-wider ${
                          isToday ? "text-primary" : "text-slate-500 dark:text-slate-400"
                        }`}
                      >
                        {date.toLocaleDateString("en-US", { weekday: "short" })}
                      </div>
                      <div
                        className={`text-xl font-bold mt-0.5 ${
                          isToday ? "text-primary" : "text-slate-900 dark:text-slate-100"
                        }`}
                      >
                        {date.getDate()}
                      </div>
                    </div>
                    <DayDropZone date={date}>
                      <div className="p-2 space-y-2 flex-1">
                        {dayAppointments.map((apt) => (
                          <AppointmentItem
                            key={apt.id}
                            appointment={apt}
                            onClick={() => onAppointmentClick?.(apt)}
                            onDelete={(id) => {
                              onAppointmentDelete?.(id);
                            }}
                          />
                        ))}
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full mt-2 rounded-lg border-dashed border-slate-300 dark:border-slate-600 text-slate-500 dark:text-slate-400 hover:border-primary/50 hover:text-primary hover:bg-primary/5"
                          onClick={() => onDateClick?.(date)}
                        >
                          <Plus className="h-4 w-4 mr-1.5 shrink-0" />
                          Add
                        </Button>
                      </div>
                    </DayDropZone>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
