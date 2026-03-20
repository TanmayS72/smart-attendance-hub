import { subjects, getPercentage, getStatus, getSuggestion, getOverallAttendance } from "@/lib/data";
import { StatusBadge } from "@/components/StatusBadge";
import { AttendanceProgress } from "@/components/AttendanceProgress";
import { ScrollReveal } from "@/components/ScrollReveal";
import { AppLayout } from "@/components/AppLayout";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { cn } from "@/lib/utils";

const statusRingColors = {
  safe: "ring-safe/20",
  warning: "ring-warning/20",
  critical: "ring-critical/20",
};

export default function Dashboard() {
  const overall = getOverallAttendance(subjects);
  const overallStatus = getStatus(overall);

  return (
    <AppLayout>
      <ScrollReveal>
        <div className="mb-8">
          <h1 className="text-2xl font-bold tracking-tight mb-1">Dashboard</h1>
          <p className="text-sm text-muted-foreground">Track your attendance at a glance</p>
        </div>
      </ScrollReveal>

      {/* Overall card */}
      <ScrollReveal delay={0.1}>
        <div className="rounded-2xl border bg-card p-6 shadow-sm mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center gap-6">
            <div
              className={cn(
                "h-28 w-28 rounded-full flex items-center justify-center ring-4 shrink-0",
                statusRingColors[overallStatus]
              )}
            >
              <div className="text-center">
                <div className="text-3xl font-extrabold">{overall}%</div>
                <div className="text-xs text-muted-foreground">Overall</div>
              </div>
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h2 className="text-lg font-semibold">Overall Attendance</h2>
                <StatusBadge status={overallStatus} />
              </div>
              <p className="text-sm text-muted-foreground mb-3">
                {overallStatus === "safe"
                  ? "You're doing great! Keep it up."
                  : overallStatus === "warning"
                  ? "Be careful — your attendance needs attention."
                  : "Your attendance is critically low. Take action now."}
              </p>
              <AttendanceProgress percentage={overall} status={overallStatus} />
            </div>
          </div>
        </div>
      </ScrollReveal>

      {/* Subject grid */}
      <ScrollReveal delay={0.2}>
        <h2 className="text-lg font-semibold mb-4">Subject-wise Attendance</h2>
      </ScrollReveal>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {subjects.map((sub, i) => {
          const pct = getPercentage(sub.attended, sub.total);
          const status = getStatus(pct);
          const suggestion = getSuggestion(sub.attended, sub.total);
          const TrendIcon = pct >= 85 ? TrendingUp : pct >= 75 ? Minus : TrendingDown;

          return (
            <ScrollReveal key={sub.id} delay={0.1 + i * 0.06}>
              <div className="rounded-xl border bg-card p-5 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-semibold text-sm">{sub.name}</h3>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {sub.attended}/{sub.total} classes
                    </p>
                  </div>
                  <StatusBadge status={status} />
                </div>

                <div className="flex items-end gap-2 mb-3">
                  <span className="text-2xl font-bold">{pct}%</span>
                  <TrendIcon
                    className={cn(
                      "h-4 w-4 mb-1",
                      status === "safe" ? "text-safe" : status === "warning" ? "text-warning" : "text-critical"
                    )}
                  />
                </div>

                <AttendanceProgress percentage={pct} status={status} />

                <p className="text-xs text-muted-foreground mt-3 leading-relaxed">💡 {suggestion}</p>
              </div>
            </ScrollReveal>
          );
        })}
      </div>
    </AppLayout>
  );
}
