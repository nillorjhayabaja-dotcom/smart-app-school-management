import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/shared/page-header";
import { ChartCard } from "@/components/shared/chart-card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

export const Route = createFileRoute("/app/profile")({
  head: () => ({ meta: [{ title: "Profile · Workforce IQ" }] }),
  component: Page,
});

const roleLabels: Record<string, string> = {
  super_admin: "Super Admin", hr_admin: "HR Admin",
  department_head: "Department Head", viewer: "Viewer",
};

function Page() {
  const { user } = useAuth();
  const initials = user?.name?.split(" ").map((s) => s[0]).slice(0,2).join("").toUpperCase() ?? "U";

  return (
    <div className="space-y-6">
      <PageHeader title="User Profile" description="Manage your personal information and security." />

      <ChartCard title="Account" description="Your identity and role">
        <div className="flex flex-col items-start gap-5 sm:flex-row sm:items-center">
          <Avatar className="h-16 w-16"><AvatarFallback className="text-lg">{initials}</AvatarFallback></Avatar>
          <div className="flex-1">
            <p className="text-lg font-semibold">{user?.name ?? "User"}</p>
            <p className="text-sm text-muted-foreground">{user?.email}</p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              <Badge variant="secondary">{user ? roleLabels[user.role] : "—"}</Badge>
              <Badge variant="secondary">{user?.department ?? "Administration"}</Badge>
            </div>
          </div>
          <Button variant="outline">Change avatar</Button>
        </div>
      </ChartCard>

      <ChartCard title="Personal Information">
        <form onSubmit={(e) => { e.preventDefault(); toast.success("Profile updated"); }} className="grid gap-4 sm:grid-cols-2">
          <div><Label>Full name</Label><Input className="mt-1.5" defaultValue={user?.name ?? ""} /></div>
          <div><Label>Email</Label><Input className="mt-1.5" defaultValue={user?.email ?? ""} /></div>
          <div><Label>Department</Label><Input className="mt-1.5" defaultValue={user?.department ?? ""} /></div>
          <div><Label>Phone</Label><Input className="mt-1.5" placeholder="+63 …" /></div>
          <div className="sm:col-span-2"><Button type="submit">Save</Button></div>
        </form>
      </ChartCard>

      <ChartCard title="Security">
        <form onSubmit={(e) => { e.preventDefault(); toast.success("Password changed"); }} className="grid gap-4 sm:grid-cols-2">
          <div><Label>Current password</Label><Input type="password" className="mt-1.5" /></div>
          <div><Label>New password</Label><Input type="password" className="mt-1.5" /></div>
          <div className="sm:col-span-2"><Button type="submit">Update password</Button></div>
        </form>
      </ChartCard>
    </div>
  );
}
