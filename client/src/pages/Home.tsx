import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { startLogin } from "@/const";
import { useLocation } from "wouter";
import { GraduationCap, Shield, BarChart3, Users, DollarSign, Clock } from "lucide-react";
import { useEffect } from "react";

export default function Home() {
  const { user, isAuthenticated, loading } = useAuth();
  const [, navigate] = useLocation();

  useEffect(() => {
    if (isAuthenticated && !loading) {
      navigate("/dashboard");
    }
  }, [isAuthenticated, loading, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <header className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-background to-accent/20" />
        <div className="relative container mx-auto px-4 py-8">
          <nav className="flex items-center justify-between mb-16">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center">
                <GraduationCap className="w-6 h-6 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-foreground">Ultimate SMS</h1>
                <p className="text-xs text-muted-foreground">School Management System</p>
              </div>
            </div>
            <Button onClick={() => startLogin()} size="lg" className="font-semibold">
              Sign In
            </Button>
          </nav>

          <div className="max-w-4xl mx-auto text-center py-16">
            <h2 className="text-4xl md:text-5xl font-extrabold text-foreground mb-6 leading-tight">
              Comprehensive School<br />
              <span className="text-primary">Management Platform</span>
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-10">
              Centralize student enrollment, staff management, finance, academics, biometric attendance, 
              and reporting into one unified platform with strict role-based access control.
            </p>
            <Button onClick={() => startLogin()} size="lg" className="text-lg px-8 py-6 font-semibold">
              Get Started
            </Button>
          </div>
        </div>
      </header>

      {/* Features Grid */}
      <section className="container mx-auto px-4 py-20">
        <h3 className="text-2xl font-bold text-center mb-12 text-foreground">Core Modules</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[
            { icon: DollarSign, title: "Finance Management", desc: "Income tracking, expense approval workflows with mandatory Principal PIN authorization, budget planning, and automated payroll." },
            { icon: Users, title: "Student Management", desc: "Complete enrollment, profiles, sponsor tracking, special needs records, and real-time biometric presence status." },
            { icon: GraduationCap, title: "Academic Module", desc: "Class management, subject allocation, grade entry, lesson plans, timetable scheduling, and academic calendar." },
            { icon: Shield, title: "HR & Staff", desc: "Staff records, leave management, qualification tracking, contract types, and performance linked to attendance." },
            { icon: Clock, title: "Biometric Attendance", desc: "Real-time presence tracking with color-coded status indicators. Automated absence and late notifications to parents." },
            { icon: BarChart3, title: "Reports & Analytics", desc: "Financial summaries, attendance reports, academic performance, and automated scheduled report delivery." },
          ].map((feature, i) => (
            <div key={i} className="p-6 rounded-xl border border-border bg-card hover:shadow-lg transition-shadow duration-200">
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                <feature.icon className="w-6 h-6 text-primary" />
              </div>
              <h4 className="font-bold text-foreground mb-2">{feature.title}</h4>
              <p className="text-sm text-muted-foreground">{feature.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-8">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>Ultimate School Management System &mdash; Child Africa &amp; Solberg College</p>
        </div>
      </footer>
    </div>
  );
}
