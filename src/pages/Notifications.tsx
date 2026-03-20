import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { ScrollReveal } from "@/components/ScrollReveal";
import { AppLayout } from "@/components/AppLayout";
import { Bell, AlertTriangle, CheckCircle, Info, Inbox } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
function timeAgoStr(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins} min ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} hr${hrs > 1 ? "s" : ""} ago`;
  const days = Math.floor(hrs / 24);
  return `${days} day${days > 1 ? "s" : ""} ago`;
}

const typeConfig = {
  info: { icon: Info, color: "text-primary", bg: "bg-primary/10" },
  warning: { icon: AlertTriangle, color: "text-warning", bg: "bg-warning/10" },
  critical: { icon: Bell, color: "text-critical", bg: "bg-critical/10" },
  success: { icon: CheckCircle, color: "text-safe", bg: "bg-safe/10" },
} as const;

interface Notification {
  id: string;
  message: string;
  type: "info" | "warning" | "critical" | "success";
  is_read: boolean;
  created_at: string;
}

export default function Notifications() {
  const { user } = useAuth();

  const { data: notifications = [], isLoading } = useQuery({
    queryKey: ["notifications", user?.id],
    enabled: !!user,
    queryFn: async (): Promise<Notification[]> => {
      const { data, error } = await supabase
        .from("notifications")
        .select("id, message, type, is_read, created_at")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false })
        .limit(30);
      if (error) throw error;
      return (data ?? []) as unknown as Notification[];
    },
    staleTime: 1000 * 30,
  });

  return (
    <AppLayout>
      <ScrollReveal>
        <div className="mb-8">
          <h1 className="text-2xl font-bold tracking-tight mb-1">Notifications</h1>
          <p className="text-sm text-muted-foreground">Stay updated with smart alerts</p>
        </div>
      </ScrollReveal>

      <div className="space-y-3">
        {isLoading ? (
          Array.from({ length: 5 }).map((_, i) => (
            <ScrollReveal key={i} delay={0.05 + i * 0.06}>
              <div className="flex items-start gap-4 rounded-xl border bg-card p-4 shadow-sm">
                <Skeleton className="h-10 w-10 rounded-xl shrink-0" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-24" />
                </div>
              </div>
            </ScrollReveal>
          ))
        ) : notifications.length === 0 ? (
          <ScrollReveal delay={0.1}>
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="h-16 w-16 rounded-2xl bg-secondary flex items-center justify-center mb-4">
                <Inbox className="h-8 w-8 text-muted-foreground" />
              </div>
              <p className="text-sm font-medium">No notifications yet</p>
              <p className="text-xs text-muted-foreground mt-1">
                You'll receive alerts here when your attendance drops or improves.
              </p>
            </div>
          </ScrollReveal>
        ) : (
          notifications.map((n, i) => {
            const config = typeConfig[n.type] ?? typeConfig.info;
            const Icon = config.icon;
            const timeAgo = timeAgoStr(n.created_at);
            return (
              <ScrollReveal key={n.id} delay={0.05 + i * 0.06}>
                <div className={cn(
                  "flex items-start gap-4 rounded-xl border bg-card p-4 shadow-sm hover:shadow-md transition-shadow",
                  !n.is_read && "border-primary/20 bg-primary/5"
                )}>
                  <div className={cn("h-10 w-10 rounded-xl flex items-center justify-center shrink-0", config.bg)}>
                    <Icon className={cn("h-5 w-5", config.color)} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={cn("text-sm", !n.is_read && "font-medium")}>{n.message}</p>
                    <p className="text-xs text-muted-foreground mt-1">{timeAgo}</p>
                  </div>
                  {!n.is_read && (
                    <div className="h-2 w-2 rounded-full bg-primary shrink-0 mt-2" />
                  )}
                </div>
              </ScrollReveal>
            );
          })
        )}
      </div>
    </AppLayout>
  );
}
