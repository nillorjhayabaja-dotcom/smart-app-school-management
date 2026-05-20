import { Link, useRouterState, useNavigate } from "@tanstack/react-router";
import { useTheme } from "@/lib/theme";
import { useAuth } from "@/lib/auth";
import {
  LayoutDashboard, Users, LineChart, ShieldAlert, Sparkles, Network,
  Puzzle, Activity, CalendarRange, FileBarChart2, ScrollText, Settings, UserCircle,
  Sun, Moon, LogOut, Bell, Search, Menu, X,
} from "lucide-react";
import { useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

const nav = [
  { group: "Overview", items: [
    { to: "/app/dashboard", label: "Dashboard", icon: LayoutDashboard },
  ]},
  { group: "Workforce", items: [
    { to: "/app/employees", label: "Employee Management", icon: Users },
    { to: "/app/allocation", label: "Workforce Allocation", icon: Network },
    { to: "/app/matching", label: "Skill-Based Matching", icon: Puzzle },
    { to: "/app/workload", label: "Workload Distribution", icon: Activity },
    { to: "/app/scheduling", label: "Flexible Scheduling", icon: CalendarRange },
  ]},
  { group: "Intelligence", items: [
    { to: "/app/predictive", label: "Predictive Analytics", icon: LineChart },
    { to: "/app/risk", label: "Risk Assessment", icon: ShieldAlert },
    { to: "/app/recommendations", label: "Recommendations", icon: Sparkles },
  ]},
  { group: "System", items: [
    { to: "/app/reports", label: "Reports", icon: FileBarChart2 },
    { to: "/app/audit", label: "Audit Logs", icon: ScrollText },
    { to: "/app/settings", label: "Settings", icon: Settings },
    { to: "/app/profile", label: "Profile", icon: UserCircle },
  ]},
];

const roleLabels: Record<string, string> = {
  super_admin: "Super Admin",
  hr_admin: "HR Admin",
  department_head: "Department Head",
  viewer: "Viewer",
};

export function AppLayout({ children }: { children: ReactNode }) {
  const { theme, toggle } = useTheme();
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [mobileOpen, setMobileOpen] = useState(false);

  const initials = user?.name?.split(" ").map((s) => s[0]).slice(0, 2).join("").toUpperCase() ?? "U";

  return (
    <div className="flex min-h-dvh bg-background">
      {/* Sidebar */}
      <aside className={cn(
        "fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r bg-sidebar text-sidebar-foreground transition-transform lg:static lg:translate-x-0",
        mobileOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="flex h-14 items-center justify-between border-b border-sidebar-border px-4">
          <Link to="/app/dashboard" className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-md bg-primary text-primary-foreground">
              <Sparkles className="h-4 w-4" />
            </div>
            <span className="text-sm font-semibold tracking-tight">Workforce IQ</span>
          </Link>
          <button className="lg:hidden" onClick={() => setMobileOpen(false)} aria-label="Close menu">
            <X className="h-5 w-5" />
          </button>
        </div>
        <nav className="flex-1 overflow-y-auto px-2 py-4">
          {nav.map((group) => (
            <div key={group.group} className="mb-4">
              <p className="px-3 pb-1.5 text-[10px] font-semibold uppercase tracking-wider text-sidebar-foreground/50">{group.group}</p>
              <ul className="space-y-0.5">
                {group.items.map((item) => {
                  const active = pathname.startsWith(item.to);
                  const Icon = item.icon;
                  return (
                    <li key={item.to}>
                      <Link
                        to={item.to}
                        onClick={() => setMobileOpen(false)}
                        className={cn(
                          "group flex items-center gap-2.5 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                          active
                            ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-sm"
                            : "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                        )}
                      >
                        <Icon className={cn("h-4 w-4", active ? "" : "text-sidebar-foreground/60")} />
                        <span className="truncate">{item.label}</span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </nav>
        <div className="border-t border-sidebar-border p-3 text-xs text-sidebar-foreground/60">
          <p>v1.0 · Capstone</p>
        </div>
      </aside>

      {/* Overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-30 bg-black/50 lg:hidden" onClick={() => setMobileOpen(false)} />
      )}

      {/* Main */}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-20 flex h-14 items-center gap-3 border-b bg-background/80 px-4 backdrop-blur sm:px-6">
          <button className="lg:hidden" onClick={() => setMobileOpen(true)} aria-label="Open menu">
            <Menu className="h-5 w-5" />
          </button>
          <div className="relative hidden flex-1 max-w-md md:block">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="search"
              placeholder="Search employees, reports, recommendations…"
              className="h-9 w-full rounded-md border bg-card pl-9 pr-3 text-sm outline-none ring-ring/40 transition focus:ring-2"
            />
          </div>
          <div className="ml-auto flex items-center gap-1">
            <Button variant="ghost" size="icon" onClick={toggle} aria-label="Toggle theme">
              {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </Button>
            <Button variant="ghost" size="icon" aria-label="Notifications">
              <Bell className="h-4 w-4" />
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="ml-1 flex items-center gap-2 rounded-md p-1 pr-2 hover:bg-accent">
                  <Avatar className="h-7 w-7">
                    <AvatarFallback className="text-xs">{initials}</AvatarFallback>
                  </Avatar>
                  <div className="hidden text-left sm:block">
                    <p className="text-xs font-medium leading-tight">{user?.name ?? "User"}</p>
                    <p className="text-[10px] text-muted-foreground leading-tight">{user ? roleLabels[user.role] : ""}</p>
                  </div>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-52">
                <DropdownMenuLabel>{user?.email}</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => navigate({ to: "/app/profile" })}>
                  <UserCircle className="mr-2 h-4 w-4" /> Profile
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate({ to: "/app/settings" })}>
                  <Settings className="mr-2 h-4 w-4" /> Settings
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={async () => { await logout(); navigate({ to: "/login" }); }}>
                  <LogOut className="mr-2 h-4 w-4" /> Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>
        <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8">
          <div className="mx-auto w-full max-w-7xl space-y-6">{children}</div>
        </main>
      </div>
    </div>
  );
}
