import { createFileRoute, redirect } from "@tanstack/react-router";
import { PageHeader } from "@/components/shared/page-header";
import { ChartCard } from "@/components/shared/chart-card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/lib/theme";
import { toast } from "sonner";

// Only super_admin can access settings
const checkAccess = (ctx: any) => {
  if (ctx.auth?.user?.role !== "super_admin") {
    throw redirect({ to: "/app" });
  }
};

export const Route = createFileRoute("/app/settings")({
  head: () => ({ meta: [{ title: "Settings · Workforce IQ" }] }),
  beforeLoad: ({ context }: any) => checkAccess(context),
  component: Page,
});

function Page() {
  const { theme, toggle } = useTheme();
  return (
    <div className="space-y-6">
      <PageHeader title="Settings" description="Workspace and notification preferences." />

      <ChartCard title="Appearance" description="Theme and display options">
        <div className="flex items-center justify-between">
          <div>
            <Label className="text-sm">Dark mode</Label>
            <p className="text-xs text-muted-foreground">Toggle dark theme for the workspace.</p>
          </div>
          <Switch checked={theme === "dark"} onCheckedChange={toggle} />
        </div>
      </ChartCard>

      <ChartCard title="Notifications" description="Email and in-app preferences">
        <div className="space-y-4">
          {["High-risk teacher alerts","Weekly digest","New recommendations","Scheduling conflicts"].map((n) => (
            <div key={n} className="flex items-center justify-between">
              <Label className="text-sm">{n}</Label>
              <Switch defaultChecked />
            </div>
          ))}
        </div>
      </ChartCard>

      <ChartCard title="API Configuration" description="Backend integration settings">
        <form onSubmit={(e) => { e.preventDefault(); toast.success("Settings saved"); }} className="space-y-4">
          <div>
            <Label htmlFor="apiUrl">API URL</Label>
            <Input id="apiUrl" defaultValue={(import.meta as any).env?.VITE_API_URL ?? "http://localhost:8000/api/v1"} className="mt-1.5" />
          </div>
          <div>
            <Label htmlFor="model">Default forecasting model</Label>
            <Input id="model" defaultValue="prophet-v2" className="mt-1.5" />
          </div>
          <Button type="submit">Save changes</Button>
        </form>
      </ChartCard>
    </div>
  );
}
