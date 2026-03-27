"use client";

import { useEffect, useState } from "react";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { createClient } from "@/lib/supabase/client";
import { Globe, Clock, Save, Check } from "lucide-react";
import { SUPPORTED_LANGUAGES, TIMEZONES, getBrowserLanguage, getBrowserTimezone, type Language, type Timezone } from "@/lib/preferences";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";

export default function PreferencesPage() {
  const [language, setLanguage] = useState<string>("en");
  const [timezone, setTimezone] = useState<string>("America/New_York");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [originalLanguage, setOriginalLanguage] = useState<string>("en");
  const [originalTimezone, setOriginalTimezone] = useState<string>("America/New_York");
  const supabase = createClient();

  useEffect(() => {
    loadPreferences();
  }, []);

  useEffect(() => {
    setHasChanges(
      language !== originalLanguage || timezone !== originalTimezone
    );
  }, [language, timezone, originalLanguage, originalTimezone]);

  const loadPreferences = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }

      // Try to load preferences, but handle case where language column might not exist yet
      const { data, error } = await supabase
        .from("profiles")
        .select("language, timezone")
        .eq("id", user.id)
        .single();

      if (error) {
        // If column doesn't exist (code 42703), that's okay - use defaults
        const isColumnMissing = error.code === "42703" || error.message?.includes("column") || error.message?.includes("does not exist");
        
        if (isColumnMissing) {
          // Migration hasn't been run yet - use browser defaults
          const browserLang = getBrowserLanguage();
          const browserTz = getBrowserTimezone();
          setLanguage(browserLang);
          setTimezone(browserTz);
          setOriginalLanguage(browserLang);
          setOriginalTimezone(browserTz);
        } else {
          // Other error - try loading just timezone
          const { data: tzData } = await supabase
            .from("profiles")
            .select("timezone")
            .eq("id", user.id)
            .single();
          
          const prefTimezone = (tzData?.timezone as string) || getBrowserTimezone();
          const browserLang = getBrowserLanguage();
          
          setLanguage(browserLang);
          setTimezone(prefTimezone);
          setOriginalLanguage(browserLang);
          setOriginalTimezone(prefTimezone);
          
          console.warn("Language column not found. Please run the migration to add language support.");
        }
      } else {
        const prefLanguage = (data?.language as string) || getBrowserLanguage();
        const prefTimezone = (data?.timezone as string) || getBrowserTimezone();
        setLanguage(prefLanguage);
        setTimezone(prefTimezone);
        setOriginalLanguage(prefLanguage);
        setOriginalTimezone(prefTimezone);
      }
    } catch (error) {
      console.error("Error loading preferences:", error);
      // Use browser defaults as fallback
      const browserLang = getBrowserLanguage();
      const browserTz = getBrowserTimezone();
      setLanguage(browserLang);
      setTimezone(browserTz);
      setOriginalLanguage(browserLang);
      setOriginalTimezone(browserTz);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        toast.error("You must be logged in to save preferences");
        return;
      }

      // Build update object - only include language if column exists
      const updateData: { timezone: string; language?: string } = {
        timezone,
      };
      
      // Try to include language, but handle gracefully if column doesn't exist
      try {
        updateData.language = language;
      } catch {
        // Language column might not exist - that's okay, we'll just update timezone
      }

      const { error } = await supabase
        .from("profiles")
        .update(updateData)
        .eq("id", user.id);

      if (error) {
        // If language column doesn't exist, try updating just timezone
        if (error.code === "42703" || error.message?.includes("column") || error.message?.includes("does not exist")) {
          const { error: tzError } = await supabase
            .from("profiles")
            .update({ timezone })
            .eq("id", user.id);
          
          if (tzError) {
            console.error("Error saving timezone:", tzError);
            toast.error("Failed to save preferences. Please run the database migration to enable language preferences.");
            return;
          }
          
          // Timezone saved successfully, but language column doesn't exist
          toast.warning("Timezone saved. Language preference requires database migration.");
        } else {
          console.error("Error saving preferences:", error);
          toast.error("Failed to save preferences");
          return;
        }
      } else {
        // Both saved successfully
        toast.success("Preferences saved successfully");
      }

      setOriginalLanguage(language);
      setOriginalTimezone(timezone);
      setHasChanges(false);
    } catch (error) {
      console.error("Error saving preferences:", error);
      toast.error("Failed to save preferences");
    } finally {
      setSaving(false);
    }
  };

  const selectedLanguage = SUPPORTED_LANGUAGES.find((l) => l.code === language);
  const selectedTimezone = TIMEZONES.find((t) => t.value === timezone);

  if (loading) {
    return (
      <div className="p-6 md:p-8 space-y-6">
        <div className="space-y-2">
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-5 w-96" />
        </div>
        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-32" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-10 w-full" />
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-32" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-10 w-full" />
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8 space-y-6">
      <div className="space-y-2">
        <Breadcrumb items={[{ label: "Settings" }, { label: "Preferences" }]} />
        <h1 className="text-4xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 dark:from-slate-100 dark:to-slate-300 bg-clip-text text-transparent">
          Preferences
        </h1>
        <p className="text-muted-foreground text-lg">
          Customize your language and timezone settings
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Language Preference */}
        <Card className="shadow-lg border-0">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/20">
                <Globe className="h-5 w-5 text-primary" />
              </div>
              <div>
                <CardTitle>Language</CardTitle>
                <CardDescription>
                  Choose your preferred language for the interface
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="language">Language</Label>
              <select
                id="language"
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="flex h-10 w-full rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-slate-400 dark:focus:ring-slate-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {SUPPORTED_LANGUAGES.map((lang) => (
                  <option key={lang.code} value={lang.code}>
                    {lang.nativeName} ({lang.name})
                  </option>
                ))}
              </select>
            </div>
            {selectedLanguage && (
              <div className="text-sm text-muted-foreground">
                <p>
                  Selected: <span className="font-medium">{selectedLanguage.nativeName}</span>
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Timezone Preference */}
        <Card className="shadow-lg border-0">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-900/20">
                <Clock className="h-5 w-5 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <CardTitle>Timezone</CardTitle>
                <CardDescription>
                  Set your timezone for accurate appointment times
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="timezone">Timezone</Label>
              <select
                id="timezone"
                value={timezone}
                onChange={(e) => setTimezone(e.target.value)}
                className="flex h-10 w-full rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-slate-400 dark:focus:ring-slate-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {TIMEZONES.map((tz) => (
                  <option key={tz.value} value={tz.value}>
                    {tz.label} ({tz.offset})
                  </option>
                ))}
              </select>
            </div>
            {selectedTimezone && (
              <div className="text-sm text-muted-foreground">
                <p>
                  Selected: <span className="font-medium">{selectedTimezone.label}</span>
                </p>
                <p className="text-xs mt-1">Offset: {selectedTimezone.offset}</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Save Button */}
      <Card className="shadow-lg border-0">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div className="text-sm text-muted-foreground">
              {hasChanges ? (
                <span className="text-amber-600 dark:text-amber-400">
                  You have unsaved changes
                </span>
              ) : (
                <span className="flex items-center gap-2 text-green-600 dark:text-green-400">
                  <Check className="h-4 w-4" />
                  All preferences saved
                </span>
              )}
            </div>
            <Button
              onClick={handleSave}
              disabled={!hasChanges || saving}
              className="min-w-[120px]"
            >
              {saving ? (
                "Saving..."
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Save Preferences
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Info Card */}
      <Card className="shadow-lg border-0 bg-primary/5 border-primary/20">
        <CardHeader>
          <CardTitle className="text-base">About Preferences</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground space-y-2">
          <p>
            <strong>Language:</strong> Changing your language preference will affect the interface language throughout the platform. Some content may still appear in English if translations are not available.
          </p>
          <p>
            <strong>Timezone:</strong> Your timezone setting ensures that all appointment times, reminders, and schedules are displayed in your local time. This helps prevent confusion when scheduling across different time zones.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
