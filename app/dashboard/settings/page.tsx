"use client";

import { Breadcrumb } from "@/components/ui/breadcrumb";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Settings, User, Bell, Shield, CreditCard, Globe } from "lucide-react";
import Link from "next/link";

export default function SettingsPage() {
  const settingsSections = [
    {
      title: "Profile Settings",
      description: "Manage your personal information and credentials",
      icon: User,
      href: "/dashboard/profile",
      comingSoon: false,
    },
    {
      title: "Notifications",
      description: "Configure appointment reminders and alerts",
      icon: Bell,
      href: "#",
      comingSoon: true,
    },
    {
      title: "Security & Privacy",
      description: "HIPAA compliance and security settings",
      icon: Shield,
      href: "#",
      comingSoon: true,
    },
    {
      title: "Billing & Subscription",
      description: "Manage your subscription and payment methods",
      icon: CreditCard,
      href: "#",
      comingSoon: true,
    },
    {
      title: "Preferences",
      description: "Language, timezone, and display settings",
      icon: Globe,
      href: "/dashboard/preferences",
      comingSoon: false,
    },
  ];

  return (
    <div className="p-6 md:p-8 space-y-6">
      <div className="space-y-2">
        <Breadcrumb items={[{ label: "Settings" }]} />
        <h1 className="text-4xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 dark:from-slate-100 dark:to-slate-300 bg-clip-text text-transparent">
          Settings
        </h1>
        <p className="text-muted-foreground text-lg">
          Manage your account and preferences
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {settingsSections.map((section, index) => {
          const Icon = section.icon;
          return (
            <Card
              key={index}
              className="shadow-lg border-0 hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
            >
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/20">
                      <Icon className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{section.title}</CardTitle>
                      <CardDescription className="mt-1">
                        {section.description}
                      </CardDescription>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {section.comingSoon ? (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Coming soon</span>
                    <Button variant="outline" size="sm" disabled>
                      Configure
                    </Button>
                  </div>
                ) : (
                  <Button variant="outline" size="sm" asChild>
                    <Link href={section.href}>Configure</Link>
                  </Button>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Quick Links */}
      <Card className="shadow-lg border-0">
        <CardHeader>
          <CardTitle>Quick Links</CardTitle>
          <CardDescription>Navigate to other sections</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-2 md:grid-cols-3">
            <Link href="/dashboard">
              <Button variant="outline" className="w-full justify-start">
                <Settings className="h-4 w-4 mr-2" />
                Dashboard
              </Button>
            </Link>
            <Link href="/dashboard/calendar">
              <Button variant="outline" className="w-full justify-start">
                <Settings className="h-4 w-4 mr-2" />
                Calendar
              </Button>
            </Link>
            <Link href="/dashboard/patients">
              <Button variant="outline" className="w-full justify-start">
                <Settings className="h-4 w-4 mr-2" />
                Patients
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
