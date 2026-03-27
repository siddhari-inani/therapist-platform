"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { AlertCircle, Loader2 } from "lucide-react";

interface PatientFormData {
  email: string;
  full_name: string;
  phone: string;
  date_of_birth: string;
  insurance_provider: string;
  insurance_id: string;
  emergency_contact_name: string;
  emergency_contact_phone: string;
}

interface PatientFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function PatientForm({
  open,
  onOpenChange,
  onSuccess,
}: PatientFormProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState<PatientFormData>({
    email: "",
    full_name: "",
    phone: "",
    date_of_birth: "",
    insurance_provider: "",
    insurance_id: "",
    emergency_contact_name: "",
    emergency_contact_phone: "",
  });
  const supabase = createClient();

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await handleCreateProfileOnly();
  };

  const handleCreateProfileOnly = async () => {
    setLoading(true);
    setError(null);

    try {
      // Create patient profile directly (no auth user needed)
      const { data: profileData, error: profileError } = await supabase.rpc(
        "create_patient_profile_by_email",
        {
          patient_email: formData.email,
          patient_full_name: formData.full_name || null,
          patient_phone: formData.phone || null,
          patient_dob: formData.date_of_birth || null,
          patient_insurance_provider: formData.insurance_provider || null,
          patient_insurance_id: formData.insurance_id || null,
          patient_emergency_contact_name: formData.emergency_contact_name || null,
          patient_emergency_contact_phone: formData.emergency_contact_phone || null,
        }
      );

      if (profileError) {
        console.error("Profile creation error:", profileError);
        const errorMsg = profileError.message || "Failed to create patient profile";
        setError(errorMsg);
        toast.error("Failed to create patient", {
          description: errorMsg,
        });
        setLoading(false);
        return;
      }

      // Success!
      toast.success("Patient created successfully", {
        description: formData.full_name || formData.email,
      });
      if (onSuccess) {
        onSuccess();
      }
      handleClose();
    } catch (err: any) {
      console.error("Error creating patient:", err);
      setError(err.message || "An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setFormData({
      email: "",
      full_name: "",
      phone: "",
      date_of_birth: "",
      insurance_provider: "",
      insurance_id: "",
      emergency_contact_name: "",
      emergency_contact_phone: "",
    });
    setError(null);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add New Patient</DialogTitle>
          <DialogDescription>
            Create a new patient profile. Patients don&apos;t need authentication accounts.
          </DialogDescription>
        </DialogHeader>

        {error && (
          <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-md text-sm text-destructive flex items-start gap-2">
            <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <p className="font-medium">Error</p>
              <p className="text-xs mt-1">{error}</p>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            {/* Basic Information */}
            <div className="space-y-2">
              <Label htmlFor="email">
                Email <span className="text-destructive">*</span>
              </Label>
              <Input
                id="email"
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                placeholder="patient@example.com"
                required
                disabled={loading}
                autoComplete="email"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="full_name">Full Name</Label>
              <Input
                id="full_name"
                type="text"
                name="full_name"
                value={formData.full_name}
                onChange={handleInputChange}
                placeholder="John Doe"
                disabled={loading}
                autoComplete="name"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleInputChange}
                placeholder="+1-555-0100"
                disabled={loading}
                autoComplete="tel"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="date_of_birth">Date of Birth</Label>
              <Input
                id="date_of_birth"
                type="date"
                name="date_of_birth"
                value={formData.date_of_birth}
                onChange={handleInputChange}
                disabled={loading}
                max={new Date().toISOString().split("T")[0]}
              />
            </div>

            {/* Insurance Information */}
            <div className="space-y-2">
              <Label htmlFor="insurance_provider">Insurance Provider</Label>
              <Input
                id="insurance_provider"
                type="text"
                name="insurance_provider"
                value={formData.insurance_provider}
                onChange={handleInputChange}
                placeholder="Blue Cross Blue Shield"
                disabled={loading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="insurance_id">Insurance ID</Label>
              <Input
                id="insurance_id"
                type="text"
                name="insurance_id"
                value={formData.insurance_id}
                onChange={handleInputChange}
                placeholder="BC123456789"
                disabled={loading}
              />
            </div>

            {/* Emergency Contact */}
            <div className="space-y-2">
              <Label htmlFor="emergency_contact_name">Emergency Contact Name</Label>
              <Input
                id="emergency_contact_name"
                type="text"
                name="emergency_contact_name"
                value={formData.emergency_contact_name}
                onChange={handleInputChange}
                placeholder="Jane Doe"
                disabled={loading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="emergency_contact_phone">Emergency Contact Phone</Label>
              <Input
                id="emergency_contact_phone"
                type="tel"
                name="emergency_contact_phone"
                value={formData.emergency_contact_phone}
                onChange={handleInputChange}
                placeholder="+1-555-0101"
                disabled={loading}
                autoComplete="tel"
              />
            </div>
          </div>

          <div className="p-4 bg-primary/10 rounded-md border border-primary/20">
            <p className="text-sm text-blue-900 dark:text-blue-100 font-medium mb-2">
              💡 Patient Profiles
            </p>
            <p className="text-xs text-blue-800 dark:text-blue-200">
              Patients are managed as data records by therapists. They don&apos;t need authentication accounts.
              Just fill in the patient information and click &quot;Create Patient Profile&quot;.
            </p>
          </div>

          <DialogFooter className="gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading || !formData.email}>
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                "Create Patient Profile"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
