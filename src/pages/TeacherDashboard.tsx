import { useState } from "react";
import { useTeacherAttendance } from "@/hooks/useTeacherAttendance";
import { StatusBadge } from "@/components/StatusBadge";
import { AttendanceProgress } from "@/components/AttendanceProgress";
import { ScrollReveal } from "@/components/ScrollReveal";
import { AppLayout } from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Users, AlertTriangle, ShieldCheck, ShieldAlert,
  Check, X, Clock, BookOpen,
  GraduationCap, BarChart3, Search, MessageSquare, Pencil
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

// ---------- Modals ----------

interface SetClassCountModalProps {
  studentName: string;
  studentId: string;
  subjects: Array<{ subjectId: string; subjectName: string; attended: number; total: number }>;
  onSave: (subjectId: string, attended: number, total: number) => void;
  isPending: boolean;
  onClose: () => void;
}

function SetClassCountModal({ studentName, subjects, onSave, isPending, onClose }: SetClassCountModalProps) {
  const [selectedSubject, setSelectedSubject] = useState("");
  const [attended, setAttended] = useState("");
  const [total, setTotal] = useState("");

  const activeSubject = subjects.find((s) => s.subjectId === selectedSubject);

  const handleSave = () => {
    const a = parseInt(attended, 10);
    const t = parseInt(total, 10);
    if (!selectedSubject || isNaN(a) || isNaN(t)) return;
    onSave(selectedSubject, a, t);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-card rounded-2xl border shadow-xl w-full max-w-md p-6">
        <div className="flex items-center gap-3 mb-5">
          <div className="h-9 w-9 rounded-xl bg-primary/10 flex items-center justify-center">
            <Pencil className="h-4 w-4 text-primary" />
          </div>
          <div>
            <h3 className="font-semibold">Set Class Counts</h3>
            <p className="text-xs text-muted-foreground">{studentName}</p>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-1.5 block">Subject</label>
            <Select value={selectedSubject} onValueChange={(v) => {
              setSelectedSubject(v);
              const sub = subjects.find((s) => s.subjectId === v);
              if (sub) {
                setAttended(String(sub.attended));
                setTotal(String(sub.total));
              }
            }}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select a subject" />
              </SelectTrigger>
              <SelectContent>
                {subjects.map((s) => (
                  <SelectItem key={s.subjectId} value={s.subjectId}>
                    {s.subjectName} — currently {s.attended}/{s.total}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium mb-1.5 block">Classes Attended</label>
              <input
                type="number"
                min={0}
                value={attended}
                onChange={(e) => setAttended(e.target.value)}
                placeholder="e.g. 5"
                className="w-full h-10 px-3 rounded-lg border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring transition-shadow"
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1.5 block">Total Classes</label>
              <input
                type="number"
                min={0}
                value={total}
                onChange={(e) => setTotal(e.target.value)}
                placeholder="e.g. 12"
                className="w-full h-10 px-3 rounded-lg border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring transition-shadow"
              />
            </div>
          </div>

          {attended && total && parseInt(attended) <= parseInt(total) && (
            <div className="rounded-lg bg-secondary p-3 text-sm">
              <span className="font-medium">Preview: </span>
              <span className="tabular-nums">
                {attended}/{total} classes — {Math.round((parseInt(attended) / parseInt(total)) * 100)}%
              </span>
            </div>
          )}
          {attended && total && parseInt(attended) > parseInt(total) && (
            <p className="text-xs text-critical">Attended cannot exceed total classes.</p>
          )}
        </div>

        <div className="flex gap-2 mt-6">
          <Button variant="outline" className="flex-1" onClick={onClose}>Cancel</Button>
          <Button
            className="flex-1"
            onClick={handleSave}
            disabled={
              !selectedSubject ||
              !attended ||
              !total ||
              parseInt(attended) > parseInt(total) ||
              isPending
            }
          >
            {isPending ? "Saving…" : "Save Counts"}
          </Button>
        </div>
      </div>
    </div>
  );
}

interface SendMessageModalProps {
  studentName: string;
  onSend: (message: string) => void;
  isPending: boolean;
  onClose: () => void;
}

function SendMessageModal({ studentName, onSend, isPending, onClose }: SendMessageModalProps) {
  const [message, setMessage] = useState("");

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-card rounded-2xl border shadow-xl w-full max-w-md p-6">
        <div className="flex items-center gap-3 mb-5">
          <div className="h-9 w-9 rounded-xl bg-primary/10 flex items-center justify-center">
            <MessageSquare className="h-4 w-4 text-primary" />
          </div>
          <div>
            <h3 className="font-semibold">Send Message</h3>
            <p className="text-xs text-muted-foreground">To: {studentName}</p>
          </div>
        </div>

        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Type your message to the student…"
          rows={4}
          className="w-full px-3 py-2.5 rounded-lg border bg-background text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-shadow resize-none"
        />

        <div className="flex gap-2 mt-4">
          <Button variant="outline" className="flex-1" onClick={onClose}>Cancel</Button>
          <Button
            className="flex-1"
            onClick={() => onSend(message)}
            disabled={!message.trim() || isPending}
          >
            {isPending ? "Sending…" : "Send Message"}
          </Button>
        </div>
      </div>
    </div>
  );
}

// ---------- Main Page ----------

export default function TeacherDashboard() {
  const { students, isLoading, error, markAttendance, setClassCount, sendMessage } = useTeacherAttendance();
  const [selectedSubjectPerStudent, setSelectedSubjectPerStudent] = useState<Record<string, string>>({});
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<"all" | "safe" | "warning" | "critical">("all");
  const today = new Date().toISOString().slice(0, 10);

  // Modal state
  const [classCountTarget, setClassCountTarget] = useState<{ studentId: string; studentName: string } | null>(null);
  const [messageTarget, setMessageTarget] = useState<{ studentId: string; studentName: string } | null>(null);

  const safeCount = students.filter((s) => s.overallStatus === "safe").length;
  const warnCount = students.filter((s) => s.overallStatus === "warning").length;
  const critCount = students.filter((s) => s.overallStatus === "critical").length;

  const filteredStudents = students
    .filter((s) => filterStatus === "all" || s.overallStatus === filterStatus)
    .filter((s) => s.name.toLowerCase().includes(searchQuery.toLowerCase()));

  const handleMark = (studentId: string, status: "present" | "absent" | "late") => {
    const subjectId = selectedSubjectPerStudent[studentId];
    if (!subjectId) return;
    markAttendance.mutate({ studentId, subjectId, date: today, status });
  };

  // Subject-wide aggregate across all students
  const allSubjectNames = students.length > 0 ? students[0].subjects.map((s) => s.subjectName) : [];
  const subjectAvgMap = allSubjectNames.map((subName) => {
    const totals = students.map((st) => {
      const sub = st.subjects.find((s) => s.subjectName === subName);
      return sub ?? { attended: 0, total: 0, percentage: 0 };
    });
    const classTotal = totals.reduce((a, b) => a + b.total, 0);
    const classAttended = totals.reduce((a, b) => a + b.attended, 0);
    const avgPct = classTotal === 0 ? 0 : Math.round((classAttended / classTotal) * 100);
    return { name: subName, attended: classAttended, total: classTotal, avgPct };
  }).filter((s) => s.total > 0);

  const classCountStudent = classCountTarget
    ? students.find((s) => s.studentId === classCountTarget.studentId)
    : null;

  const messageStudent = messageTarget
    ? students.find((s) => s.studentId === messageTarget.studentId)
    : null;

  return (
    <AppLayout>
      {/* Modals */}
      {classCountTarget && classCountStudent && (
        <SetClassCountModal
          studentId={classCountTarget.studentId}
          studentName={classCountTarget.studentName}
          subjects={classCountStudent.subjects}
          isPending={setClassCount.isPending}
          onSave={(subjectId, attended, total) => {
            setClassCount.mutate(
              { studentId: classCountTarget.studentId, subjectId, attended, total },
              { onSuccess: () => setClassCountTarget(null) }
            );
          }}
          onClose={() => setClassCountTarget(null)}
        />
      )}
      {messageTarget && messageStudent && (
        <SendMessageModal
          studentName={messageTarget.studentName}
          isPending={sendMessage.isPending}
          onSend={(msg) => {
            sendMessage.mutate(
              { studentId: messageTarget.studentId, message: msg },
              { onSuccess: () => setMessageTarget(null) }
            );
          }}
          onClose={() => setMessageTarget(null)}
        />
      )}

      {/* Header */}
      <ScrollReveal>
        <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <div className="h-9 w-9 rounded-xl bg-primary/10 flex items-center justify-center">
                <GraduationCap className="h-5 w-5 text-primary" />
              </div>
              <h1 className="text-2xl font-bold tracking-tight">Teacher Dashboard</h1>
            </div>
            <p className="text-sm text-muted-foreground">
              {today} · {students.length} students enrolled
            </p>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary/10 border border-primary/20">
            <BarChart3 className="h-4 w-4 text-primary" />
            <span className="text-sm font-semibold text-primary">
              Class Avg:{" "}
              {students.length === 0
                ? "—"
                : `${Math.round(students.reduce((a, s) => a + s.overallPercentage, 0) / students.length)}%`}
            </span>
          </div>
        </div>
      </ScrollReveal>

      {/* Stats Row */}
      <ScrollReveal delay={0.08}>
        <div className="grid gap-4 grid-cols-2 lg:grid-cols-4 mb-8">
          {isLoading
            ? Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="rounded-xl border bg-card p-5 shadow-sm flex items-center gap-4">
                  <Skeleton className="h-12 w-12 rounded-xl" />
                  <div className="space-y-2">
                    <Skeleton className="h-6 w-8" />
                    <Skeleton className="h-3 w-20" />
                  </div>
                </div>
              ))
            : [
                { label: "Total Students", count: students.length, icon: Users, color: "text-primary", bg: "bg-primary/10" },
                { label: "Safe", count: safeCount, icon: ShieldCheck, color: "text-safe", bg: "bg-safe/10" },
                { label: "At Risk", count: warnCount, icon: AlertTriangle, color: "text-warning", bg: "bg-warning/10" },
                { label: "Critical", count: critCount, icon: ShieldAlert, color: "text-critical", bg: "bg-critical/10" },
              ].map((item) => (
                <div key={item.label} className="rounded-xl border bg-card p-5 shadow-sm flex items-center gap-4 hover:shadow-md transition-shadow">
                  <div className={cn("h-12 w-12 rounded-xl flex items-center justify-center shrink-0", item.bg)}>
                    <item.icon className={cn("h-6 w-6", item.color)} />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{item.count}</p>
                    <p className="text-xs text-muted-foreground">{item.label}</p>
                  </div>
                </div>
              ))}
        </div>
      </ScrollReveal>

      {/* Subject Avg Overview */}
      {!isLoading && subjectAvgMap.length > 0 && (
        <ScrollReveal delay={0.12}>
          <div className="mb-8">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-primary" />
              Subject-wise Class Average
            </h2>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {subjectAvgMap.map((sub) => {
                const status = sub.avgPct >= 85 ? "safe" : sub.avgPct >= 75 ? "warning" : "critical";
                return (
                  <div key={sub.name} className="rounded-xl border bg-card p-4 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between mb-2">
                      <p className="text-sm font-semibold leading-tight">{sub.name}</p>
                      <StatusBadge status={status} />
                    </div>
                    <div className="flex items-baseline gap-2 mb-2">
                      <span className="text-xl font-bold">{sub.avgPct}%</span>
                      <span className="text-xs text-muted-foreground">{sub.attended}/{sub.total} classes</span>
                    </div>
                    <AttendanceProgress percentage={sub.avgPct} status={status} />
                  </div>
                );
              })}
            </div>
          </div>
        </ScrollReveal>
      )}

      {/* Students List with Actions */}
      <ScrollReveal delay={0.18}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            Students — Mark &amp; Manage
          </h2>
          <div className="flex gap-2 flex-wrap">
            {(["all", "safe", "warning", "critical"] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilterStatus(f)}
                className={cn(
                  "px-3 py-1 rounded-lg text-xs font-medium transition-colors capitalize",
                  filterStatus === f
                    ? "bg-primary text-primary-foreground"
                    : "bg-secondary text-muted-foreground hover:text-foreground"
                )}
              >
                {f === "all" ? "All" : f.charAt(0).toUpperCase() + f.slice(1)}
              </button>
            ))}
          </div>
        </div>

        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search students…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 h-10 rounded-lg border bg-background text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-shadow"
          />
        </div>
      </ScrollReveal>

      {isLoading ? (
        <ScrollReveal delay={0.22}>
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-24 w-full rounded-xl" />
            ))}
          </div>
        </ScrollReveal>
      ) : error ? (
        <p className="text-sm text-critical">Failed to load student data: {error.message}</p>
      ) : students.length === 0 ? (
        <div className="rounded-xl border bg-card p-10 text-center shadow-sm">
          <Users className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
          <p className="text-sm font-medium text-muted-foreground">No students enrolled yet.</p>
        </div>
      ) : (
        <ScrollReveal delay={0.22}>
          <div className="space-y-3 mb-8">
            {filteredStudents.map((s) => {
              const selectedSubject = selectedSubjectPerStudent[s.studentId];
              return (
                <div
                  key={s.studentId}
                  className="rounded-xl border bg-card p-4 shadow-sm hover:shadow-md transition-shadow"
                >
                  {/* Top row: student info + action buttons */}
                  <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                    {/* Avatar + info */}
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                        <span className="text-sm font-bold text-primary">
                          {s.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold truncate">{s.name}</p>
                        <div className="flex items-center gap-2 flex-wrap mt-0.5">
                          <StatusBadge status={s.overallStatus} />
                          <span className="text-xs text-muted-foreground">
                            {s.overallPercentage}% ·{" "}
                            {s.subjects.reduce((a, b) => a + b.attended, 0)}/
                            {s.subjects.reduce((a, b) => a + b.total, 0)} classes
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Quick action buttons: Set Count, Message */}
                    <div className="flex gap-2 shrink-0">
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-8 gap-1.5 text-xs"
                        onClick={() => setClassCountTarget({ studentId: s.studentId, studentName: s.name })}
                      >
                        <Pencil className="h-3.5 w-3.5" />
                        Set Classes
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-8 gap-1.5 text-xs border-primary/30 text-primary hover:bg-primary/10"
                        onClick={() => setMessageTarget({ studentId: s.studentId, studentName: s.name })}
                      >
                        <MessageSquare className="h-3.5 w-3.5" />
                        Message
                      </Button>
                    </div>
                  </div>

                  {/* Mark Attendance Row */}
                  <div className="mt-3 pt-3 border-t flex flex-wrap gap-2 items-center">
                    <Select
                      value={selectedSubject ?? ""}
                      onValueChange={(val) =>
                        setSelectedSubjectPerStudent((prev) => ({ ...prev, [s.studentId]: val }))
                      }
                    >
                      <SelectTrigger className="h-8 text-xs w-44 shrink-0">
                        <SelectValue placeholder="Pick subject to mark" />
                      </SelectTrigger>
                      <SelectContent>
                        {s.subjects.map((sub) => (
                          <SelectItem key={sub.subjectId} value={sub.subjectId}>
                            {sub.subjectName} ({sub.attended}/{sub.total})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button
                      size="sm"
                      className="h-8 gap-1 text-xs bg-safe hover:bg-safe/90 text-white"
                      disabled={!selectedSubject || markAttendance.isPending}
                      onClick={() => handleMark(s.studentId, "present")}
                    >
                      <Check className="h-3.5 w-3.5" /> Present
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-8 gap-1 text-xs border-warning/40 text-warning hover:bg-warning/10"
                      disabled={!selectedSubject || markAttendance.isPending}
                      onClick={() => handleMark(s.studentId, "late")}
                    >
                      <Clock className="h-3.5 w-3.5" /> Late
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-8 gap-1 text-xs border-critical/40 text-critical hover:bg-critical/10"
                      disabled={!selectedSubject || markAttendance.isPending}
                      onClick={() => handleMark(s.studentId, "absent")}
                    >
                      <X className="h-3.5 w-3.5" /> Absent
                    </Button>
                  </div>

                  {/* Subject breakdown */}
                  {s.subjects.filter((sub) => sub.total > 0).length > 0 && (
                    <div className="mt-3 pt-2 border-t">
                      <div className="grid grid-cols-[2fr_auto_auto_auto] gap-2 text-[10px] font-medium text-muted-foreground px-1 mb-1">
                        <span>Subject</span>
                        <span className="text-right">Classes</span>
                        <span className="text-right">%</span>
                        <span>Status</span>
                      </div>
                      {s.subjects
                        .filter((sub) => sub.total > 0)
                        .map((sub) => (
                          <div
                            key={sub.subjectId}
                            className="grid grid-cols-[2fr_auto_auto_auto] gap-2 items-center text-xs px-1 py-0.5 rounded hover:bg-secondary/50 transition-colors"
                          >
                            <span className="truncate text-muted-foreground">{sub.subjectName}</span>
                            <span className="tabular-nums font-medium text-right">{sub.attended}/{sub.total}</span>
                            <span className="tabular-nums font-semibold text-right">{sub.percentage}%</span>
                            <StatusBadge status={sub.status} />
                          </div>
                        ))}
                    </div>
                  )}
                </div>
              );
            })}
            {filteredStudents.length === 0 && (
              <div className="rounded-xl border bg-card p-8 text-center text-sm text-muted-foreground">
                No students match your filter.
              </div>
            )}
          </div>
        </ScrollReveal>
      )}
    </AppLayout>
  );
}
