"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  Calendar,
  Check,
  ClipboardList,
  Dumbbell,
  HeartPulse,
  Languages,
  Loader2,
  MapPin,
  Sparkles,
  UserPlus,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { createClient } from "@/lib/supabase/client";
import {
  SUPPORTED_LANGUAGES,
  TIMEZONES,
  getBrowserLanguage,
  getBrowserTimezone,
} from "@/lib/preferences";
import { toast } from "sonner";

type StepId = 1 | 2 | 3 | 4 | 5;

type ProfileState = {
  full_name: string;
  license_number: string;
  specialties: string;
  timezone: string;
  address_line1: string;
  address_line2: string;
  city: string;
  state: string;
  zip_code: string;
  bio: string;
  language: string;
  avatar_url: string;
};

const EMPTY_PROFILE: ProfileState = {
  full_name: "",
  license_number: "",
  specialties: "",
  timezone: "America/New_York",
  address_line1: "",
  address_line2: "",
  city: "",
  state: "",
  zip_code: "",
  bio: "",
  language: "en",
  avatar_url: "",
};

const STEPS: { id: StepId; title: string; shortTitle: string }[] = [
  { id: 1, title: "Welcome", shortTitle: "Welcome" },
  { id: 2, title: "Professional details", shortTitle: "Profile" },
  { id: 3, title: "Practice location", shortTitle: "Location" },
  { id: 4, title: "About you", shortTitle: "About" },
  { id: 5, title: "You're all set", shortTitle: "Done" },
];

function splitSpecialties(value: string): string[] {
  return value
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean);
}

function joinSpecialties(value: string[] | null | undefined): string {
  if (!Array.isArray(value)) return "";
  return value.join(", ");
}

