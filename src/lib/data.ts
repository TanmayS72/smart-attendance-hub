export interface SubjectData {
  id: string;
  name: string;
  attended: number;
  total: number;
}

export const subjects: SubjectData[] = [
  { id: "ai", name: "AI", attended: 10, total: 11 },
  { id: "dbms", name: "DBMS", attended: 14, total: 18 },
  { id: "compiler", name: "Compiler Design", attended: 23, total: 24 },
  { id: "mdm", name: "MDM", attended: 12, total: 17 },
  { id: "oe", name: "OE", attended: 8, total: 10 },
  { id: "ai-lab", name: "AI Lab", attended: 7, total: 9 },
  { id: "sw-lab", name: "Software-II Lab", attended: 6, total: 8 },
  { id: "dbms-lab", name: "DBMS Lab", attended: 5, total: 7 },
];

export function getPercentage(attended: number, total: number): number {
  if (total === 0) return 0;
  return Math.round((attended / total) * 100);
}

export type Status = "safe" | "warning" | "critical";

export function getStatus(percentage: number): Status {
  if (percentage >= 85) return "safe";
  if (percentage >= 75) return "warning";
  return "critical";
}

export function getSuggestion(attended: number, total: number): string {
  const pct = getPercentage(attended, total);
  if (pct >= 85) {
    // How many can skip while staying ≥75%
    let canMiss = 0;
    let t = total;
    while (getPercentage(attended, t + 1) >= 75) {
      canMiss++;
      t++;
    }
    return canMiss > 0
      ? `You can miss ${canMiss} class${canMiss > 1 ? "es" : ""} safely`
      : "Attend all upcoming classes to stay safe";
  }
  // How many consecutive to reach 75%
  let needed = 0;
  let a = attended;
  let t = total;
  while (getPercentage(a, t) < 75 && needed < 50) {
    needed++;
    a++;
    t++;
  }
  if (needed >= 50) return "Attendance recovery may not be possible this semester";
  return `Attend next ${needed} class${needed > 1 ? "es" : ""} to reach 75%`;
}

export function getOverallAttendance(subs: SubjectData[]): number {
  // Only include subjects that have at least one class scheduled
  const activeSubs = subs.filter((sub) => sub.total > 0);
  if (activeSubs.length === 0) return 0;
  // Average of each subject's individual percentage
  const sum = activeSubs.reduce((s, sub) => s + getPercentage(sub.attended, sub.total), 0);
  return Math.round(sum / activeSubs.length);
}

export function getOverallCounts(subs: SubjectData[]): { attended: number; total: number } {
  const attended = subs.reduce((s, sub) => s + sub.attended, 0);
  const total = subs.reduce((s, sub) => s + sub.total, 0);
  return { attended, total };
}

export const notifications = [
  { id: 1, message: "DBMS class in 15 minutes", type: "info" as const, time: "2 min ago" },
  { id: 2, message: "Your attendance in DBMS is dropping below 80%", type: "warning" as const, time: "1 hr ago" },
  { id: 3, message: "Attend next 3 classes in MDM to stay above 75%", type: "critical" as const, time: "3 hrs ago" },
  { id: 4, message: "Good job! Your Compiler Design attendance is 96%", type: "success" as const, time: "5 hrs ago" },
  { id: 5, message: "AI Lab attendance improved this week", type: "success" as const, time: "1 day ago" },
  { id: 6, message: "Weekly report is ready to view", type: "info" as const, time: "1 day ago" },
];

export const teacherStudents = [
  { name: "Arjun Mehta", subject: "DBMS", attendance: 78, status: "warning" as Status },
  { name: "Priya Sharma", subject: "AI", attendance: 91, status: "safe" as Status },
  { name: "Ravi Kumar", subject: "Compiler Design", attendance: 62, status: "critical" as Status },
  { name: "Sneha Patel", subject: "MDM", attendance: 85, status: "safe" as Status },
  { name: "Amit Singh", subject: "OE", attendance: 72, status: "critical" as Status },
  { name: "Neha Gupta", subject: "DBMS Lab", attendance: 88, status: "safe" as Status },
  { name: "Karan Joshi", subject: "AI Lab", attendance: 74, status: "critical" as Status },
  { name: "Divya Rao", subject: "Software-II Lab", attendance: 80, status: "warning" as Status },
];

export const weeklyData = [
  { day: "Monday", attended: 3, missed: 2 },
  { day: "Tuesday", attended: 4, missed: 0 },
  { day: "Wednesday", attended: 3, missed: 1 },
  { day: "Thursday", attended: 4, missed: 1 },
  { day: "Friday", attended: 2, missed: 1 },
];
