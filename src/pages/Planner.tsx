import { subjects, getPercentage, getStatus, getSuggestion } from "@/lib/data";
import { StatusBadge } from "@/components/StatusBadge";
import { AttendanceProgress } from "@/components/AttendanceProgress";
import { ScrollReveal } from "@/components/ScrollReveal";
import { AppLayout } from "@/components/AppLayout";
import { Target } from "lucide-react";

export default function Planner() {
  return (
    <AppLayout>
      <ScrollReveal>
        <div className="mb-8">
          <h1 className="text-2xl font-bold tracking-tight mb-1">Attendance Planner</h1>
          <p className="text-sm text-muted-foreground">Plan ahead to stay above the 75% threshold</p>
        </div>
      </ScrollReveal>

      <div className="space-y-4">
        {subjects.map((sub, i) => {
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
