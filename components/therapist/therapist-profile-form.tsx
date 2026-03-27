"use client";

import React, { useState, useEffect } from "react";
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
import { Textarea } from "@/components/ui/textarea";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { AlertCircle, Loader2, MapPin, Navigation } from "lucide-react";
import type { Profile } from "@/types/database.types";

interface TherapistProfileFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  profile: Profile | null;
  onSuccess?: () => void;
}

export function TherapistProfileForm({
  open,
  onOpenChange,
  profile,
  onSuccess,
}: TherapistProfileFormProps) {
  const [loading, setLoading] = useState(false);
  const [geocoding, setGeocoding] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    full_name: "",
    phone: "",
    license_number: "",
    specialties: [] as string[],
    bio: "",
    address_line1: "",
    address_line2: "",
    city: "",
    state: "",
    zip_code: "",
    country: "US",
    latitude: null as number | null,
    longitude: null as number | null,
  });
  const [specialtyInput, setSpecialtyInput] = useState("");
  const supabase = createClient();

  useEffect(() => {
    if (profile && open) {
      setFormData({
        full_name: profile.full_name || "",
        phone: profile.phone || "",
        license_number: profile.license_number || "",
        specialties: profile.specialties || [],
        bio: profile.bio || "",
        address_line1: (profile as any).address_line1 || "",
        address_line2: (profile as any).address_line2 || "",
        city: (profile as any).city || "",
        state: (profile as any).state || "",
        zip_code: (profile as any).zip_code || "",
        country: (profile as any).country || "US",
        latitude: (profile as any).latitude || null,
        longitude: (profile as any).longitude || null,
      });
      setError(null);
    }
  }, [profile, open]);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setError(null);
  };

  const handleAddSpecialty = () => {
    if (specialtyInput.trim() && !formData.specialties.includes(specialtyInput.trim())) {
      setFormData((prev) => ({
        ...prev,
        specialties: [...prev.specialties, specialtyInput.trim()],
      }));
      setSpecialtyInput("");
    }
  };

  const handleRemoveSpecialty = (specialty: string) => {
    setFormData((prev) => ({
      ...prev,
      specialties: prev.specialties.filter((s) => s !== specialty),
    }));
  };

  const geocodeAddress = async () => {
    if (!formData.address_line1 || !formData.city || !formData.state) {
      toast.error("Please fill in address, city, and state");
      return;
    }

    setGeocoding(true);
    try {
      const address = [
        formData.address_line1,
        formData.address_line2,
        formData.city,
        formData.state,
        formData.zip_code,
        formData.country,
      ]
        .filter(Boolean)
        .join(", ");

      // Use Google Maps Geocoding API
      const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
      if (!apiKey) {
        toast.warning("Google Maps API key not configured. Location will not be geocoded.");
        setGeocoding(false);
        return;
      }

      const response = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(
          address
        )}&key=${apiKey}`
      );

      const data = await response.json();

      if (data.status === "OK" && data.results.length > 0) {
        const location = data.results[0].geometry.location;
        setFormData((prev) => ({
          ...prev,
          latitude: location.lat,
          longitude: location.lng,
        }));
        toast.success("Location geocoded successfully");
      } else {
        toast.error("Could not geocode address. Please check the address and try again.");
      }
    } catch (err: any) {
      console.error("Geocoding error:", err);
      toast.error("Failed to geocode address", {
        description: err.message,
      });
    } finally {
      setGeocoding(false);
    }
  };

  const useCurrentLocation = () => {
    if (!navigator.geolocation) {
      toast.error("Geolocation is not supported by your browser");
      return;
    }

    setGeocoding(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setFormData((prev) => ({
          ...prev,
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        }));
        toast.success("Current location captured");
        setGeocoding(false);
      },
      (error) => {
        console.error("Geolocation error:", error);
        toast.error("Failed to get current location", {
          description: error.message,
        });
        setGeocoding(false);
      }
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        throw new Error("You must be logged in to update your profile");
      }

      const { error: updateError } = await supabase
        .from("profiles")
        .update({
          full_name: formData.full_name || null,
          phone: formData.phone || null,
          license_number: formData.license_number || null,
          specialties: formData.specialties,
          bio: formData.bio || null,
          address_line1: formData.address_line1 || null,
          address_line2: formData.address_line2 || null,
          city: formData.city || null,
          state: formData.state || null,
          zip_code: formData.zip_code || null,
          country: formData.country || "US",
          latitude: formData.latitude,
          longitude: formData.longitude,
          updated_at: new Date().toISOString(),
        })
        .eq("id", user.id);

      if (updateError) {
        throw updateError;
      }

      toast.success("Profile updated successfully");
      if (onSuccess) {
        onSuccess();
      }
      onOpenChange(false);
    } catch (err: any) {
      console.error("Error updating profile:", err);
      const errorMsg = err.message || "Failed to update profile";
      setError(errorMsg);
      toast.error("Failed to update profile", {
        description: errorMsg,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (profile) {
      setFormData({
        full_name: profile.full_name || "",
        phone: profile.phone || "",
        license_number: profile.license_number || "",
        specialties: profile.specialties || [],
        bio: profile.bio || "",
        address_line1: (profile as any).address_line1 || "",
        address_line2: (profile as any).address_line2 || "",
        city: (profile as any).city || "",
        state: (profile as any).state || "",
        zip_code: (profile as any).zip_code || "",
        country: (profile as any).country || "US",
        latitude: (profile as any).latitude || null,
        longitude: (profile as any).longitude || null,
      });
    }
    setError(null);
    setSpecialtyInput("");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Profile</DialogTitle>
          <DialogDescription>
            Update your personal information and practice location
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

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Basic Information</h3>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="full_name">Full Name</Label>
                <Input
                  id="full_name"
                  name="full_name"
                  value={formData.full_name}
                  onChange={handleInputChange}
                  placeholder="Dr. Jane Smith"
                  disabled={loading}
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
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="license_number">License Number</Label>
                <Input
                  id="license_number"
                  name="license_number"
                  value={formData.license_number}
                  onChange={handleInputChange}
                  placeholder="PT-12345"
                  disabled={loading}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="bio">Bio</Label>
              <Textarea
                id="bio"
                name="bio"
                value={formData.bio}
                onChange={handleInputChange}
                placeholder="Tell patients about your experience and specialties..."
                rows={4}
                disabled={loading}
              />
            </div>

            <div className="space-y-2">
              <Label>Specialties</Label>
              <div className="flex gap-2">
                <Input
                  value={specialtyInput}
                  onChange={(e) => setSpecialtyInput(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleAddSpecialty();
                    }
                  }}
                  placeholder="Add specialty (e.g., Orthopedic, Sports Medicine)"
                  disabled={loading}
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleAddSpecialty}
                  disabled={loading || !specialtyInput.trim()}
                >
                  Add
                </Button>
              </div>
              {formData.specialties.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {formData.specialties.map((specialty) => (
                    <span
                      key={specialty}
                      className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-blue-100 dark:bg-blue-900/20 text-blue-800 dark:text-blue-200 text-sm"
                    >
                      {specialty}
                      <button
                        type="button"
                        onClick={() => handleRemoveSpecialty(specialty)}
                        className="hover:text-primary"
                        disabled={loading}
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Location Information */}
          <div className="space-y-4 pt-4 border-t">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Practice Location</h3>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={useCurrentLocation}
                  disabled={loading || geocoding}
                >
                  <Navigation className="h-4 w-4 mr-2" />
                  Use Current Location
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={geocodeAddress}
                  disabled={loading || geocoding}
                >
                  {geocoding ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <MapPin className="h-4 w-4 mr-2" />
                  )}
                  Geocode Address
                </Button>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="address_line1">Address Line 1</Label>
                <Input
                  id="address_line1"
                  name="address_line1"
                  value={formData.address_line1}
                  onChange={handleInputChange}
                  placeholder="123 Main Street"
                  disabled={loading}
                />
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="address_line2">Address Line 2 (Optional)</Label>
                <Input
                  id="address_line2"
                  name="address_line2"
                  value={formData.address_line2}
                  onChange={handleInputChange}
                  placeholder="Suite 100"
                  disabled={loading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="city">City</Label>
                <Input
                  id="city"
                  name="city"
                  value={formData.city}
                  onChange={handleInputChange}
                  placeholder="San Francisco"
                  disabled={loading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="state">State</Label>
                <Input
                  id="state"
                  name="state"
                  value={formData.state}
                  onChange={handleInputChange}
                  placeholder="CA"
                  maxLength={2}
                  disabled={loading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="zip_code">ZIP Code</Label>
                <Input
                  id="zip_code"
                  name="zip_code"
                  value={formData.zip_code}
                  onChange={handleInputChange}
                  placeholder="94102"
                  disabled={loading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="country">Country</Label>
                <Input
                  id="country"
                  name="country"
                  value={formData.country}
                  onChange={handleInputChange}
                  disabled={loading}
                />
              </div>
            </div>

            {(formData.latitude && formData.longitude) && (
              <div className="p-3 bg-primary/10 rounded-md border border-primary/20">
                <p className="text-sm text-blue-900 dark:text-blue-100 font-medium mb-1">
                  ✓ Location Coordinates Set
                </p>
                <p className="text-xs text-blue-800 dark:text-blue-200">
                  Latitude: {formData.latitude.toFixed(6)}, Longitude: {formData.longitude.toFixed(6)}
                </p>
              </div>
            )}
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
            <Button type="submit" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save Changes"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
