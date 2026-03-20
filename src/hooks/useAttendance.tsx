import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { getPercentage, getStatus, getSuggestion, getOverallAttendance, getOverallCounts, type SubjectData } from "@/lib/data";
import { toast } from "sonner";

export type { SubjectData };

export interface AttendanceSummary {
  subjects: SubjectData[];
  subjectIds: Record<string, string>; // name->id map for marking
  overall: number;
  totalAttended: number;
  totalClasses: number;
  overallStatus: ReturnType<typeof getStatus>;
  isLoading: boolean;
  error: Error | null;
  markSelfAttendance: {
    mutate: (args: { subjectId: string; date: string; status: "present" | "absent" | "late" }) => void;
    isPending: boolean;
  };
}

export function useAttendance(): AttendanceSummary {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data, isLoading, error } = useQuery({
    queryKey: ["attendance", user?.id],
    enabled: !!user,
    queryFn: async () => {
      // 1. Fetch all subjects
      const { data: subjectRows, error: subErr } = await supabase
        .from("subjects")
        .select("id, name, code")
        .order("name");
      if (subErr) throw subErr;

      // 2. Fetch all attendance records for this student
      const { data: attendanceRows, error: attErr } = await supabase
        .from("attendance")
        .select("subject_id, status")
        .eq("student_id", user!.id);
      if (attErr) throw attErr;

      // 3. Aggregate per subject
      const attendanceMap: Record<string, { attended: number; total: number }> = {};
      for (const row of attendanceRows ?? []) {
        if (!attendanceMap[row.subject_id]) {
          attendanceMap[row.subject_id] = { attended: 0, total: 0 };
        }
        attendanceMap[row.subject_id].total += 1;
        if (row.status === "present" || row.status === "late") {
          attendanceMap[row.subject_id].attended += 1;
        }
      }

      // 4. Build SubjectData array + id map
      const subjectIds: Record<string, string> = {};
      const subjects: SubjectData[] = (subjectRows ?? []).map((sub) => {
        const displayName = sub.code ? `${sub.name} (${sub.code})` : sub.name;
        subjectIds[sub.id] = displayName;
        return {
          id: sub.id,
          name: displayName,
          attended: attendanceMap[sub.id]?.attended ?? 0,
          total: attendanceMap[sub.id]?.total ?? 0,
        };
      });

      return { subjects, subjectIds };
    },
    staleTime: 1000 * 60,
  });

  const subjects = data?.subjects ?? [];
  const subjectIds = data?.subjectIds ?? {};
  const overall = getOverallAttendance(subjects);
  const overallStatus = getStatus(overall);
  const { attended: totalAttended, total: totalClasses } = getOverallCounts(subjects);

  const mutation = useMutation({
    mutationFn: async ({
      subjectId,
      date,
      status,
    }: {
      subjectId: string;
      date: string;
      status: "present" | "absent" | "late";
    }) => {
      const { error } = await supabase.from("attendance").upsert(
        {
          student_id: user!.id,
          subject_id: subjectId,
          date,
          status,
          marked_by: user!.id,
        },
        { onConflict: "student_id,subject_id,date" }
      );
      if (error) throw error;
    },
    onSuccess: (_, { status }) => {
      queryClient.invalidateQueries({ queryKey: ["attendance", user?.id] });
      queryClient.invalidateQueries({ queryKey: ["weekly-report", user?.id] });
      const emoji = status === "present" ? "✅" : status === "late" ? "🕐" : "❌";
      toast.success(`${emoji} Attendance marked as ${status}!`);
    },
    onError: (err: Error) => {
      toast.error("Error: " + err.message);
    },
  });

  return {
    subjects,
    subjectIds,
    overall,
    totalAttended,
    totalClasses,
    overallStatus,
    isLoading,
    error: error as Error | null,
    markSelfAttendance: {
      mutate: mutation.mutate,
      isPending: mutation.isPending,
    },
  };
}

export { getPercentage, getStatus, getSuggestion };
