import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { AppLayout } from "@/components/AppLayout";
import { Trophy, Medal, Crown } from "lucide-react";
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

  const sorted = [...entries]
    .sort((a, b) => b.attendance_pct - a.attendance_pct || b.attended_classes - a.attended_classes || b.points - a.points)
    .map((e, i) => ({ ...e, rank: i + 1 }));
  const top3 = sorted.slice(0, 3);
  const rest = sorted.slice(3);

  // Mobile: show top3 as stacked cards (1st, 2nd, 3rd order). Desktop: podium layout.
  const mobileOrder = [0, 1, 2];
  const desktopOrder = [1, 0, 2]; // silver, gold, bronze for podium visual

  return (
    <AppLayout>
      <div className="space-y-6 sm:space-y-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-3"
        >
          <div className="p-2 sm:p-2.5 rounded-xl bg-primary/10">
            <Trophy className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight">Leaderboard</h1>
            <p className="text-xs sm:text-sm text-muted-foreground">Compete with your classmates!</p>
          </div>
        </motion.div>

        {isLoading ? (
          <div className="space-y-3 sm:grid sm:grid-cols-3 sm:gap-4 sm:space-y-0">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-32 sm:h-48 rounded-2xl bg-muted animate-pulse" />
            ))}
          </div>
        ) : sorted.length === 0 ? (
          <div className="text-center py-16 sm:py-20 text-muted-foreground">
            <Trophy className="h-10 w-10 sm:h-12 sm:w-12 mx-auto mb-3 opacity-30" />
            <p className="font-medium text-sm sm:text-base">No students yet</p>
            <p className="text-xs sm:text-sm">The leaderboard will populate as students join.</p>
          </div>
        ) : (
          <>
            {/* Top 3 — stacked on mobile, podium on desktop */}
            <div className="space-y-3 sm:space-y-0 sm:grid sm:grid-cols-3 sm:gap-4">
              {(typeof window !== "undefined" && window.innerWidth < 640 ? mobileOrder : desktopOrder).map(
                (podiumIdx, animIdx) => {
                  const entry = top3[podiumIdx];
                  if (!entry) return <div key={podiumIdx} />;
                  const Icon = podiumIcons[podiumIdx];
                  const isMe = entry.user_id === user?.id;
                  return (
                    <motion.div
                      key={entry.user_id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: animIdx * 0.1 }}
                      className={cn(
                        "relative rounded-2xl border bg-gradient-to-b transition-all active:scale-[0.98] sm:hover:scale-[1.02]",
                        "p-4 sm:p-6 text-center",
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

                      {/* Mobile: horizontal layout. Desktop: vertical */}
                      <div className="flex items-center gap-4 sm:flex-col sm:gap-0">
                        {/* Rank + Avatar cluster */}
                        <div className="flex items-center gap-3 sm:flex-col sm:gap-2">
                          <Icon className={cn("h-6 w-6 sm:h-8 sm:w-8 shrink-0", podiumTextColors[podiumIdx])} />
                          <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-muted flex items-center justify-center text-xl sm:text-2xl font-bold shrink-0 sm:mb-2">
                            {entry.full_name?.charAt(0)?.toUpperCase() || "?"}
                          </div>
                        </div>

                        {/* Info */}
                        <div className="flex-1 min-w-0 text-left sm:text-center">
                          <h3 className="font-semibold truncate text-sm sm:text-base">{entry.full_name}</h3>
                          <p className={cn("text-xl sm:text-2xl font-bold", podiumTextColors[podiumIdx])}>
                            {entry.points} pts
                          </p>
                          <p className="text-[11px] sm:text-xs text-muted-foreground">
                            {entry.attendance_pct}% · {entry.attended_classes}/{entry.total_classes} classes
                          </p>
                          {entry.badges.length > 0 && (
                            <div className="flex gap-1 mt-1.5 sm:justify-center flex-wrap">
                              {entry.badges.map((b) => (
                                <span key={b.label} className="text-[11px] sm:text-xs bg-background/50 px-1.5 py-0.5 rounded-full">
                                  {b.icon} {b.label}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  );
                }
              )}
            </div>

            {/* Rest of leaderboard */}
            {rest.length > 0 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="rounded-xl border bg-card overflow-hidden"
              >
                {/* Header row — hide Points column on very small screens */}
                <div className="grid grid-cols-[2rem_1fr_3.5rem_3.5rem] sm:grid-cols-[auto_1fr_auto_auto] gap-2 sm:gap-4 px-3 sm:px-4 py-2.5 sm:py-3 text-[11px] sm:text-xs font-semibold text-muted-foreground border-b bg-muted/50">
                  <span>#</span>
                  <span>Student</span>
                  <span>Att%</span>
                  <span>Pts</span>
                </div>
                {rest.map((entry, i) => {
                  const isMe = entry.user_id === user?.id;
                  return (
                    <motion.div
                      key={entry.user_id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.3 + i * 0.05 }}
                      className={cn(
                        "grid grid-cols-[2rem_1fr_3.5rem_3.5rem] sm:grid-cols-[auto_1fr_auto_auto] gap-2 sm:gap-4 px-3 sm:px-4 py-2.5 sm:py-3 items-center border-b last:border-b-0 transition-colors active:bg-accent/30 sm:hover:bg-accent/50",
                        isMe && "bg-primary/5"
                      )}
                    >
                      <span className="text-xs sm:text-sm font-bold text-muted-foreground text-center">{entry.rank}</span>
                      <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                        <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-muted flex items-center justify-center text-xs sm:text-sm font-bold shrink-0">
                          {entry.full_name?.charAt(0)?.toUpperCase() || "?"}
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium text-xs sm:text-sm truncate">
                            {entry.full_name}
                            {isMe && <span className="ml-1 text-[9px] sm:text-[10px] font-bold text-primary">(You)</span>}
                          </p>
                          {entry.badges.length > 0 && (
                            <div className="flex gap-0.5 mt-0.5">
                              {entry.badges.map((b) => (
                                <span key={b.label} className="text-[10px] sm:text-xs" title={b.label}>{b.icon}</span>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                      <span className={cn(
                        "text-xs sm:text-sm font-semibold text-right",
                        entry.attendance_pct >= 85 ? "text-green-500" : entry.attendance_pct >= 75 ? "text-yellow-500" : "text-red-500"
                      )}>
                        {entry.attendance_pct}%
                      </span>
                      <span className="text-xs sm:text-sm font-bold text-primary text-right">{entry.points}</span>
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
