"use client";

import React, { useState } from "react";
import { useDraggable } from "@dnd-kit/core";
import { Trash2, X } from "lucide-react";
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
import { Button } from "@/components/ui/button";
import type { Appointment, TreatmentType } from "@/types/database.types";

const treatmentColors: Record<TreatmentType, string> = {
  initial_evaluation:
    "bg-primary/10 border-primary/20 text-slate-900 dark:text-slate-100 hover:bg-primary/15",
  follow_up:
    "bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-100 hover:bg-emerald-100 dark:hover:bg-emerald-900/50",
  manual_therapy:
    "bg-violet-50 dark:bg-violet-950/40 border-violet-200 dark:border-violet-800 text-violet-900 dark:text-violet-100 hover:bg-violet-100 dark:hover:bg-violet-900/50",
  exercise_therapy:
    "bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-100 hover:bg-amber-100 dark:hover:bg-amber-900/50",
  electrical_stimulation:
    "bg-pink-50 dark:bg-pink-950/40 border-pink-200 dark:border-pink-800 text-pink-900 dark:text-pink-100 hover:bg-pink-100 dark:hover:bg-pink-900/50",
  other:
    "bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800",
};

interface AppointmentItemProps {
  appointment: Appointment;
  onClick?: (e?: React.MouseEvent) => void;
  onDelete?: (appointmentId: string) => void;
  compact?: boolean;
}

export function AppointmentItem({
  appointment,
  onClick,
  onDelete,
  compact = false,
}: AppointmentItemProps) {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    isDragging,
  } = useDraggable({
    id: appointment.id,
  });

  const style = transform
    ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
      }
    : undefined;

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowDeleteDialog(true);
  };

  const handleDeleteConfirm = () => {
    if (onDelete) {
      onDelete(appointment.id);
    }
    setShowDeleteDialog(false);
  };

  if (compact) {
    return (
      <>
        <div
          ref={setNodeRef}
          style={style}
          {...listeners}
          {...attributes}
          className={`text-xs px-2 py-1.5 rounded-lg border cursor-grab active:cursor-grabbing truncate relative group transition-colors ${
            treatmentColors[appointment.treatment_type]
          } ${isDragging ? "opacity-60 shadow-lg" : "shadow-sm"}`}
          onClick={onClick}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          title={appointment.title || "Appointment"}
        >
          {new Date(appointment.start_time).toLocaleTimeString("en-US", {
            hour: "numeric",
            minute: "2-digit",
          })}{" "}
          {appointment.title || "Appointment"}
          {onDelete && isHovered && (
            <button
              onClick={handleDeleteClick}
              className="absolute right-1 top-1 p-1 rounded-md bg-red-500 text-white hover:bg-red-600 shadow"
              title="Delete appointment"
            >
              <X className="h-3 w-3" />
            </button>
          )}
        </div>
        <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Appointment</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete this appointment? This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDeleteConfirm}
                className="bg-red-600 hover:bg-red-700"
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </>
    );
  }

  return (
    <>
      <div
        ref={setNodeRef}
        style={style}
        {...listeners}
        {...attributes}
        className={`p-3 rounded-xl border cursor-grab active:cursor-grabbing relative group transition-all ${
          treatmentColors[appointment.treatment_type]
        } ${isDragging ? "opacity-60 shadow-lg" : "shadow-sm hover:shadow"}`}
        onClick={onClick}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {onDelete && isHovered && (
          <button
            onClick={handleDeleteClick}
            className="absolute right-2 top-2 p-1.5 rounded-lg bg-red-500 text-white hover:bg-red-600 z-10 shadow"
            title="Delete appointment"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        )}
        <div className="text-xs font-medium text-slate-600 dark:text-slate-400 tabular-nums">
          {new Date(appointment.start_time).toLocaleTimeString("en-US", {
            hour: "numeric",
            minute: "2-digit",
          })}
          {" – "}
          {new Date(appointment.end_time).toLocaleTimeString("en-US", {
            hour: "numeric",
            minute: "2-digit",
          })}
        </div>
        <div className="text-sm font-semibold mt-1 text-slate-900 dark:text-slate-100">
          {appointment.title || "Appointment"}
        </div>
        {appointment.notes && (
          <div className="text-xs text-slate-500 dark:text-slate-400 mt-1 truncate">
            {appointment.notes}
          </div>
        )}
      </div>
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Appointment</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this appointment? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
