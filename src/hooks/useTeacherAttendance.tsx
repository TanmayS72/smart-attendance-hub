import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { getPercentage, getStatus, type Status } from "@/lib/data";
import { toast } from "sonner";

export interface StudentAttendanceSummary {
  studentId: string;
  name: string;
  subjects: Array<{
    subjectId: string;
    subjectName: string;
    attended: number;
    total: number;
    percentage: number;
    status: Status;
  }>;
  overallPercentage: number;
  overallStatus: Status;
}

export function useTeacherAttendance() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: students = [], isLoading, error } = useQuery({
    queryKey: ["teacher-attendance"],
    enabled: !!user,
    queryFn: async (): Promise<StudentAttendanceSummary[]> => {
      const { data: subjectRows, error: subErr } = await supabase
        .from("subjects")
        .select("id, name, code")
        .order("name");
      if (subErr) throw subErr;

      const { data: studentRoles, error: rolesErr } = await supabase
        .from("user_roles")
        .select("user_id")
        .eq("role", "student");
      if (rolesErr) throw rolesErr;

      const studentIds = (studentRoles ?? []).map((r) => r.user_id);
      if (studentIds.length === 0) return [];

      const { data: profileRows, error: profErr } = await supabase
        .from("profiles")
        .select("user_id, full_name")
        .in("user_id", studentIds);
      if (profErr) throw profErr;

      const { data: attendanceRows, error: attErr } = await supabase
        .from("attendance")
        .select("student_id, subject_id, status")
        .in("student_id", studentIds);
      if (attErr) throw attErr;

      return (profileRows ?? []).map((profile) => {
        const subjectSummaries = (subjectRows ?? []).map((sub) => {
          const records = (attendanceRows ?? []).filter(
            (a) => a.student_id === profile.user_id && a.subject_id === sub.id
          );
          const total = records.length;
          const attended = records.filter((r) => r.status === "present" || r.status === "late").length;
          const percentage = getPercentage(attended, total);
          return {
            subjectId: sub.id,
            subjectName: sub.code ? `${sub.name} (${sub.code})` : sub.name,
            attended,
            total,
            percentage,
            status: getStatus(percentage),
          };
        });

        // Use average of subject percentages (same as student dashboard)
        const activeSubs = subjectSummaries.filter((s) => s.total > 0);
        const overallPercentage = activeSubs.length === 0
          ? 0
          : Math.round(activeSubs.reduce((s, sub) => s + sub.percentage, 0) / activeSubs.length);

        return {
          studentId: profile.user_id,
          name: profile.full_name ?? "Unknown Student",
          subjects: subjectSummaries,
          overallPercentage,
          overallStatus: getStatus(overallPercentage),
        };
      });
    },
    staleTime: 1000 * 30,
  });

  const markAttendance = useMutation({
    mutationFn: async ({
      studentId,
      subjectId,
      date,
      status,
    }: {
      studentId: string;
      subjectId: string;
      date: string;
      status: "present" | "absent" | "late";
    }) => {
      const { error } = await supabase.from("attendance").upsert(
        {
          student_id: studentId,
          subject_id: subjectId,
          date,
          status,
          marked_by: user!.id,
        },
        { onConflict: "student_id,subject_id,date" }
      );
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["teacher-attendance"] });
      toast.success("Attendance marked successfully");
    },
    onError: (err: Error) => {
      toast.error("Failed to mark attendance: " + err.message);
    },
  });

  /**
   * Set class counts for a student-subject pair by deleting all existing
   * records and inserting the specified attended/total breakdown.
   */
  const setClassCount = useMutation({
    mutationFn: async ({
      studentId,
      subjectId,
      attended,
      total,
    }: {
      studentId: string;
      subjectId: string;
      attended: number;
      total: number;
    }) => {
      if (attended > total) throw new Error("Attended cannot exceed total classes");
      if (total < 0 || attended < 0) throw new Error("Values cannot be negative");

      // Delete all existing records for this student+subject
      const { error: delErr } = await supabase
        .from("attendance")
        .delete()
        .eq("student_id", studentId)
        .eq("subject_id", subjectId);
      if (delErr) throw delErr;

      if (total === 0) return;

      // Build records: attended as "present", the rest as "absent"
      const baseDate = new Date("2025-01-01");
      const records = Array.from({ length: total }, (_, i) => ({
        student_id: studentId,
        subject_id: subjectId,
        date: new Date(baseDate.getTime() + i * 86400000).toISOString().slice(0, 10),
        status: i < attended ? "present" : "absent",
        marked_by: user!.id,
      }));

      const { error: insErr } = await supabase.from("attendance").insert(records);
      if (insErr) throw insErr;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["teacher-attendance"] });
      queryClient.invalidateQueries({ queryKey: ["attendance"] });
      toast.success("Class counts updated successfully");
    },
    onError: (err: Error) => {
      toast.error("Failed to set class counts: " + err.message);
    },
  });

  /**
   * Send a message to a student via the notifications table.
   */
  const sendMessage = useMutation({
    mutationFn: async ({
      studentId,
      message,
    }: {
      studentId: string;
      message: string;
    }) => {
      const { error } = await supabase.from("notifications").insert({
        user_id: studentId,
        message,
        type: "info",
        is_read: false,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Message sent to student");
    },
    onError: (err: Error) => {
      toast.error("Failed to send message: " + err.message);
    },
  });

  return { students, isLoading, error: error as Error | null, markAttendance, setClassCount, sendMessage };
}

export type { Status };
