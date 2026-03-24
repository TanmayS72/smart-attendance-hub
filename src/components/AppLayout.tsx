import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { LayoutDashboard, Calculator, CalendarDays, Bell, GraduationCap, LogOut, Trophy } from "lucide-react";
import { ThemeToggle } from "./ThemeToggle";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import type { ReactNode } from "react";

const studentNavItems = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/planner", label: "Planner", icon: Calculator },
  { to: "/weekly", label: "Weekly Report", icon: CalendarDays },
  { to: "/notifications", label: "Notifications", icon: Bell },
  { to: "/leaderboard", label: "Leaderboard", icon: Trophy },
];

const teacherNavItems = [
  { to: "/teacher", label: "Teacher Panel", icon: GraduationCap },
];

function SidebarLink({ to, label, icon: Icon }: (typeof studentNavItems)[0]) {
  const location = useLocation();
  const active = location.pathname === to;
  return (
    <NavLink
      to={to}
      className={cn(
        "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
        active
          ? "bg-primary text-primary-foreground shadow-sm"
          : "text-muted-foreground hover:bg-accent hover:text-foreground"
      )}
    >
      <Icon className="h-4 w-4 shrink-0" />
      <span>{label}</span>
    </NavLink>
  );
}

export function AppLayout({ children }: { children: ReactNode }) {
  const { role, signOut, updateRole } = useAuth();
  const navigate = useNavigate();
  const navItems = role === "teacher" || role === "admin" ? teacherNavItems : studentNavItems;

  const handleLogout = async () => {
    await signOut();
    navigate("/");
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Desktop sidebar */}
      <div className="hidden md:flex">
        <aside className="fixed inset-y-0 left-0 w-60 border-r bg-card flex flex-col z-30">
          <div className="p-5 border-b">
            <h1 className="text-lg font-bold tracking-tight">📋 Smart Attendance</h1>
          </div>
          <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
            {navItems.map((item) => (
              <SidebarLink key={item.to} {...item} />
            ))}
          </nav>
          <div className="p-3 border-t space-y-2">
            {role === "student" && (
              <button
                onClick={() => updateRole("teacher").then(() => navigate("/teacher"))}
                className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold bg-primary/10 text-primary hover:bg-primary/20 transition-colors border border-primary/20"
              >
                <GraduationCap className="h-4 w-4" />
                Switch to Teacher View
              </button>
            )}
            <div className="flex items-center justify-between">
              <ThemeToggle />
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                <LogOut className="h-4 w-4" />
                Logout
              </button>
            </div>
          </div>
        </aside>
        <main className="flex-1 ml-60 min-h-screen">
          <div className="max-w-6xl mx-auto p-6 lg:p-8">{children}</div>
        </main>
      </div>

      {/* Mobile layout */}
      <div className="md:hidden flex flex-col min-h-screen">
        <header className="sticky top-0 z-30 bg-card/80 backdrop-blur-lg border-b px-4 py-3 flex items-center justify-between gap-3">
          <h1 className="text-base font-bold truncate">📋 Smart Attendance</h1>
          <div className="flex items-center gap-2">
            {role === "student" && (
              <button
                onClick={() => updateRole("teacher").then(() => navigate("/teacher"))}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-primary/10 text-primary border border-primary/20 transition-colors"
                title="Switch to Teacher View"
              >
                <GraduationCap className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Teacher View</span>
              </button>
            )}
            <ThemeToggle />
          </div>
        </header>
        <main className="flex-1 p-4 pb-20">{children}</main>
        <nav className="fixed bottom-0 inset-x-0 z-30 bg-card/80 backdrop-blur-lg border-t flex justify-around py-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  cn(
                    "flex flex-col items-center gap-0.5 px-2 py-1 text-[10px] font-medium transition-colors",
                    isActive ? "text-primary" : "text-muted-foreground"
                  )
                }
              >
                <Icon className="h-5 w-5" />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </nav>
      </div>
    </div>
  );
}