export default function OnboardingPage() {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);
  const [step, setStep] = useState<StepId>(1);
  const [profile, setProfile] = useState<ProfileState>(EMPTY_PROFILE);
  const [userId, setUserId] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    async function bootstrap() {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!mountedRef.current) return;

        if (!user) {
          router.replace("/login");
          return;
        }

        setUserId(user.id);
        setUserEmail(user.email ?? "");

        const { data: existing, error: profileError } = await supabase
          .from("profiles")
          .select(
            "role, full_name, license_number, specialties, timezone, address_line1, address_line2, city, state, zip_code, bio, language, avatar_url, onboarding_completed_at"
          )
          .eq("id", user.id)
          .maybeSingle();

        if (!mountedRef.current) return;

        if (profileError) {
          setError(profileError.message);
        }

        if (existing?.onboarding_completed_at) {
          router.replace("/dashboard");
          return;
        }

        const metadata =
          (user.user_metadata as Record<string, unknown> | undefined) ?? {};
        const metaFullName =
          typeof metadata.full_name === "string"
            ? (metadata.full_name as string)
            : typeof metadata.name === "string"
              ? (metadata.name as string)
              : "";

        setProfile({
          full_name: existing?.full_name || metaFullName || "",
          license_number: existing?.license_number || "",
          specialties: joinSpecialties(existing?.specialties),
          timezone: existing?.timezone || getBrowserTimezone(),
          address_line1: existing?.address_line1 || "",
          address_line2: existing?.address_line2 || "",
          city: existing?.city || "",
          state: existing?.state || "",
          zip_code: existing?.zip_code || "",
          bio: existing?.bio || "",
          language: existing?.language || getBrowserLanguage(),
          avatar_url: existing?.avatar_url || "",
        });
      } catch (err) {
        if (mountedRef.current) {
          setError(err instanceof Error ? err.message : "Unable to load profile");
        }
      } finally {
        if (mountedRef.current) {
          setLoading(false);
        }
      }
    }
    bootstrap();
  }, [router, supabase]);

  const updateField = <K extends keyof ProfileState>(key: K, value: ProfileState[K]) => {
    setProfile((current) => ({ ...current, [key]: value }));
  };

  const saveStep = async (
    payload: Record<string, unknown>,
    options: { markComplete?: boolean } = {}
  ) => {
    if (!userId) return false;
    setSaving(true);
    setError(null);
    try {
      const update: Record<string, unknown> = { ...payload };
      if (options.markComplete) {
        update.onboarding_completed_at = new Date().toISOString();
      }
      const { error: updateError } = await supabase
        .from("profiles")
        .update(update)
        .eq("id", userId);

      if (updateError) {
        const message = updateError.message || "Failed to save your profile";
        setError(message);
        toast.error(message);
        return false;
      }
      return true;
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Something went wrong saving your profile";
      setError(message);
      toast.error(message);
      return false;
    } finally {
      if (mountedRef.current) {
        setSaving(false);
      }
    }
  };

  const goNext = () => setStep((current) => (current < 5 ? ((current + 1) as StepId) : current));
  const goBack = () => setStep((current) => (current > 1 ? ((current - 1) as StepId) : current));

  const handleWelcomeContinue = () => {
    goNext();
  };

  const handleProfessionalSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!profile.full_name.trim()) {
      setError("Please enter your full name.");
      return;
    }
    if (!profile.license_number.trim()) {
      setError("License number is required to see patient data.");
      return;
    }
    const ok = await saveStep(
      {
        full_name: profile.full_name.trim(),
        license_number: profile.license_number.trim(),
        specialties: splitSpecialties(profile.specialties),
        timezone: profile.timezone,
      },
      { markComplete: true }
    );
    if (ok) {
      toast.success("Profile saved", {
        description: "You can finish the rest later from Settings if you want.",
      });
      goNext();
    }
  };

  const handleLocationSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    const ok = await saveStep({
      address_line1: profile.address_line1.trim() || null,
      address_line2: profile.address_line2.trim() || null,
      city: profile.city.trim() || null,
      state: profile.state.trim() || null,
      zip_code: profile.zip_code.trim() || null,
    });
    if (ok) goNext();
  };

  const handleAboutSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    const ok = await saveStep({
      bio: profile.bio.trim() || null,
      language: profile.language,
      avatar_url: profile.avatar_url.trim() || null,
    });
    if (ok) goNext();
  };

  const handleFinish = () => {
    router.replace("/dashboard");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-lime-50/40 to-white dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
        <div className="flex items-center gap-3 text-slate-600 dark:text-slate-300">
          <Loader2 className="h-5 w-5 animate-spin" />
          <span className="text-sm">Loading your account...</span>
        </div>
      </div>
    );
  }

  const isFinalStep = step === 5;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-lime-50/40 to-white dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 p-4 relative overflow-hidden">
      <div className="absolute inset-0 bg-grid-slate-900/[0.04] dark:bg-grid-slate-100/[0.05] bg-[size:20px_20px]" />
      <div className="absolute top-0 right-0 w-96 h-96 bg-primary/15 dark:bg-primary/10 rounded-full blur-3xl" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-lime-400/20 dark:bg-lime-500/10 rounded-full blur-3xl" />

      <div className="relative w-full max-w-2xl animate-scale-in">
        <Stepper step={step} />

        <Card className="mt-6 border border-white/40 dark:border-white/10 shadow-2xl shadow-slate-200/50 dark:shadow-black/30 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl">
          {step === 1 && (
            <WelcomeStep
              email={userEmail}
              fullName={profile.full_name}
              onContinue={handleWelcomeContinue}
            />
          )}
          {step === 2 && (
            <ProfessionalStep
              profile={profile}
              onChange={updateField}
              onSubmit={handleProfessionalSubmit}
              onBack={goBack}
              saving={saving}
              error={error}
            />
          )}
          {step === 3 && (
            <LocationStep
              profile={profile}
              onChange={updateField}
              onSubmit={handleLocationSubmit}
              onBack={goBack}
              onSkip={goNext}
              saving={saving}
              error={error}
            />
          )}
          {step === 4 && (
            <AboutStep
              profile={profile}
              onChange={updateField}
              onSubmit={handleAboutSubmit}
              onBack={goBack}
              onSkip={goNext}
              saving={saving}
              error={error}
            />
          )}
          {isFinalStep && <FinishStep onFinish={handleFinish} />}
        </Card>

        <div className="mt-4 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
          <p>
            Signed in as <span className="font-medium">{userEmail}</span>
          </p>
          <Link href="/dashboard/preferences" className="hover:text-primary hover:underline">
            Adjust preferences later in Settings
          </Link>
        </div>
      </div>
    </div>
  );
}

