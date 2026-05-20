import { Link } from "@tanstack/react-router";
import { Sparkles } from "lucide-react";
import type { ReactNode } from "react";

export function AuthLayout({ children, title, subtitle }: { children: ReactNode; title: string; subtitle?: string }) {
  return (
    <div className="grid min-h-dvh lg:grid-cols-2">
      <div className="flex items-center justify-center p-6 sm:p-10">
        <div className="w-full max-w-sm space-y-6">
          <Link to="/" className="inline-flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary text-primary-foreground">
              <Sparkles className="h-4 w-4" />
            </div>
            <span className="text-sm font-semibold tracking-tight">Workforce IQ</span>
          </Link>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
            {subtitle && <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>}
          </div>
          {children}
        </div>
      </div>
      <div className="relative hidden overflow-hidden lg:block" style={{ background: "var(--gradient-brand)" }}>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(255,255,255,0.18),transparent_50%),radial-gradient(circle_at_80%_80%,rgba(255,255,255,0.1),transparent_50%)]" />
        <div className="relative flex h-full flex-col justify-between p-12 text-white">
          <p className="text-sm uppercase tracking-[0.2em] opacity-80">Capstone · 2026</p>
          <div className="space-y-4">
            <h2 className="text-3xl font-semibold leading-tight">Predictive &amp; prescriptive intelligence for workforce allocation.</h2>
            <p className="max-w-md text-sm opacity-90">
              Forecast enrollment, balance teaching loads, and surface high-impact recommendations — all in one workspace.
            </p>
          </div>
          <div className="grid grid-cols-3 gap-4 text-xs opacity-90">
            <div><p className="text-2xl font-semibold">94%</p><p>Forecast accuracy</p></div>
            <div><p className="text-2xl font-semibold">−28%</p><p>Scheduling conflicts</p></div>
            <div><p className="text-2xl font-semibold">+12pp</p><p>Retention lift</p></div>
          </div>
        </div>
      </div>
    </div>
  );
}
