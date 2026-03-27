"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Save } from "lucide-react";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { createClient } from "@/lib/supabase/client";
import type { Profile, ProfileUpdate } from "@/types/database.types";

export default function EditPatientPage() {
  const params = useParams();
  const router = useRouter();
  const patientId = params.id as string;

  const [patient, setPatient] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState<ProfileUpdate>({});
  const supabase = createClient();

  useEffect(() => {
    if (patientId) {
      fetchPatient();
    }
  }, [patientId]);

  const fetchPatient = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", patientId)
        .eq("role", "patient")
        .single();

      if (error) {
        console.error("Error fetching patient:", error);
        setLoading(false);
        return;
      }

      const profile = data as Profile;
      setPatient(profile);
      setFormData({
        full_name: profile.full_name || "",
        phone: profile.phone || "",
        date_of_birth: profile.date_of_birth || "",
        insurance_provider: profile.insurance_provider || "",
        insurance_id: profile.insurance_id || "",
        emergency_contact_name: profile.emergency_contact_name || "",
        emergency_contact_phone: profile.emergency_contact_phone || "",
      });
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        alert("You must be logged in");
        setSaving(false);
        return;
      }

      // Clean up empty strings to null
      const updateData: Record<string, string | null> = {};
      Object.entries(formData).forEach(([key, value]) => {
        updateData[key] = value !== "" && value !== null ? String(value) : null;
      });

      const { error } = await supabase
        .from("profiles")
        // @ts-expect-error Supabase Update type inference issue with dynamic keys
        .update(updateData)
        .eq("id", patientId);

      if (error) {
        console.error("Error updating patient:", error);
        alert("Error updating patient: " + error.message);
      } else {
        router.push(`/dashboard/patients/${patientId}`);
      }
    } catch (error) {
      console.error("Error:", error);
      alert("Error updating patient");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="p-8">
        <div className="flex items-center justify-center h-64">
          <div className="text-muted-foreground">Loading patient...</div>
        </div>
      </div>
    );
  }

  if (!patient) {
    return (
      <div className="p-8">
        <Card>
          <CardContent className="py-12 text-center">
            <h3 className="text-lg font-semibold mb-2">Patient not found</h3>
            <Link href="/dashboard/patients">
              <Button variant="outline">Back to Patients</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8">
      <div className="mb-6 space-y-2">
        <Breadcrumb
          items={[
            { label: "Patients", href: "/dashboard/patients" },
            {
              label: patient?.full_name || patient?.email || "Patient",
              href: `/dashboard/patients/${patientId}`,
            },
            { label: "Edit" },
          ]}
        />
        <h1 className="text-4xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 dark:from-slate-100 dark:to-slate-300 bg-clip-text text-transparent">
          Edit Patient
        </h1>
        <p className="text-muted-foreground text-lg mt-1">Update patient information</p>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
              <CardDescription>Patient contact and personal details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Full Name</label>
                <Input
                  value={formData.full_name || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, full_name: e.target.value })
                  }
                  placeholder="Patient full name"
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Email</label>
                <Input
                  value={patient.email}
                  disabled
                  className="bg-muted"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Email cannot be changed (managed by authentication)
                </p>
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Phone</label>
                <Input
                  type="tel"
                  value={formData.phone || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, phone: e.target.value })
                  }
                  placeholder="+1-555-0100"
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Date of Birth</label>
                <Input
                  type="date"
                  value={
                    formData.date_of_birth
                      ? new Date(formData.date_of_birth).toISOString().split("T")[0]
                      : ""
                  }
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      date_of_birth: e.target.value || null,
                    })
                  }
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Insurance & Emergency Contact</CardTitle>
              <CardDescription>Insurance and emergency contact information</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">
                  Insurance Provider
                </label>
                <Input
                  value={formData.insurance_provider || ""}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      insurance_provider: e.target.value,
                    })
                  }
                  placeholder="Blue Cross Blue Shield"
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Insurance ID</label>
                <Input
                  value={formData.insurance_id || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, insurance_id: e.target.value })
                  }
                  placeholder="BC123456789"
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">
                  Emergency Contact Name
                </label>
                <Input
                  value={formData.emergency_contact_name || ""}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      emergency_contact_name: e.target.value,
                    })
                  }
                  placeholder="Jane Doe"
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">
                  Emergency Contact Phone
                </label>
                <Input
                  type="tel"
                  value={formData.emergency_contact_phone || ""}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      emergency_contact_phone: e.target.value,
                    })
                  }
                  placeholder="+1-555-0101"
                />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="flex gap-4 mt-6">
          <Button type="submit" disabled={saving}>
            <Save className="h-4 w-4 mr-2" />
            {saving ? "Saving..." : "Save Changes"}
          </Button>
          <Link href={`/dashboard/patients/${patientId}`}>
            <Button type="button" variant="outline">
              Cancel
            </Button>
          </Link>
        </div>
      </form>
    </div>
  );
}
