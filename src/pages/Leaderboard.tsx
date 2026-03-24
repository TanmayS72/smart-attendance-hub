import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { AppLayout } from "@/components/AppLayout";
import { Trophy, Medal, Award, Star, Flame, Crown } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";

interface LeaderboardEntry {
  user_id: string;
  full_name: string;
  avatar_url: string | null;
  total_classes: number;
  attended_classes: number;
  attendance_pct: number;
}

function calculatePoints(attended: number, total: number, pct: number): number {
  let pts = attended * 10;
  if (total >= 5 && pct >= 100) pts += 200;
  else if (total >= 5 && pct >= 95) pts += 100;
  else if (total >= 5 && pct >= 90) pts += 50;
  return pts;
}

function getBadges(pct: number, total: number): { icon: string; label: string }[] {
  const badges: { icon: string; label: string }[] = [];
  if (total >= 5 && pct === 100) badges.push({ icon: "👑", label: "Perfect" });
  if (total >= 10 && pct >= 90) badges.push({ icon: "🔥", label: "Consistent" });
  if (total >= 5 && pct >= 85) badges.push({ icon: "⭐", label: "Star Student" });
  if (total >= 20) badges.push({ icon: "🎯", label: "Dedicated" });
  return badges;
}

const podiumIcons = [Crown, Trophy, Medal];
const podiumColors = [
  "from-yellow-400/20 to-yellow-500/5 border-yellow-500/30",
  "from-slate-300/20 to-slate-400/5 border-slate-400/30",
  "from-amber-600/20 to-amber-700/5 border-amber-700/30",
];
const podiumTextColors = ["text-yellow-500", "text-slate-400", "text-amber-600"];

export default function Leaderboard() {
  const { user } = useAuth();

  const { data: entries = [], isLoading } = useQuery({
    queryKey: ["leaderboard"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_leaderboard");
      if (error) throw error;
      return (data as LeaderboardEntry[]).map((e, i) => ({
        ...e,
        points: calculatePoints(e.attended_classes, e.total_classes, e.attendance_pct),
        badges: getBadges(e.attendance_pct, e.total_classes),
        rank: i + 1,
      }));
    },
    staleTime: 1000 * 30,
  });

  const sorted = [...entries].sort((a, b) => b.points - a.points).map((e, i) => ({ ...e, rank: i + 1 }));
  const top3 = sorted.slice(0, 3);
  const rest = sorted.slice(3);

  return (
    <AppLayout>
      <div className="space-y-8 animate-in fade-in duration-500">
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-primary/10">
            <Trophy className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Leaderboard</h1>
            <p className="text-sm text-muted-foreground">Compete with your classmates for the top spot!</p>
          </div>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-48 rounded-2xl bg-muted animate-pulse" />
            ))}
          </div>
        ) : sorted.length === 0 ? (
          <div className="text-center py-20 text-muted-foreground">
            <Trophy className="h-12 w-12 mx-auto mb-3 opacity-30" />
            <p className="font-medium">No students yet</p>
            <p className="text-sm">The leaderboard will populate as students join.</p>
          </div>
        ) : (
          <>
            {/* Podium - Top 3 */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {[1, 0, 2].map((podiumIdx) => {
                const entry = top3[podiumIdx];
                if (!entry) return <div key={podiumIdx} />;
                const Icon = podiumIcons[podiumIdx];
                const isMe = entry.user_id === user?.id;
                return (
                  <div
                    key={entry.user_id}
                    className={cn(
                      "relative rounded-2xl border p-6 text-center bg-gradient-to-b transition-all hover:scale-[1.02]",
                      podiumColors[podiumIdx],
                      podiumIdx === 0 && "sm:order-2 sm:-mt-4",
                      podiumIdx === 1 && "sm:order-1",
                      podiumIdx === 2 && "sm:order-3",
                      isMe && "ring-2 ring-primary"
                    )}
                  >
                    {isMe && (
                      <span className="absolute top-2 right-2 text-[10px] font-bold bg-primary text-primary-foreground px-2 py-0.5 rounded-full">
                        YOU
                      </span>
                    )}
                    <Icon className={cn("h-8 w-8 mx-auto mb-2", podiumTextColors[podiumIdx])} />
                    <div className="w-14 h-14 rounded-full bg-muted mx-auto mb-3 flex items-center justify-center text-2xl font-bold">
                      {entry.full_name?.charAt(0)?.toUpperCase() || "?"}
                    </div>
                    <h3 className="font-semibold truncate">{entry.full_name}</h3>
                    <p className={cn("text-2xl font-bold mt-1", podiumTextColors[podiumIdx])}>
                      {entry.points} pts
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {entry.attendance_pct}% · {entry.attended_classes}/{entry.total_classes} classes
                    </p>
                    {entry.badges.length > 0 && (
                      <div className="flex justify-center gap-1 mt-2 flex-wrap">
                        {entry.badges.map((b) => (
                          <span key={b.label} className="text-xs bg-background/50 px-2 py-0.5 rounded-full" title={b.label}>
                            {b.icon} {b.label}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Rest of the leaderboard */}
            {rest.length > 0 && (
              <div className="rounded-xl border bg-card overflow-hidden">
                <div className="grid grid-cols-[auto_1fr_auto_auto] gap-4 px-4 py-3 text-xs font-semibold text-muted-foreground border-b bg-muted/50">
                  <span>#</span>
                  <span>Student</span>
                  <span>Attendance</span>
                  <span>Points</span>
                </div>
                {rest.map((entry) => {
                  const isMe = entry.user_id === user?.id;
                  return (
                    <div
                      key={entry.user_id}
                      className={cn(
                        "grid grid-cols-[auto_1fr_auto_auto] gap-4 px-4 py-3 items-center border-b last:border-b-0 transition-colors hover:bg-accent/50",
                        isMe && "bg-primary/5"
                      )}
                    >
                      <span className="text-sm font-bold text-muted-foreground w-6 text-center">{entry.rank}</span>
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-sm font-bold shrink-0">
                          {entry.full_name?.charAt(0)?.toUpperCase() || "?"}
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium text-sm truncate">
                            {entry.full_name}
                            {isMe && <span className="ml-1.5 text-[10px] font-bold text-primary">(You)</span>}
                          </p>
                          {entry.badges.length > 0 && (
                            <div className="flex gap-1 mt-0.5">
                              {entry.badges.map((b) => (
                                <span key={b.label} className="text-xs" title={b.label}>{b.icon}</span>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                      <span className={cn(
                        "text-sm font-semibold",
                        entry.attendance_pct >= 85 ? "text-green-500" : entry.attendance_pct >= 75 ? "text-yellow-500" : "text-red-500"
                      )}>
                        {entry.attendance_pct}%
                      </span>
                      <span className="text-sm font-bold text-primary">{entry.points}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}
      </div>
    </AppLayout>
  );
}
