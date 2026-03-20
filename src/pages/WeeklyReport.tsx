import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useAttendance, getPercentage, getStatus } from "@/hooks/useAttendance";
import { StatusBadge } from "@/components/StatusBadge";
import { ScrollReveal } from "@/components/ScrollReveal";
import { AppLayout } from "@/components/AppLayout";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

interface DailyBreakdown {
  day: string;
  date: string;
  attended: number;
  missed: number;
}

function useDailyWeeklyData(): { data: DailyBreakdown[]; isLoading: boolean } {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["weekly-report", user?.id],
    enabled: !!user,
    queryFn: async (): Promise<DailyBreakdown[]> => {
      // Get last 7 days
      const today = new Date();
      const days: DailyBreakdown[] = [];

      for (let i = 6; i >= 0; i--) {
        const d = new Date(today);
        d.setDate(today.getDate() - i);
        const dateStr = d.toISOString().slice(0, 10);
        const dayName = d.toLocaleDateString("en-US", { weekday: "long" });

        const { data: rows } = await supabase
          .from("attendance")
          .select("status")
          .eq("student_id", user!.id)
          .eq("date", dateStr);

        const attended = (rows ?? []).filter((r) => r.status === "present" || r.status === "late").length;
        const missed = (rows ?? []).filter((r) => r.status === "absent").length;

        if (attended + missed > 0) {
          days.push({ day: dayName, date: dateStr, attended, missed });
        }
      }
      return days;
    },
    staleTime: 1000 * 60,
  }) as { data: DailyBreakdown[]; isLoading: boolean };
}

export default function WeeklyReport() {
  const { data: weeklyData = [], isLoading: weeklyLoading } = useDailyWeeklyData();
  const { subjects, isLoading: subjectsLoading } = useAttendance();

  const isLoading = weeklyLoading || subjectsLoading;
  const totalAttended = weeklyData.reduce((s, d) => s + d.attended, 0);
  const totalMissed = weeklyData.reduce((s, d) => s + d.missed, 0);
  const worstDay = weeklyData.length > 0
    ? weeklyData.reduce((a, b) => (b.missed > a.missed ? b : a))
    : null;

  return (
    <AppLayout>
      <ScrollReveal>
        <div className="mb-8">
          <h1 className="text-2xl font-bold tracking-tight mb-1">Weekly Report</h1>
          <p className="text-sm text-muted-foreground">Your attendance summary for this week</p>
        </div>
      </ScrollReveal>

      {/* Summary cards */}
      <ScrollReveal delay={0.1}>
        <div className="grid gap-4 grid-cols-2 lg:grid-cols-4 mb-8">
          {isLoading
            ? Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="rounded-xl border bg-card p-4 shadow-sm space-y-2">
                  <Skeleton className="h-3 w-16" />
                  <Skeleton className="h-7 w-10" />
                </div>
              ))
            : [
                { label: "Attended", value: totalAttended, color: "text-safe" },
                { label: "Missed", value: totalMissed, color: "text-critical" },
                { label: "Total", value: totalAttended + totalMissed, color: "text-foreground" },
                { label: "Worst Day", value: worstDay?.day ?? "N/A", color: "text-warning" },
              ].map((item) => (
                <div key={item.label} className="rounded-xl border bg-card p-4 shadow-sm">
                  <p className="text-xs text-muted-foreground mb-1">{item.label}</p>
                  <p className={cn("text-2xl font-bold", item.color)}>{item.value}</p>
                </div>
              ))}
        </div>
      </ScrollReveal>

      {/* Daily breakdown */}
      <ScrollReveal delay={0.2}>
        <h2 className="text-lg font-semibold mb-4">Daily Breakdown (Last 7 Days)</h2>
        <div className="rounded-xl border bg-card overflow-hidden shadow-sm mb-8">
          <div className="grid grid-cols-3 gap-4 px-5 py-3 bg-secondary text-xs font-medium text-muted-foreground">
            <span>Day</span>
            <span>Attended</span>
            <span>Missed</span>
          </div>
          {isLoading ? (
            Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="grid grid-cols-3 gap-4 px-5 py-3 border-t text-sm">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-8" />
                <Skeleton className="h-4 w-8" />
              </div>
            ))
          ) : weeklyData.length === 0 ? (
            <div className="px-5 py-8 text-center text-sm text-muted-foreground">
              No attendance records for the past 7 days.
            </div>
          ) : (
            weeklyData.map((d) => (
              <div key={d.date} className="grid grid-cols-3 gap-4 px-5 py-3 border-t text-sm">
                <span className="font-medium">{d.day}</span>
                <span className="text-safe font-semibold">{d.attended}</span>
                <span className={cn("font-semibold", d.missed > 0 ? "text-critical" : "text-muted-foreground")}>
                  {d.missed}
                </span>
              </div>
            ))
          )}
        </div>
      </ScrollReveal>

      {/* Subject status */}
      <ScrollReveal delay={0.3}>
        <h2 className="text-lg font-semibold mb-4">Subject Status</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          {isLoading
            ? Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="flex items-center justify-between rounded-xl border bg-card px-5 py-3 shadow-sm">
                  <div className="space-y-1">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-16" />
                  </div>
                  <div className="flex items-center gap-3">
                    <Skeleton className="h-6 w-12" />
                    <Skeleton className="h-5 w-16 rounded-full" />
                  </div>
                </div>
              ))
            : subjects.map((sub) => {
                const pct = getPercentage(sub.attended, sub.total);
                const status = getStatus(pct);
                return (
                  <div key={sub.id} className="flex items-center justify-between rounded-xl border bg-card px-5 py-3 shadow-sm">
                    <div>
                      <h3 className="font-medium text-sm">{sub.name}</h3>
                      <p className="text-xs text-muted-foreground">{sub.attended}/{sub.total}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-lg font-bold">{pct}%</span>
                      <StatusBadge status={status} />
                    </div>
                  </div>
                );
              })}
        </div>
      </ScrollReveal>

      {!isLoading && worstDay && (
        <ScrollReveal delay={0.4}>
          <div className="mt-8 rounded-xl border bg-card p-5 shadow-sm">
            <p className="text-sm font-medium">📊 Weekly Insight</p>
            <p className="text-sm text-muted-foreground mt-1">
              You missed the most classes on{" "}
              <strong className="text-foreground">{worstDay.day}</strong> ({worstDay.missed} missed). Try to prioritize attendance on that day next week.
            </p>
          </div>
        </ScrollReveal>
      )}
    </AppLayout>
  );
}
