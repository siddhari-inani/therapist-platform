"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { DraggableCalendar } from "@/components/calendar/draggable-calendar";
import { AppointmentForm } from "@/components/appointments/appointment-form";
import { createClient } from "@/lib/supabase/client";
import { useGamification } from "@/contexts/gamification-context";
import { useDemoMode } from "@/contexts/demo-context";
import { DEMO_APPOINTMENTS } from "@/lib/demo-data";
import { toast } from "sonner";
import type { Appointment } from "@/types/database.types";

export default function CalendarPage() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();
  const supabase = createClient();
  const { award } = useGamification();
  const { isDemo } = useDemoMode();

  useEffect(() => {
    fetchAppointments();
  }, [supabase, isDemo]);

  const handleAppointmentClick = (appointment: Appointment) => {
    // Navigate to charting page for this appointment
    window.location.href = `/dashboard/charting?appointment=${appointment.id}`;
  };

  const handleAppointmentDelete = async (appointmentId: string) => {
    if (isDemo) {
      toast.info("Demo mode", { description: "Changes are not saved in demo mode." });
      return;
    }
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        toast.error("Authentication required", {
          description: "You must be logged in to delete appointments",
        });
        return;
      }

      const { error } = await supabase
        .from("appointments")
        .delete()
        .eq("id", appointmentId)
        .eq("therapist_id", user.id);

      if (error) {
        console.error("Error deleting appointment:", error);
        toast.error("Failed to delete appointment", {
          description: error.message,
        });
      } else {
        toast.success("Appointment deleted successfully");
        // Refresh appointments list
        fetchAppointments();
      }
    } catch (error) {
      console.error("Error:", error);
      alert("Error deleting appointment");
    }
  };

  const handleDateClick = (date: Date) => {
    setSelectedDate(date);
    setIsFormOpen(true);
  };

  const handleFormSuccess = () => {
    award?.("appointment_created");
    fetchAppointments();
  };

  const fetchAppointments = async () => {
    try {
      if (isDemo) {
        setAppointments([...DEMO_APPOINTMENTS]);
        setLoading(false);
        return;
      }

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from("appointments")
        .select("*")
        .eq("therapist_id", user.id)
        .order("start_time", { ascending: true });

      if (error) {
        console.error("Error fetching appointments:", error);
      } else {
        setAppointments(data || []);
      }
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-full min-h-[400px] items-center justify-center p-8">
        <div className="text-slate-500 dark:text-slate-400 text-sm">Loading calendar…</div>
      </div>
    );
  }

  return (
    <div className="h-full p-3 sm:p-6 md:p-8 lg:p-10">
      <div className="mb-4 sm:mb-6 space-y-1.5 sm:space-y-2">
        <Breadcrumb items={[{ label: "Calendar" }]} />
        <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">
          Calendar
        </h1>
        <p className="text-slate-600 dark:text-slate-400 text-sm md:text-base">
          Manage your appointments and schedule
        </p>
      </div>
      <div className="min-h-[480px] md:h-[calc(100vh-14rem)]">
        <DraggableCalendar
          appointments={appointments}
          onAppointmentClick={handleAppointmentClick}
          onDateClick={handleDateClick}
          onAppointmentDelete={handleAppointmentDelete}
          onAppointmentMove={(appointmentId, newStartTime) => {
            // Update local state optimistically
            setAppointments((prev) =>
              prev.map((apt) => {
                if (apt.id === appointmentId) {
                  const duration =
                    new Date(apt.end_time).getTime() -
                    new Date(apt.start_time).getTime();
                  return {
                    ...apt,
                    start_time: newStartTime.toISOString(),
                    end_time: new Date(
                      newStartTime.getTime() + duration
                    ).toISOString(),
                  };
                }
                return apt;
              })
            );
          }}
        />
      </div>

      <AppointmentForm
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        initialDate={selectedDate}
        onSuccess={handleFormSuccess}
        isDemo={isDemo}
      />
    </div>
  );
}
