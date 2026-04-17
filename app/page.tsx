import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Calendar, FileText, Users, Shield, ArrowRight, CheckCircle2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export default function HomePage() {
  const features = [
    {
      icon: Calendar,
      title: "Smart Scheduling",
      description: "Drag-and-drop calendar with automated reminders",
    },
    {
      icon: FileText,
      title: "SOAP Charting",
      description: "Comprehensive note-taking with templates and body maps",
    },
    {
      icon: Users,
      title: "Patient Management",
      description: "Complete patient profiles and recovery tracking",
    },
    {
      icon: Shield,
      title: "HIPAA Compliant",
      description: "Secure, encrypted data storage and messaging",
    },
  ];

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-100 via-lime-50/30 to-emerald-50/30 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-grid-slate-900/[0.04] dark:bg-grid-slate-100/[0.05] bg-[size:20px_20px]" />
        <div className="relative container mx-auto px-4 sm:px-6 lg:px-8 py-24 md:py-32 lg:py-40">
          <div className="max-w-4xl mx-auto text-center space-y-8 animate-fade-in-up">
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight flex items-center justify-center gap-3 md:gap-4">
              <img
                src="/platform-logo.png"
                alt="Revora Health logo"
                className="h-12 w-12 md:h-16 md:w-16 lg:h-20 lg:w-20 object-contain shrink-0"
              />
              <span className="bg-gradient-to-r from-primary via-lime-600 to-emerald-600 dark:from-primary dark:via-lime-500 dark:to-emerald-500 bg-clip-text text-transparent">
                Revora Health
              </span>
            </h1>
            
            <p className="text-xl md:text-2xl text-slate-600 dark:text-slate-300 max-w-2xl mx-auto text-balance">
              The complete practice management platform for physical therapists.
              Streamline scheduling, charting, and patient care in one beautiful interface.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-4">
              <Link href="/login">
                <Button size="lg" className="group text-lg px-8 py-6 h-auto shadow-lg hover:shadow-xl transition-all">
                  Get Started
                  <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
              <Link href="/dashboard">
                <Button size="lg" variant="outline" className="text-lg px-8 py-6 h-auto border-2 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all">
                  View Dashboard
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 md:py-28 bg-white/40 dark:bg-slate-900/40 backdrop-blur-xl border-y border-white/30 dark:border-white/5">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16 space-y-4">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-slate-100">
              Everything you need to manage your practice
            </h2>
            <p className="text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
              Powerful features designed specifically for physical therapists
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl mx-auto">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <Card 
                  key={index}
                  className="group border border-white/40 dark:border-white/10 hover:border-primary/40 dark:hover:border-primary/30 transition-all duration-300 hover:shadow-xl hover:-translate-y-1"
                >
                  <CardContent className="p-6 space-y-4">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary to-lime-600 flex items-center justify-center group-hover:scale-110 transition-transform shadow-lg shadow-primary/20">
                      <Icon className="h-6 w-6 text-white" />
                    </div>
                    <h3 className="text-xl font-semibold text-slate-900 dark:text-slate-100">
                      {feature.title}
                    </h3>
                    <p className="text-slate-600 dark:text-slate-400">
                      {feature.description}
                    </p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 md:py-28">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <Card className="max-w-4xl mx-auto border border-white/30 dark:border-white/10 bg-gradient-to-br from-primary/90 to-lime-600/90 dark:from-primary/80 dark:to-lime-600/80 backdrop-blur-xl text-white shadow-2xl shadow-primary/20">
            <CardContent className="p-12 md:p-16 text-center space-y-6">
              <img
                src="/platform-logo.png"
                alt="Revora Health logo"
                className="h-16 w-16 mx-auto object-contain opacity-95"
              />
              <h2 className="text-3xl md:text-4xl font-bold">
                Ready to transform your practice?
              </h2>
              <p className="text-xl text-white/90 max-w-2xl mx-auto">
                Join physical therapists who are already using Revora Health to streamline their workflow and provide better patient care.
              </p>
              <div className="pt-4">
                <Link href="/login">
                  <Button size="lg" variant="secondary" className="text-lg px-8 py-6 h-auto shadow-lg hover:shadow-xl transition-all">
                    Start Free Trial
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>
    </main>
  );
}
