import { subjects, getPercentage, getStatus, weeklyData } from "@/lib/data";
import { StatusBadge } from "@/components/StatusBadge";
import { ScrollReveal } from "@/components/ScrollReveal";
import { AppLayout } from "@/components/AppLayout";
import { cn } from "@/lib/utils";

export default function WeeklyReport() {
  const totalAttended = weeklyData.reduce((s, d) => s + d.attended, 0);
  const totalMissed = weeklyData.reduce((s, d) => s + d.missed, 0);
  const worstDay = weeklyData.reduce((a, b) => (b.missed > a.missed ? b : a));

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
          {[
            { label: "Attended", value: totalAttended, color: "text-safe" },
            { label: "Missed", value: totalMissed, color: "text-critical" },
            { label: "Total", value: totalAttended + totalMissed, color: "text-foreground" },
            { label: "Worst Day", value: worstDay.day, color: "text-warning" },
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
        <h2 className="text-lg font-semibold mb-4">Daily Breakdown</h2>
        <div className="rounded-xl border bg-card overflow-hidden shadow-sm mb-8">
          <div className="grid grid-cols-3 gap-4 px-5 py-3 bg-secondary text-xs font-medium text-muted-foreground">
            <span>Day</span>
            <span>Attended</span>
            <span>Missed</span>
          </div>
          {weeklyData.map((d) => (
            <div key={d.day} className="grid grid-cols-3 gap-4 px-5 py-3 border-t text-sm">
              <span className="font-medium">{d.day}</span>
              <span className="text-safe font-semibold">{d.attended}</span>
              <span className={cn("font-semibold", d.missed > 0 ? "text-critical" : "text-muted-foreground")}>
                {d.missed}
              </span>
            </div>
          ))}
        </div>
      </ScrollReveal>

      {/* Subject status */}
      <ScrollReveal delay={0.3}>
        <h2 className="text-lg font-semibold mb-4">Subject Status</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          {subjects.map((sub) => {
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

      <ScrollReveal delay={0.4}>
        <div className="mt-8 rounded-xl border bg-card p-5 shadow-sm">
          <p className="text-sm font-medium">📊 Weekly Insight</p>
          <p className="text-sm text-muted-foreground mt-1">
            You missed the most classes on <strong className="text-foreground">{worstDay.day}</strong> ({worstDay.missed} missed).
            Try to prioritize attendance on that day next week.
          </p>
        </div>
      </ScrollReveal>
    </AppLayout>
  );
}
