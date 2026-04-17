"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Search, Plus, Calendar, FileText, Phone, Mail, User } from "lucide-react";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Search as SearchInput } from "@/components/ui/search";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { PatientForm } from "@/components/patients/patient-form";
import { createClient } from "@/lib/supabase/client";
import { useGamification } from "@/contexts/gamification-context";
import { useDemoMode } from "@/contexts/demo-context";
import { DEMO_PATIENTS, DEMO_APPOINTMENTS } from "@/lib/demo-data";
import type { Profile, Appointment, MedicalRecord } from "@/types/database.types";

export default function PatientsPage() {
  const [patients, setPatients] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [isPatientFormOpen, setIsPatientFormOpen] = useState(false);
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    newThisMonth: 0,
  });
  const supabase = createClient();
  const { award } = useGamification();
  const { isDemo } = useDemoMode();

  useEffect(() => {
    fetchPatients();
  }, [isDemo]);

  const fetchPatients = async () => {
    try {
      if (isDemo) {
        const list = [...DEMO_PATIENTS].sort((a, b) =>
          (a.full_name ?? "").localeCompare(b.full_name ?? "")
        );
        setPatients(list);
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const newThisMonth = list.filter(
          (p) => new Date(p.created_at) >= startOfMonth
        ).length;
        setStats({ total: list.length, active: list.length, newThisMonth });
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

      // Fetch all patients (therapists can see patients they have appointments with)
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("role", "patient")
        .order("full_name", { ascending: true });

      if (error) {
        console.error("Error fetching patients:", error);
        toast.error("Failed to load patients", {
          description: error.message,
        });
      } else {
        const list = (data ?? []) as Profile[];
        setPatients(list);

        // Calculate stats
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const newThisMonth = list.filter(
          (p) => new Date(p.created_at) >= startOfMonth
        ).length;

        setStats({
          total: list.length,
          active: list.length,
          newThisMonth,
        });
      }
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredPatients = patients.filter((patient) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      patient.full_name?.toLowerCase().includes(query) ||
      patient.email.toLowerCase().includes(query) ||
      patient.phone?.toLowerCase().includes(query)
    );
  });

  if (loading) {
    return (
      <div className="p-6 md:p-8">
        <div className="mb-6 space-y-2">
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-6 w-96" />
        </div>
        <div className="grid gap-4 md:grid-cols-3 mb-6">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardHeader className="pb-2">
                <Skeleton className="h-4 w-24 mb-2" />
                <Skeleton className="h-8 w-16" />
              </CardHeader>
            </Card>
          ))}
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-32 mb-2" />
                <Skeleton className="h-4 w-48" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-4 w-full mb-2" />
                <Skeleton className="h-4 w-3/4" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8">
      <div className="mb-6 space-y-2">
        <Breadcrumb items={[{ label: "Patients" }]} />
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 dark:from-slate-100 dark:to-slate-300 bg-clip-text text-transparent">
              Patients
            </h1>
            <p className="text-muted-foreground text-lg mt-1">Manage your patient roster</p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => setIsPatientFormOpen(true)}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Patient
            </Button>
            <Link href="/dashboard/calendar">
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                New Appointment
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Patient Form Dialog */}
      <PatientForm
        open={isPatientFormOpen}
        onOpenChange={setIsPatientFormOpen}
        onSuccess={() => {
          award?.("patient_added");
          fetchPatients();
          toast.success("Patient added successfully");
        }}
      />

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-3 mb-6">
        <Card className="border-2 border-slate-200 dark:border-slate-800 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 bg-gradient-to-br from-white to-lime-50/20 dark:from-slate-900 dark:to-slate-950">
          <CardHeader className="pb-2">
            <CardDescription className="font-semibold text-slate-600 dark:text-slate-400">Total Patients</CardDescription>
            <CardTitle className="text-3xl font-bold text-slate-900 dark:text-slate-100">{stats.total}</CardTitle>
          </CardHeader>
        </Card>
        <Card className="border-2 border-slate-200 dark:border-slate-800 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 bg-gradient-to-br from-white to-green-50/30 dark:from-slate-900 dark:to-slate-950">
          <CardHeader className="pb-2">
            <CardDescription className="font-semibold text-slate-600 dark:text-slate-400">Active Patients</CardDescription>
            <CardTitle className="text-3xl font-bold text-slate-900 dark:text-slate-100">{stats.active}</CardTitle>
          </CardHeader>
        </Card>
        <Card className="border-2 border-slate-200 dark:border-slate-800 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 bg-gradient-to-br from-white to-purple-50/30 dark:from-slate-900 dark:to-slate-950">
          <CardHeader className="pb-2">
            <CardDescription className="font-semibold text-slate-600 dark:text-slate-400">New This Month</CardDescription>
            <CardTitle className="text-3xl font-bold text-slate-900 dark:text-slate-100">{stats.newThisMonth}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Search */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <SearchInput
            placeholder="Search by name, email, or phone..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onClear={() => setSearchQuery("")}
          />
        </CardContent>
      </Card>

      {/* Patient List */}
      {filteredPatients.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <User className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">
              {searchQuery ? "No patients found" : "No patients yet"}
            </h3>
            <p className="text-muted-foreground mb-4">
              {searchQuery
                ? "Try a different search term"
                : "Create a patient account to get started"}
            </p>
            {!searchQuery && (
              <div className="text-sm text-muted-foreground">
                <p>Click &quot;Add Patient&quot; above to create a new patient profile.</p>
              </div>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredPatients.map((patient) => (
            <PatientCard key={patient.id} patient={patient} isDemo={isDemo} />
          ))}
        </div>
      )}
    </div>
  );
}