function Stepper({ step }: { step: StepId }) {
  const totalSteps = STEPS.length;
  const progressPct = ((step - 1) / (totalSteps - 1)) * 100;

  return (
    <div className="rounded-2xl border border-white/40 dark:border-white/10 bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl px-5 py-4 shadow-lg shadow-slate-200/40 dark:shadow-black/20">
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <img
            src="/platform-logo.png"
            alt="Revora Health"
            className="h-7 w-7 object-contain"
          />
          <span className="text-sm font-semibold bg-gradient-to-r from-primary to-lime-600 bg-clip-text text-transparent">
            Revora Health
          </span>
        </div>
        <div className="ml-auto text-xs font-medium text-slate-500 dark:text-slate-400">
          Step {step} of {totalSteps} · {STEPS[step - 1].title}
        </div>
      </div>
      <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-slate-200/80 dark:bg-slate-800/80">
        <div
          className="h-full rounded-full bg-gradient-to-r from-primary to-lime-500 transition-all duration-500"
          style={{ width: `${Math.max(8, progressPct)}%` }}
        />
      </div>
      <div className="mt-3 hidden md:flex items-center justify-between text-[11px] font-medium uppercase tracking-wide text-slate-400 dark:text-slate-500">
        {STEPS.map((entry) => {
          const isComplete = entry.id < step;
          const isCurrent = entry.id === step;
          return (
            <span
              key={entry.id}
              className={
                isCurrent
                  ? "text-primary"
                  : isComplete
                    ? "text-slate-600 dark:text-slate-300"
                    : ""
              }
            >
              {entry.shortTitle}
            </span>
          );
        })}
      </div>
    </div>
  );
}

function WelcomeStep({
  email,
  fullName,
  onContinue,
}: {
  email: string;
  fullName: string;
  onContinue: () => void;
}) {
  const firstName = fullName.trim().split(/\s+/)[0] || email.split("@")[0] || "there";
  return (
    <>
      <CardHeader className="space-y-3 pb-2">
        <div className="inline-flex w-fit items-center gap-2 rounded-full bg-primary/10 text-primary px-3 py-1 text-xs font-semibold">
          <Sparkles className="h-3.5 w-3.5" />
          Welcome to Revora
        </div>
        <CardTitle className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
          Glad you&apos;re here, {firstName}.
        </CardTitle>
        <CardDescription className="text-base text-slate-600 dark:text-slate-300">
          A few quick steps and you&apos;ll be ready to see your patients.
          You can skip optional pieces and come back to them anytime.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <ul className="space-y-3">
          <BenefitRow
            icon={<ClipboardList className="h-4 w-4" />}
            title="Patients, charting, and exercise plans in one place"
            description="Manage notes, recovery milestones, and home-exercise programs without juggling tabs."
          />
          <BenefitRow
            icon={<Calendar className="h-4 w-4" />}
            title="Built-in scheduling and video visits"
            description="Drag-and-drop calendar, Zoom-ready video, and patient reminders."
          />
          <BenefitRow
            icon={<HeartPulse className="h-4 w-4" />}
            title="AI insights from Clara"
            description="Clinical signals from session data so you can spot trends faster."
          />
        </ul>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Setup takes about a minute.
          </p>
          <Button
            onClick={onContinue}
            className="h-11 px-6 text-base font-semibold shadow-lg hover:shadow-xl transition-all"
          >
            Let&apos;s get started
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </>
  );
}

