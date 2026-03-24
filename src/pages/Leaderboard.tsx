import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { AppLayout } from "@/components/AppLayout";
import { Trophy, Medal, Crown, TrendingUp, Users, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { motion } from "framer-motion";

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
  "from-yellow-400/20 via-yellow-500/10 to-yellow-600/5 border-yellow-500/30 shadow-yellow-500/10",
  "from-slate-300/20 via-slate-400/10 to-slate-500/5 border-slate-400/30 shadow-slate-400/10",
  "from-amber-600/20 via-amber-700/10 to-amber-800/5 border-amber-700/30 shadow-amber-600/10",
];
const podiumTextColors = ["text-yellow-500", "text-slate-400", "text-amber-600"];
const podiumHeights = ["h-[260px]", "h-[220px]", "h-[200px]"];
const podiumRankLabels = ["1st", "2nd", "3rd"];

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

  const sorted = [...entries]
    .sort((a, b) => b.attendance_pct - a.attendance_pct || b.attended_classes - a.attended_classes || b.points - a.points)
    .map((e, i) => ({ ...e, rank: i + 1 }));
  const top3 = sorted.slice(0, 3);
  const rest = sorted.slice(3);

  const totalStudents = sorted.length;
  const avgPct = totalStudents > 0 ? Math.round(sorted.reduce((s, e) => s + e.attendance_pct, 0) / totalStudents) : 0;
  const topPct = top3[0]?.attendance_pct ?? 0;

  return (
    <AppLayout>
      <div className="space-y-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="flex items-center justify-between"
        >
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-primary/10 ring-1 ring-primary/20">
              <Trophy className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl lg:text-3xl font-bold tracking-tight">Leaderboard</h1>
              <p className="text-sm text-muted-foreground">Compete with your classmates for the top spot!</p>
            </div>
          </div>
        </motion.div>

        {/* Stats strip */}
        {!isLoading && totalStudents > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.4 }}
            className="grid grid-cols-3 gap-3 lg:gap-4"
          >
            {[
              { icon: Users, label: "Total Students", value: totalStudents, color: "text-primary" },
              { icon: TrendingUp, label: "Avg Attendance", value: `${avgPct}%`, color: avgPct >= 85 ? "text-green-500" : avgPct >= 75 ? "text-yellow-500" : "text-red-500" },
              { icon: Sparkles, label: "Top Score", value: `${topPct}%`, color: "text-yellow-500" },
            ].map((stat) => (
              <div
                key={stat.label}
                className="rounded-xl border bg-card p-3 lg:p-4 flex items-center gap-3 hover:shadow-md transition-shadow"
              >
                <div className="p-2 rounded-lg bg-muted">
                  <stat.icon className="h-4 w-4 lg:h-5 lg:w-5 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-[11px] lg:text-xs text-muted-foreground font-medium">{stat.label}</p>
                  <p className={cn("text-lg lg:text-xl font-bold", stat.color)}>{stat.value}</p>
                </div>
              </div>
            ))}
          </motion.div>
        )}

        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 lg:gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-48 lg:h-64 rounded-2xl bg-muted animate-pulse" />
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
            {/* Podium — Top 3 */}
            {/* Mobile: stacked 1st→2nd→3rd. Desktop: podium with height differences */}
            <div className="space-y-3 sm:space-y-0 sm:grid sm:grid-cols-3 sm:gap-4 lg:gap-6 sm:items-end">
              {/* Desktop order: 2nd, 1st, 3rd. Mobile: 1st, 2nd, 3rd */}
              {[
                { podiumIdx: 1, smOrder: "sm:order-1" },
                { podiumIdx: 0, smOrder: "sm:order-2" },
                { podiumIdx: 2, smOrder: "sm:order-3" },
              ].map(({ podiumIdx, smOrder }, animIdx) => {
                const entry = top3[podiumIdx];
                if (!entry) return <div key={podiumIdx} className={smOrder} />;
                const Icon = podiumIcons[podiumIdx];
                const isMe = entry.user_id === user?.id;
                return (
                  <motion.div
                    key={entry.user_id}
                    initial={{ opacity: 0, y: 30, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ delay: animIdx * 0.12, duration: 0.5, type: "spring", stiffness: 120 }}
                    className={cn(
                      "relative rounded-2xl border bg-gradient-to-b transition-all",
                      "hover:shadow-lg hover:scale-[1.02] active:scale-[0.98]",
                      "p-4 sm:p-5 lg:p-6",
                      podiumColors[podiumIdx],
                      smOrder,
                      isMe && "ring-2 ring-primary ring-offset-2 ring-offset-background"
                    )}
                  >
                    {/* Rank badge top-left */}
                    <span className={cn(
                      "absolute top-3 left-3 text-xs font-black px-2.5 py-1 rounded-lg bg-background/80 backdrop-blur-sm border",
                      podiumTextColors[podiumIdx]
                    )}>
                      {podiumRankLabels[podiumIdx]}
                    </span>

                    {isMe && (
                      <span className="absolute top-3 right-3 text-[10px] font-bold bg-primary text-primary-foreground px-2.5 py-1 rounded-lg shadow-sm">
                        YOU
                      </span>
                    )}

                    {/* Mobile: horizontal. Desktop: vertical centered */}
                    <div className="flex items-center gap-4 sm:flex-col sm:gap-0 sm:pt-6 lg:pt-8">
                      <div className="flex items-center gap-3 sm:flex-col sm:gap-3">
                        <Icon className={cn("h-6 w-6 sm:h-8 sm:w-8 lg:h-10 lg:w-10 shrink-0 drop-shadow-md", podiumTextColors[podiumIdx])} />
                        <div className={cn(
                          "w-14 h-14 sm:w-16 sm:h-16 lg:w-20 lg:h-20 rounded-full bg-muted flex items-center justify-center font-bold shrink-0",
                          "text-xl sm:text-2xl lg:text-3xl",
                          "ring-2 ring-offset-2 ring-offset-transparent",
                          podiumIdx === 0 ? "ring-yellow-500/40" : podiumIdx === 1 ? "ring-slate-400/40" : "ring-amber-600/40"
                        )}>
                          {entry.full_name?.charAt(0)?.toUpperCase() || "?"}
                        </div>
                      </div>

                      <div className="flex-1 min-w-0 text-left sm:text-center sm:mt-4">
                        <h3 className="font-semibold truncate text-sm sm:text-base lg:text-lg">{entry.full_name}</h3>
                        <p className={cn("text-2xl sm:text-3xl lg:text-4xl font-black mt-1 tracking-tight", podiumTextColors[podiumIdx])}>
                          {entry.points}
                          <span className="text-sm sm:text-base lg:text-lg font-semibold opacity-70 ml-1">pts</span>
                        </p>
                        <div className="flex items-center gap-2 mt-2 sm:justify-center">
                          <span className={cn(
                            "text-xs lg:text-sm font-semibold px-2 py-0.5 rounded-full",
                            entry.attendance_pct >= 85
                              ? "bg-green-500/10 text-green-500"
                              : entry.attendance_pct >= 75
                                ? "bg-yellow-500/10 text-yellow-500"
                                : "bg-red-500/10 text-red-500"
                          )}>
                            {entry.attendance_pct}%
                          </span>
                          <span className="text-[11px] lg:text-xs text-muted-foreground">
                            {entry.attended_classes}/{entry.total_classes} classes
                          </span>
                        </div>
                        {entry.badges.length > 0 && (
                          <div className="flex gap-1.5 mt-2.5 sm:justify-center flex-wrap">
                            {entry.badges.map((b) => (
                              <span key={b.label} className="text-[11px] lg:text-xs bg-background/60 backdrop-blur-sm px-2 py-0.5 rounded-full border border-border/50">
                                {b.icon} {b.label}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>

            {/* Rest of leaderboard table */}
            {rest.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4, duration: 0.4 }}
                className="rounded-xl border bg-card overflow-hidden shadow-sm"
              >
                <div className="grid grid-cols-[2.5rem_1fr_4rem_4rem] lg:grid-cols-[3rem_1fr_6rem_5rem] gap-2 lg:gap-6 px-3 lg:px-6 py-3 text-[11px] lg:text-xs font-semibold text-muted-foreground border-b bg-muted/50 uppercase tracking-wider">
                  <span>Rank</span>
                  <span>Student</span>
                  <span className="text-right">Attendance</span>
                  <span className="text-right">Points</span>
                </div>
                {rest.map((entry, i) => {
                  const isMe = entry.user_id === user?.id;
                  return (
                    <motion.div
                      key={entry.user_id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.4 + i * 0.04 }}
                      className={cn(
                        "grid grid-cols-[2.5rem_1fr_4rem_4rem] lg:grid-cols-[3rem_1fr_6rem_5rem] gap-2 lg:gap-6 px-3 lg:px-6 py-3 lg:py-4 items-center border-b last:border-b-0 transition-colors hover:bg-accent/40 active:bg-accent/30 group",
                        isMe && "bg-primary/5 hover:bg-primary/8"
                      )}
                    >
                      <span className="text-sm lg:text-base font-bold text-muted-foreground text-center">{entry.rank}</span>
                      <div className="flex items-center gap-2.5 lg:gap-4 min-w-0">
                        <div className="w-8 h-8 lg:w-10 lg:h-10 rounded-full bg-muted flex items-center justify-center text-sm lg:text-base font-bold shrink-0 group-hover:ring-2 group-hover:ring-primary/20 transition-all">
                          {entry.full_name?.charAt(0)?.toUpperCase() || "?"}
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium text-sm lg:text-base truncate">
                            {entry.full_name}
                            {isMe && <span className="ml-1.5 text-[10px] lg:text-xs font-bold text-primary">(You)</span>}
                          </p>
                          {entry.badges.length > 0 && (
                            <div className="flex gap-1 mt-0.5">
                              {entry.badges.map((b) => (
                                <span key={b.label} className="text-[10px] lg:text-xs" title={b.label}>{b.icon}</span>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <span className={cn(
                          "text-sm lg:text-base font-semibold",
                          entry.attendance_pct >= 85 ? "text-green-500" : entry.attendance_pct >= 75 ? "text-yellow-500" : "text-red-500"
                        )}>
                          {entry.attendance_pct}%
                        </span>
                      </div>
                      <span className="text-sm lg:text-base font-bold text-primary text-right">{entry.points}</span>
                    </motion.div>
                  );
                })}
              </motion.div>
            )}
          </>
        )}
      </div>
    </AppLayout>
  );
}
