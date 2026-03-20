import { useAttendance, getPercentage, getStatus, getSuggestion } from "@/hooks/useAttendance";
import { StatusBadge } from "@/components/StatusBadge";
import { AttendanceProgress } from "@/components/AttendanceProgress";
import { ScrollReveal } from "@/components/ScrollReveal";
import { AppLayout } from "@/components/AppLayout";
import { Skeleton } from "@/components/ui/skeleton";
import { Target } from "lucide-react";

export default function Planner() {
  const { subjects, isLoading, error } = useAttendance();

  return (
    <AppLayout>
      <ScrollReveal>
        <div className="mb-8">
          <h1 className="text-2xl font-bold tracking-tight mb-1">Attendance Planner</h1>
          <p className="text-sm text-muted-foreground">Plan ahead to stay above the 75% threshold</p>
        </div>
      </ScrollReveal>

      {error && (
        <div className="rounded-xl border border-critical/30 bg-critical/5 p-4 mb-4 text-sm text-critical">
          Failed to load data. Please refresh.
        </div>
      )}

      <div className="space-y-4">
        {isLoading
          ? Array.from({ length: 6 }).map((_, i) => (
              <ScrollReveal key={i} delay={0.05 + i * 0.06}>
                <div className="rounded-xl border bg-card p-5 shadow-sm">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                    <div className="flex-1 min-w-0 space-y-3">
                      <div className="flex items-center gap-3">
                        <Skeleton className="h-4 w-40" />
                        <Skeleton className="h-5 w-16 rounded-full" />
                      </div>
                      <div className="flex gap-4">
                        <Skeleton className="h-3 w-24" />
                        <Skeleton className="h-3 w-24" />
                      </div>
                      <Skeleton className="h-2 w-full rounded-full" />
                    </div>
                    <Skeleton className="h-16 w-48 rounded-lg" />
                  </div>
                </div>
              </ScrollReveal>
            ))
          : subjects.length === 0
          ? (
              <div className="rounded-xl border bg-card p-8 text-center shadow-sm">
                <p className="text-sm text-muted-foreground">No subjects found yet. Your planner will populate once data is available.</p>
              </div>
            )
          : subjects.map((sub, i) => {
              const pct = getPercentage(sub.attended, sub.total);
              const status = getStatus(pct);
              const suggestion = getSuggestion(sub.attended, sub.total);

              return (
                <ScrollReveal key={sub.id} delay={0.05 + i * 0.06}>
                  <div className="rounded-xl border bg-card p-5 shadow-sm">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="font-semibold">{sub.name}</h3>
                          <StatusBadge status={status} />
                        </div>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
                          <span>Current: <strong className="text-foreground">{pct}%</strong></span>
                          <span className="flex items-center gap-1">
                            <Target className="h-3.5 w-3.5" /> Required: <strong className="text-foreground">75%</strong>
                          </span>
                          <span>{sub.attended}/{sub.total} classes</span>
                        </div>
                        <AttendanceProgress percentage={pct} status={status} />
                      </div>
                      <div className="sm:text-right shrink-0">
                        <div className="rounded-lg bg-secondary px-4 py-3">
                          <p className="text-xs text-muted-foreground mb-0.5">Smart Suggestion</p>
                          <p className="text-sm font-medium">💡 {suggestion}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </ScrollReveal>
              );
            })}
      </div>
    </AppLayout>
  );
}