function PatientCard({ patient, isDemo }: { patient: Profile; isDemo?: boolean }) {
  const [appointmentCount, setAppointmentCount] = useState<number | null>(null);
  const supabase = createClient();

  useEffect(() => {
    if (isDemo) {
      const count = DEMO_APPOINTMENTS.filter((a) => a.patient_id === patient.id).length;
      setAppointmentCount(count);
      return;
    }
    async function fetchStats() {
      try {
        const { count } = await supabase
          .from("appointments")
          .select("*", { count: "exact", head: true })
          .eq("patient_id", patient.id);

        setAppointmentCount(count);
      } catch (error) {
        console.error("Error fetching appointment count:", error);
      }
    }
    fetchStats();
  }, [patient.id, supabase, isDemo]);

  return (
    <Card className="group hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 border-2 border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
      <CardHeader className="pb-4">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-lime-600 flex items-center justify-center text-white font-bold text-lg shadow-lg ring-2 ring-primary/20 group-hover:scale-110 transition-transform">
                {patient.avatar_url ? (
                  <img
                    src={patient.avatar_url}
                    alt={patient.full_name || "Patient avatar"}
                    className="h-12 w-12 rounded-full object-cover"
                  />
                ) : (
                  (patient.full_name || patient.email || "P")[0].toUpperCase()
                )}
              </div>
              <div className="flex-1 min-w-0">
                <CardTitle className="text-lg font-bold text-slate-900 dark:text-slate-100 group-hover:text-primary transition-colors">
                  {patient.full_name || patient.email}
                </CardTitle>
                <CardDescription className="mt-0.5">
                  {patient.full_name && patient.email !== patient.full_name
                    ? patient.email
                    : "Patient"}
                </CardDescription>
              </div>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2.5 text-sm">
          {patient.phone && (
            <div className="flex items-center gap-2.5 text-muted-foreground p-2 rounded-lg bg-slate-50 dark:bg-slate-800/50">
              <Phone className="h-4 w-4 text-primary" />
              <span className="font-medium">{patient.phone}</span>
            </div>
          )}
          <div className="flex items-center gap-2.5 text-muted-foreground p-2 rounded-lg bg-slate-50 dark:bg-slate-800/50">
            <Mail className="h-4 w-4 text-primary" />
            <span className="truncate font-medium">{patient.email}</span>
          </div>
          {patient.date_of_birth && (
            <div className="text-muted-foreground p-2 rounded-lg bg-slate-50 dark:bg-slate-800/50">
              <span className="font-semibold">DOB:</span> {new Date(patient.date_of_birth).toLocaleDateString()}
            </div>
          )}
          {patient.insurance_provider && (
            <div className="text-muted-foreground p-2 rounded-lg bg-slate-50 dark:bg-slate-800/50">
              <span className="font-semibold">Insurance:</span> {patient.insurance_provider}
            </div>
          )}
        </div>

        <div className="flex items-center gap-4 pt-3 border-t-2 border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-primary/10 border border-primary/20">
            <Calendar className="h-4 w-4 text-primary" />
            <span className="text-sm font-semibold text-blue-700 dark:text-blue-300">
              {appointmentCount ?? "..."}
            </span>
            <span className="text-xs text-muted-foreground ml-1">appointments</span>
          </div>
        </div>

        <div className="flex gap-2 pt-2">
          <Link href={`/dashboard/patients/${patient.id}`} className="flex-1">
            <Button variant="outline" size="sm" className="w-full border-2 hover:bg-primary/10 hover:border-primary font-semibold transition-all shadow-sm hover:shadow-md">
              View Details
            </Button>
          </Link>
          <Link href={`/dashboard/calendar?patient=${patient.id}`}>
            <Button variant="outline" size="sm" className="border-2 hover:bg-primary/10 hover:border-primary transition-all shadow-sm hover:shadow-md">
              <Calendar className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
