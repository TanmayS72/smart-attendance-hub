import { type Status } from "@/lib/data";
import { cn } from "@/lib/utils";

const config: Record<Status, { label: string; className: string }> = {
  safe: { label: "Safe", className: "bg-safe-bg text-safe" },
  warning: { label: "Warning", className: "bg-warning-bg text-warning" },
  critical: { label: "Critical", className: "bg-critical-bg text-critical" },
};

export function StatusBadge({ status }: { status: Status }) {
  const c = config[status];
  return (
    <span className={cn("inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold", c.className)}>
      {c.label}
    </span>
  );
}
