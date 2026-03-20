import { useState } from "react";
import { useTeacherAttendance } from "@/hooks/useTeacherAttendance";
import { StatusBadge } from "@/components/StatusBadge";
import { ScrollReveal } from "@/components/ScrollReveal";
import { AppLayout } from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Users, AlertTriangle, ShieldCheck, ShieldAlert, Check, X, Clock, Loader2 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

export default function TeacherPanel() {
  const { students, isLoading, error, markAttendance } = useTeacherAttendance();
  const [selectedSubjectPerStudent, setSelectedSubjectPerStudent] = useState<Record<string, string>>({});
  const today = new Date().toISOString().slice(0, 10);

  const safeCount = students.filter((s) => s.overallStatus === "safe").length;
  const warnCount = students.filter((s) => s.overallStatus === "warning").length;
  const critCount = students.filter((s) => s.overallStatus === "critical").length;

  const handleMark = (studentId: string, status: "present" | "absent" | "late") => {
    const subjectId = selectedSubjectPerStudent[studentId];
    if (!subjectId) return;
    markAttendance.mutate({ studentId, subjectId, date: today, status });
  };

  return (
    <AppLayout>
      <ScrollReveal>
        <div className="mb-8">
          <h1 className="text-2xl font-bold tracking-tight mb-1">Teacher Panel</h1>
          <p className="text-sm text-muted-foreground">Monitor and mark student attendance across subjects</p>
        </div>
      </ScrollReveal>

      {/* Summary */}
      <ScrollReveal delay={0.1}>
        <div className="grid gap-4 grid-cols-3 mb-8">
          {isLoading
            ? Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="rounded-xl border bg-card p-5 shadow-sm flex items-center gap-4">
                  <Skeleton className="h-12 w-12 rounded-xl" />
                  <div className="space-y-2">
                    <Skeleton className="h-6 w-8" />
                    <Skeleton className="h-3 w-20" />
                  </div>
                </div>
              ))
            : [
                { label: "Safe", count: safeCount, icon: ShieldCheck, color: "text-safe", bg: "bg-safe/10" },
                { label: "Warning", count: warnCount, icon: AlertTriangle, color: "text-warning", bg: "bg-warning/10" },
                { label: "Critical", count: critCount, icon: ShieldAlert, color: "text-critical", bg: "bg-critical/10" },
              ].map((item) => (
                <div key={item.label} className="rounded-xl border bg-card p-5 shadow-sm flex items-center gap-4">
                  <div className={cn("h-12 w-12 rounded-xl flex items-center justify-center", item.bg)}>
                    <item.icon className={cn("h-6 w-6", item.color)} />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{item.count}</p>
                    <p className="text-xs text-muted-foreground">{item.label} Students</p>
                  </div>
                </div>
              ))}
        </div>
      </ScrollReveal>

      {/* Mark Attendance Today */}
      <ScrollReveal delay={0.15}>
        <h2 className="text-lg font-semibold mb-4">Mark Attendance — Today ({today})</h2>
      </ScrollReveal>

      {isLoading ? (
        <ScrollReveal delay={0.2}>
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-16 w-full rounded-xl" />
            ))}
          </div>
        </ScrollReveal>
      ) : error ? (
        <p className="text-sm text-critical">Failed to load student data: {error.message}</p>
      ) : students.length === 0 ? (
        <div className="rounded-xl border bg-card p-8 text-center shadow-sm">
          <p className="text-sm text-muted-foreground">No students found. Students will appear here once they sign up.</p>
        </div>
      ) : (
        <ScrollReveal delay={0.2}>
          <div className="rounded-xl border bg-card shadow-sm overflow-hidden mb-8">
            <div className="grid grid-cols-[1fr_1fr_auto_auto_auto_auto] gap-3 px-5 py-3 bg-secondary text-xs font-medium text-muted-foreground">
              <span>Student</span>
              <span>Subject</span>
              <span>Overall</span>
              <span>Status</span>
              <span className="col-span-3">Mark Today</span>
            </div>
            {students.map((s) => {
              const selectedSubject = selectedSubjectPerStudent[s.studentId];
              return (
                <div
                  key={s.studentId}
                  className="grid grid-cols-[1fr_1fr_auto_auto_auto_auto] gap-3 items-center px-5 py-3 border-t text-sm"
                >
                  <span className="font-medium flex items-center gap-2">
                    <Users className="h-4 w-4 text-muted-foreground shrink-0" />
                    {s.name}
                  </span>
                  <Select
                    value={selectedSubject ?? ""}
                    onValueChange={(val) =>
                      setSelectedSubjectPerStudent((prev) => ({ ...prev, [s.studentId]: val }))
                    }
                  >
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue placeholder="Select subject" />
                    </SelectTrigger>
                    <SelectContent>
                      {s.subjects.map((sub) => (
                        <SelectItem key={sub.subjectId} value={sub.subjectId}>
                          {sub.subjectName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <span className="font-semibold tabular-nums">{s.overallPercentage}%</span>
                  <StatusBadge status={s.overallStatus} />
                  <Button
                    size="sm"
                    variant="outline"
                    className="gap-1 text-xs text-safe border-safe/30 hover:bg-safe/10"
                    disabled={!selectedSubject || markAttendance.isPending}
                    onClick={() => handleMark(s.studentId, "present")}
                  >
                    <Check className="h-3 w-3" />
                    Present
                  </Button>
                  <div className="flex gap-1">
                    <Button
                      size="sm"
                      variant="outline"
                      className="gap-1 text-xs text-warning border-warning/30 hover:bg-warning/10"
                      disabled={!selectedSubject || markAttendance.isPending}
                      onClick={() => handleMark(s.studentId, "late")}
                    >
                      <Clock className="h-3 w-3" />
                      Late
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="gap-1 text-xs text-critical border-critical/30 hover:bg-critical/10"
                      disabled={!selectedSubject || markAttendance.isPending}
                      onClick={() => handleMark(s.studentId, "absent")}
                    >
                      <X className="h-3 w-3" />
                      Absent
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </ScrollReveal>
      )}

      {/* Per-student subject breakdown */}
      {!isLoading && students.length > 0 && (
        <ScrollReveal delay={0.3}>
          <h2 className="text-lg font-semibold mb-4">Student Subject Breakdown</h2>
          <div className="space-y-4">
            {students.map((s) => (
              <div key={s.studentId + "-detail"} className="rounded-xl border bg-card shadow-sm overflow-hidden">
                <div className="flex items-center gap-3 px-5 py-3 bg-secondary">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <span className="font-semibold text-sm">{s.name}</span>
                  <StatusBadge status={s.overallStatus} />
                  <span className="ml-auto text-sm font-bold tabular-nums">{s.overallPercentage}% overall</span>
                </div>
                <div className="grid grid-cols-[2fr_1fr_1fr_auto] gap-3 px-5 py-2 text-xs font-medium text-muted-foreground border-b">
                  <span>Subject</span>
                  <span>Classes</span>
                  <span>%</span>
                  <span>Status</span>
                </div>
                {s.subjects
                  .filter((sub) => sub.total > 0)
                  .map((sub) => (
                    <div key={sub.subjectId} className="grid grid-cols-[2fr_1fr_1fr_auto] gap-3 items-center px-5 py-2 border-t text-sm">
                      <span className="text-sm">{sub.subjectName}</span>
                      <span className="text-muted-foreground">{sub.attended}/{sub.total}</span>
                      <span className="font-semibold tabular-nums">{sub.percentage}%</span>
                      <StatusBadge status={sub.status} />
                    </div>
                  ))}
                {s.subjects.every((sub) => sub.total === 0) && (
                  <div className="px-5 py-4 text-xs text-muted-foreground text-center">No attendance records yet.</div>
                )}
              </div>
            ))}
          </div>
        </ScrollReveal>
      )}
    </AppLayout>
  );
}
