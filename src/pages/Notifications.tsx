import { notifications } from "@/lib/data";
import { ScrollReveal } from "@/components/ScrollReveal";
import { AppLayout } from "@/components/AppLayout";
import { Bell, AlertTriangle, CheckCircle, Info } from "lucide-react";
import { cn } from "@/lib/utils";

const typeConfig = {
  info: { icon: Info, color: "text-primary", bg: "bg-primary/10" },
  warning: { icon: AlertTriangle, color: "text-warning", bg: "bg-warning-bg" },
  critical: { icon: Bell, color: "text-critical", bg: "bg-critical-bg" },
  success: { icon: CheckCircle, color: "text-safe", bg: "bg-safe-bg" },
};

export default function Notifications() {
  return (
    <AppLayout>
      <ScrollReveal>
        <div className="mb-8">
          <h1 className="text-2xl font-bold tracking-tight mb-1">Notifications</h1>
          <p className="text-sm text-muted-foreground">Stay updated with smart alerts</p>
        </div>
      </ScrollReveal>

      <div className="space-y-3">
        {notifications.map((n, i) => {
          const config = typeConfig[n.type];
          const Icon = config.icon;
          return (
            <ScrollReveal key={n.id} delay={0.05 + i * 0.06}>
              <div className="flex items-start gap-4 rounded-xl border bg-card p-4 shadow-sm hover:shadow-md transition-shadow">
                <div className={cn("h-10 w-10 rounded-xl flex items-center justify-center shrink-0", config.bg)}>
                  <Icon className={cn("h-5 w-5", config.color)} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">{n.message}</p>
                  <p className="text-xs text-muted-foreground mt-1">{n.time}</p>
                </div>
              </div>
            </ScrollReveal>
          );
        })}
      </div>
    </AppLayout>
  );
}
