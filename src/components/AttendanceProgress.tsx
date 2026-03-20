import { type Status } from "@/lib/data";
import { cn } from "@/lib/utils";

const barColors: Record<Status, string> = {
  safe: "bg-safe",
  warning: "bg-warning",
  critical: "bg-critical",
};

export function AttendanceProgress({ percentage, status }: { percentage: number; status: Status }) {
  return (
    <div className="w-full h-2 rounded-full bg-secondary overflow-hidden">
      <div
        className={cn("h-full rounded-full transition-all duration-700 ease-out", barColors[status])}
        style={{ width: `${percentage}%` }}
      />
    </div>
  );
}
