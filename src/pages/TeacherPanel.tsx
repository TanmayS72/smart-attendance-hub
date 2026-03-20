import { teacherStudents, getStatus } from "@/lib/data";
import { StatusBadge } from "@/components/StatusBadge";
import { ScrollReveal } from "@/components/ScrollReveal";
import { AppLayout } from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Users, AlertTriangle, ShieldCheck, ShieldAlert, Send } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export default function TeacherPanel() {
  const safeCount = teacherStudents.filter((s) => s.status === "safe").length;
  const warnCount = teacherStudents.filter((s) => s.status === "warning").length;
  const critCount = teacherStudents.filter((s) => s.status === "critical").length;

  return (
    <AppLayout>
      <ScrollReveal>
        <div className="mb-8">
          <h1 className="text-2xl font-bold tracking-tight mb-1">Teacher Panel</h1>
          <p className="text-sm text-muted-foreground">Monitor student attendance across subjects</p>
        </div>
      </ScrollReveal>

      {/* Summary */}
      <ScrollReveal delay={0.1}>
        <div className="grid gap-4 grid-cols-3 mb-8">
          {[
            { label: "Safe", count: safeCount, icon: ShieldCheck, color: "text-safe", bg: "bg-safe-bg" },
            { label: "Warning", count: warnCount, icon: AlertTriangle, color: "text-warning", bg: "bg-warning-bg" },
            { label: "Critical", count: critCount, icon: ShieldAlert, color: "text-critical", bg: "bg-critical-bg" },
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

      {/* Table */}
      <ScrollReveal delay={0.2}>
        <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
          <div className="grid grid-cols-[1fr_1fr_auto_auto_auto] gap-4 px-5 py-3 bg-secondary text-xs font-medium text-muted-foreground">
            <span>Student</span>
            <span>Subject</span>
            <span>Attendance</span>
            <span>Status</span>
            <span>Action</span>
          </div>
          {teacherStudents.map((s) => (
            <div
              key={s.name + s.subject}
              className="grid grid-cols-[1fr_1fr_auto_auto_auto] gap-4 items-center px-5 py-3 border-t text-sm"
            >
              <span className="font-medium flex items-center gap-2">
                <Users className="h-4 w-4 text-muted-foreground" />
                {s.name}
              </span>
              <span className="text-muted-foreground">{s.subject}</span>
              <span className="font-semibold tabular-nums">{s.attendance}%</span>
              <StatusBadge status={s.status} />
              <Button
                size="sm"
                variant={s.status === "critical" ? "destructive" : "outline"}
                className="gap-1.5 text-xs"
                onClick={() => toast.success(`Warning sent to ${s.name}`)}
              >
                <Send className="h-3 w-3" />
                Warn
              </Button>
            </div>
          ))}
        </div>
      </ScrollReveal>
    </AppLayout>
  );
}
