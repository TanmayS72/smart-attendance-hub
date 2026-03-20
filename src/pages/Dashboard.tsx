import { useState } from "react";
import { useAttendance, getPercentage, getStatus, getSuggestion } from "@/hooks/useAttendance";
import { StatusBadge } from "@/components/StatusBadge";
import { AttendanceProgress } from "@/components/AttendanceProgress";
import { ScrollReveal } from "@/components/ScrollReveal";
import { AppLayout } from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { TrendingUp, TrendingDown, Minus, CheckCheck, X, Clock, FlaskConical } from "lucide-react";
import { cn } from "@/lib/utils";

const statusRingColors = {
  safe: "ring-safe/20",
  warning: "ring-warning/20",
  critical: "ring-critical/20",
};

function SubjectSkeleton() {
  return (
    <div className="rounded-xl border bg-card p-5 shadow-sm space-y-3">
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-3 w-20" />
        </div>
        <Skeleton className="h-5 w-16 rounded-full" />
      </div>
      <Skeleton className="h-7 w-16" />
      <Skeleton className="h-2 w-full rounded-full" />
      <Skeleton className="h-3 w-48" />
    </div>
  );
}

export default function Dashboard() {
  const { subjects, overall, totalAttended, totalClasses, overallStatus, isLoading, error, markSelfAttendance } = useAttendance();
  const [selectedSubject, setSelectedSubject] = useState<string>("");
  const today = new Date().toISOString().slice(0, 10);

  const handleMark = (status: "present" | "absent" | "late") => {
    if (!selectedSubject) return;
    markSelfAttendance.mutate({ subjectId: selectedSubject, date: today, status });
  };

  return (
    <AppLayout>
      <ScrollReveal>
        <div className="mb-8">
          <h1 className="text-2xl font-bold tracking-tight mb-1">Dashboard</h1>
          <p className="text-sm text-muted-foreground">Track your attendance at a glance</p>
        </div>
      </ScrollReveal>

      {/* Demo Attendance Marker */}
      <ScrollReveal delay={0.05}>
        <div className="rounded-2xl border border-dashed border-primary/40 bg-primary/5 p-5 mb-8">
          <div className="flex items-center gap-2 mb-4">
            <div className="h-7 w-7 rounded-lg bg-primary/10 flex items-center justify-center">
              <FlaskConical className="h-4 w-4 text-primary" />
            </div>
            <div>
              <p className="text-sm font-semibold">Demo Attendance Marker</p>
              <p className="text-xs text-muted-foreground">Manually mark your attendance to see the dashboard update live</p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <Select value={selectedSubject} onValueChange={setSelectedSubject}>
              <SelectTrigger className="flex-1 bg-background">
                <SelectValue placeholder="Select a subject…" />
              </SelectTrigger>
              <SelectContent>
                {subjects.map((sub) => (
                  <SelectItem key={sub.id} value={sub.id}>
                    {sub.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <div className="flex gap-2 shrink-0">
              <Button
                className="flex-1 sm:flex-none gap-1.5 bg-safe hover:bg-safe/90 text-white"
                disabled={!selectedSubject || markSelfAttendance.isPending}
                onClick={() => handleMark("present")}
              >
                <CheckCheck className="h-4 w-4" />
                Present
              </Button>
              <Button
                variant="outline"
                className="flex-1 sm:flex-none gap-1.5 border-warning/40 text-warning hover:bg-warning/10"
                disabled={!selectedSubject || markSelfAttendance.isPending}
                onClick={() => handleMark("late")}
              >
                <Clock className="h-4 w-4" />
                Late
              </Button>
              <Button
                variant="outline"
                className="flex-1 sm:flex-none gap-1.5 border-critical/40 text-critical hover:bg-critical/10"
                disabled={!selectedSubject || markSelfAttendance.isPending}
                onClick={() => handleMark("absent")}
              >
                <X className="h-4 w-4" />
                Absent
              </Button>
            </div>
          </div>
          <p className="text-[11px] text-muted-foreground mt-3">
            📅 Marking for today: <strong>{today}</strong>. Each subject can only be marked once per day (re-marking updates the existing record).
          </p>
        </div>
      </ScrollReveal>

      {/* Overall card */}
      <ScrollReveal delay={0.1}>
        <div className="rounded-2xl border bg-card p-6 shadow-sm mb-8">
          {isLoading ? (
            <div className="flex items-center gap-6">
              <Skeleton className="h-28 w-28 rounded-full shrink-0" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-5 w-40" />
                <Skeleton className="h-4 w-64" />
                <Skeleton className="h-2 w-full rounded-full" />
              </div>
            </div>
          ) : error ? (
            <p className="text-sm text-critical">Failed to load attendance data. Please try again.</p>
          ) : subjects.length === 0 ? (
            <div className="text-center py-6">
              <p className="text-sm text-muted-foreground">No attendance records found yet.</p>
              <p className="text-xs text-muted-foreground mt-1">Use the demo marker above to add some attendance data!</p>
            </div>
          ) : (
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
                <div className="flex items-center gap-3 mb-1">
                  <h2 className="text-lg font-semibold">Overall Attendance</h2>
                  <StatusBadge status={overallStatus} />
                </div>
                <p className="text-sm text-muted-foreground font-medium mb-1">
                  {totalAttended}/{totalClasses} classes attended
                </p>
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
          )}
        </div>
      </ScrollReveal>

      {/* Subject grid */}
      <ScrollReveal delay={0.2}>
        <h2 className="text-lg font-semibold mb-4">Subject-wise Attendance</h2>
      </ScrollReveal>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {isLoading
          ? Array.from({ length: 6 }).map((_, i) => (
              <ScrollReveal key={i} delay={0.1 + i * 0.06}>
                <SubjectSkeleton />
              </ScrollReveal>
            ))
          : subjects.map((sub, i) => {
              const pct = getPercentage(sub.attended, sub.total);
              const status = getStatus(pct);
              const suggestion = getSuggestion(sub.attended, sub.total);
              const TrendIcon = pct >= 85 ? TrendingUp : pct >= 75 ? Minus : TrendingDown;

              return (
                <ScrollReveal key={sub.id} delay={0.1 + i * 0.06}>
                  <div className="rounded-xl border bg-card p-5 shadow-sm hover:shadow-md transition-shadow group">
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

                    {/* Quick mark buttons on hover */}
                    <div className="mt-3 pt-3 border-t flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button
                        size="sm"
                        className="flex-1 h-7 text-xs bg-safe hover:bg-safe/90 text-white"
                        disabled={markSelfAttendance.isPending}
                        onClick={() => markSelfAttendance.mutate({ subjectId: sub.id, date: today, status: "present" })}
                      >
                        ✅ Present
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1 h-7 text-xs border-warning/40 text-warning hover:bg-warning/10"
                        disabled={markSelfAttendance.isPending}
                        onClick={() => markSelfAttendance.mutate({ subjectId: sub.id, date: today, status: "late" })}
                      >
                        🕐 Late
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1 h-7 text-xs border-critical/40 text-critical hover:bg-critical/10"
                        disabled={markSelfAttendance.isPending}
                        onClick={() => markSelfAttendance.mutate({ subjectId: sub.id, date: today, status: "absent" })}
                      >
                        ❌ Absent
                      </Button>
                    </div>
                  </div>
                </ScrollReveal>
              );
            })}
      </div>
    </AppLayout>
  );
}