function BenefitRow({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <li className="flex items-start gap-3 rounded-xl border border-slate-100 dark:border-slate-800/80 bg-white/60 dark:bg-slate-900/60 p-3.5">
      <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
        {icon}
      </div>
      <div className="space-y-0.5">
        <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{title}</p>
        <p className="text-sm text-slate-600 dark:text-slate-400">{description}</p>
      </div>
    </li>
  );
}

function ProfessionalStep({
  profile,
  onChange,
  onSubmit,
  onBack,
  saving,
  error,
}: {
  profile: ProfileState;
  onChange: <K extends keyof ProfileState>(key: K, value: ProfileState[K]) => void;
  onSubmit: (event: React.FormEvent) => void;
  onBack: () => void;
  saving: boolean;
  error: string | null;
}) {
  return (
    <>
      <CardHeader className="space-y-1.5 pb-3">
        <CardTitle className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
          Tell us about your practice
        </CardTitle>
        <CardDescription className="text-base text-slate-600 dark:text-slate-300">
          We need these basics before you can see patient data. Specialties are optional but help
          tailor suggestions.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={onSubmit} className="space-y-5">
          {error && (
            <div className="rounded-lg border-2 border-destructive/20 bg-destructive/10 p-3 text-sm text-destructive">
              {error}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="full_name">Full name</Label>
            <Input
              id="full_name"
              value={profile.full_name}
              onChange={(event) => onChange("full_name", event.target.value)}
              required
              placeholder="Jane Doe, PT, DPT"
              disabled={saving}
              className="h-11 rounded-xl border-2"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="license_number">License number</Label>
            <Input
              id="license_number"
              value={profile.license_number}
              onChange={(event) => onChange("license_number", event.target.value)}
              required
              placeholder="e.g. PT123456"
              disabled={saving}
              className="h-11 rounded-xl border-2"
            />
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Stored privately. Used to confirm credentials and required by Patient Access controls.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="specialties">Specialties</Label>
            <Input
              id="specialties"
              value={profile.specialties}
              onChange={(event) => onChange("specialties", event.target.value)}
              placeholder="Orthopedics, sports rehab, post-op"
              disabled={saving}
              className="h-11 rounded-xl border-2"
            />
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Separate multiple specialties with commas.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="timezone">Timezone</Label>
            <select
              id="timezone"
              value={profile.timezone}
              onChange={(event) => onChange("timezone", event.target.value)}
              disabled={saving}
              className="flex h-11 w-full rounded-xl border-2 border-slate-200/80 dark:border-white/10 bg-white/60 dark:bg-slate-800/60 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
            >
              {TIMEZONES.map((tz) => (
                <option key={tz.value} value={tz.value}>
                  {tz.label} ({tz.offset})
                </option>
              ))}
            </select>
          </div>

          <FooterRow>
            <Button
              type="button"
              variant="ghost"
              onClick={onBack}
              disabled={saving}
              className="text-slate-600 dark:text-slate-300"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
            <Button type="submit" disabled={saving} className="h-11 px-6 font-semibold">
              {saving ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" /> Saving...
                </span>
              ) : (
                <>
                  Continue
                  <ArrowRight className="ml-2 h-4 w-4" />
                </>
              )}
            </Button>
          </FooterRow>
        </form>
      </CardContent>
    </>
  );
}

function LocationStep({
  profile,
  onChange,
  onSubmit,
  onBack,
  onSkip,
  saving,
  error,
}: {
  profile: ProfileState;
  onChange: <K extends keyof ProfileState>(key: K, value: ProfileState[K]) => void;
  onSubmit: (event: React.FormEvent) => void;
  onBack: () => void;
  onSkip: () => void;
  saving: boolean;
  error: string | null;
}) {
  return (
    <>
      <CardHeader className="space-y-1.5 pb-3">
        <div className="inline-flex w-fit items-center gap-2 rounded-full bg-sky-100 dark:bg-sky-900/40 text-sky-700 dark:text-sky-200 px-3 py-1 text-xs font-semibold">
          <MapPin className="h-3.5 w-3.5" />
          Optional
        </div>
        <CardTitle className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
          Where do you practice?
        </CardTitle>
        <CardDescription className="text-base text-slate-600 dark:text-slate-300">
          Helps patients find you on the map and powers location-based scheduling. Add it now or
          skip and fill in later.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={onSubmit} className="space-y-5">
          {error && (
            <div className="rounded-lg border-2 border-destructive/20 bg-destructive/10 p-3 text-sm text-destructive">
              {error}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="address_line1">Street address</Label>
            <Input
              id="address_line1"
              value={profile.address_line1}
              onChange={(event) => onChange("address_line1", event.target.value)}
              placeholder="123 Main St"
              disabled={saving}
              className="h-11 rounded-xl border-2"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="address_line2">Suite / unit (optional)</Label>
            <Input
              id="address_line2"
              value={profile.address_line2}
              onChange={(event) => onChange("address_line2", event.target.value)}
              placeholder="Suite 200"
              disabled={saving}
              className="h-11 rounded-xl border-2"
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-[2fr_1fr_1fr]">
            <div className="space-y-2">
              <Label htmlFor="city">City</Label>
              <Input
                id="city"
                value={profile.city}
                onChange={(event) => onChange("city", event.target.value)}
                placeholder="Austin"
                disabled={saving}
                className="h-11 rounded-xl border-2"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="state">State</Label>
              <Input
                id="state"
                value={profile.state}
                onChange={(event) => onChange("state", event.target.value)}
                placeholder="TX"
                disabled={saving}
                className="h-11 rounded-xl border-2"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="zip_code">ZIP</Label>
              <Input
                id="zip_code"
                value={profile.zip_code}
                onChange={(event) => onChange("zip_code", event.target.value)}
                placeholder="78701"
                disabled={saving}
                className="h-11 rounded-xl border-2"
              />
            </div>
          </div>

          <FooterRow>
            <Button
              type="button"
              variant="ghost"
              onClick={onBack}
              disabled={saving}
              className="text-slate-600 dark:text-slate-300"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={onSkip}
                disabled={saving}
              >
                Skip for now
              </Button>
              <Button type="submit" disabled={saving} className="h-11 px-6 font-semibold">
                {saving ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" /> Saving...
                  </span>
                ) : (
                  <>
                    Continue
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>
            </div>
          </FooterRow>
        </form>
      </CardContent>
    </>
  );
}

function AboutStep({
  profile,
  onChange,
  onSubmit,
  onBack,
  onSkip,
  saving,
  error,
}: {
  profile: ProfileState;
  onChange: <K extends keyof ProfileState>(key: K, value: ProfileState[K]) => void;
  onSubmit: (event: React.FormEvent) => void;
  onBack: () => void;
  onSkip: () => void;
  saving: boolean;
  error: string | null;
}) {
  return (
    <>
      <CardHeader className="space-y-1.5 pb-3">
        <div className="inline-flex w-fit items-center gap-2 rounded-full bg-violet-100 dark:bg-violet-900/40 text-violet-700 dark:text-violet-200 px-3 py-1 text-xs font-semibold">
          <Languages className="h-3.5 w-3.5" />
          Optional
        </div>
        <CardTitle className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
          A little about you
        </CardTitle>
        <CardDescription className="text-base text-slate-600 dark:text-slate-300">
          Shown to your patients in the app. You can polish it later.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={onSubmit} className="space-y-5">
          {error && (
            <div className="rounded-lg border-2 border-destructive/20 bg-destructive/10 p-3 text-sm text-destructive">
              {error}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="bio">Short bio</Label>
            <Textarea
              id="bio"
              value={profile.bio}
              onChange={(event) => onChange("bio", event.target.value)}
              placeholder="Share your training, approach to care, and what your patients can expect."
              rows={4}
              disabled={saving}
              className="rounded-xl border-2"
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="language">Preferred language</Label>
              <select
                id="language"
                value={profile.language}
                onChange={(event) => onChange("language", event.target.value)}
                disabled={saving}
                className="flex h-11 w-full rounded-xl border-2 border-slate-200/80 dark:border-white/10 bg-white/60 dark:bg-slate-800/60 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              >
                {SUPPORTED_LANGUAGES.map((lang) => (
                  <option key={lang.code} value={lang.code}>
                    {lang.nativeName} ({lang.name})
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="avatar_url">Profile photo URL</Label>
              <Input
                id="avatar_url"
                value={profile.avatar_url}
                onChange={(event) => onChange("avatar_url", event.target.value)}
                placeholder="https://..."
                disabled={saving}
                className="h-11 rounded-xl border-2"
              />
              <p className="text-xs text-slate-500 dark:text-slate-400">
                We&apos;ll wire up direct uploads soon.
              </p>
            </div>
          </div>

          <FooterRow>
            <Button
              type="button"
              variant="ghost"
              onClick={onBack}
              disabled={saving}
              className="text-slate-600 dark:text-slate-300"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={onSkip}
                disabled={saving}
              >
                Skip for now
              </Button>
              <Button type="submit" disabled={saving} className="h-11 px-6 font-semibold">
                {saving ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" /> Saving...
                  </span>
                ) : (
                  <>
                    Continue
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>
            </div>
          </FooterRow>
        </form>
      </CardContent>
    </>
  );
}

function FinishStep({ onFinish }: { onFinish: () => void }) {
  return (
    <>
      <CardHeader className="space-y-3 pb-2">
        <div className="inline-flex w-fit items-center gap-2 rounded-full bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-200 px-3 py-1 text-xs font-semibold">
          <Check className="h-3.5 w-3.5" />
          You&apos;re all set
        </div>
        <CardTitle className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
          Welcome to your dashboard.
        </CardTitle>
        <CardDescription className="text-base text-slate-600 dark:text-slate-300">
          Here are a few places to start. Everything here is also reachable from the left sidebar.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid gap-3 sm:grid-cols-3">
          <NextStepCard
            href="/dashboard/patients"
            icon={<UserPlus className="h-5 w-5" />}
            title="Add your first patient"
            description="Create a profile and start tracking progress."
          />
          <NextStepCard
            href="/dashboard/calendar"
            icon={<Calendar className="h-5 w-5" />}
            title="Schedule a session"
            description="Drag-and-drop calendar with reminders."
          />
          <NextStepCard
            href="/dashboard"
            icon={<Dumbbell className="h-5 w-5" />}
            title="Explore the dashboard"
            description="See clinical signals from Clara and quick stats."
          />
        </div>

        <FooterRow>
          <Link href="/dashboard/profile" className="text-sm text-slate-600 hover:text-primary hover:underline dark:text-slate-300">
            Edit profile details later
          </Link>
          <Button onClick={onFinish} className="h-11 px-6 font-semibold">
            Go to dashboard
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </FooterRow>
      </CardContent>
    </>
  );
}

function NextStepCard({
  href,
  icon,
  title,
  description,
}: {
  href: string;
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <Link
      href={href}
      className="group flex flex-col gap-2 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white/70 dark:bg-slate-900/60 p-4 transition-all hover:border-primary/60 hover:shadow-md hover:-translate-y-0.5"
    >
      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-primary">
        {icon}
      </div>
      <p className="text-sm font-semibold text-slate-900 dark:text-slate-100 group-hover:text-primary">
        {title}
      </p>
      <p className="text-xs text-slate-600 dark:text-slate-400">{description}</p>
    </Link>
  );
}

function FooterRow({ children }: { children: React.ReactNode }) {
  return <div className="flex items-center justify-between gap-3 pt-2">{children}</div>;
}
