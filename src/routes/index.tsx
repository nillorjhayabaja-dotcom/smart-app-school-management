import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, BrainCircuit, CalendarRange, LineChart, ShieldCheck, Sparkles, Users } from "lucide-react";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Workforce IQ — Smart Workforce Allocation" },
      { name: "description", content: "Predictive and prescriptive analytics platform for workforce allocation and performance improvement." },
    ],
  }),
  component: Landing,
});

const features = [
  { icon: LineChart, title: "Predictive Analytics", desc: "Forecast enrollment, retention, and workload trends with ML-backed models." },
  { icon: BrainCircuit, title: "Prescriptive Recommendations", desc: "Actionable, ranked suggestions to rebalance teams and reduce burnout." },
  { icon: Users, title: "Skill-Based Matching", desc: "Match teachers to subjects using competency, performance, and preference signals." },
  { icon: CalendarRange, title: "Flexible Scheduling", desc: "Drag-and-drop scheduling with automatic conflict detection." },
  { icon: ShieldCheck, title: "Role-Based Access", desc: "Super Admin, HR, Department Head and Viewer roles with fine-grained auditing." },
  { icon: Sparkles, title: "Real-time Insights", desc: "Dashboards that surface risk heatmaps and KPIs at a glance." },
];

function Landing() {
  return (
    <div className="min-h-dvh bg-background">
      <header className="sticky top-0 z-30 border-b bg-background/80 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link to="/" className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-md bg-primary text-primary-foreground">
              <Sparkles className="h-4 w-4" />
            </div>
            <span className="text-sm font-semibold tracking-tight">Workforce IQ</span>
          </Link>
          <div className="flex items-center gap-2">
            <Link to="/login"><Button variant="ghost" size="sm">Sign in</Button></Link>
            <Link to="/login"><Button size="sm">Get started <ArrowRight className="ml-1.5 h-4 w-4" /></Button></Link>
          </div>
        </div>
      </header>

      <section className="relative overflow-hidden">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(60%_60%_at_50%_0%,color-mix(in_oklab,var(--primary)_18%,transparent),transparent)]" />
        <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8 lg:py-28">
          <div className="mx-auto max-w-3xl text-center">
            <span className="inline-flex items-center gap-2 rounded-full border bg-card px-3 py-1 text-xs font-medium text-muted-foreground">
              <span className="h-1.5 w-1.5 rounded-full bg-success" /> Capstone Research · Predictive + Prescriptive
            </span>
            <h1 className="mt-5 text-4xl font-semibold tracking-tight text-foreground sm:text-5xl lg:text-6xl">
              A smarter way to allocate your workforce.
            </h1>
            <p className="mx-auto mt-5 max-w-2xl text-base text-muted-foreground sm:text-lg">
              Workforce IQ blends predictive forecasting with prescriptive recommendations to optimize teacher distribution, balance workloads, and improve retention — all from one workspace.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <Link to="/login"><Button size="lg">Launch dashboard <ArrowRight className="ml-1.5 h-4 w-4" /></Button></Link>
              <a href="#features"><Button size="lg" variant="outline">Explore features</Button></a>
            </div>
          </div>

          <div className="mx-auto mt-16 max-w-5xl rounded-2xl border bg-card p-2 shadow-[var(--shadow-elevated)]">
            <div className="rounded-xl bg-gradient-to-br from-accent to-background p-6">
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                {[
                  { k: "1,842", v: "Forecast enrollment" },
                  { k: "94.2%", v: "Model accuracy" },
                  { k: "−28%", v: "Conflicts resolved" },
                  { k: "+12pp", v: "Retention lift" },
                ].map((s) => (
                  <div key={s.v} className="rounded-lg border bg-card p-4">
                    <p className="text-2xl font-semibold tracking-tight">{s.k}</p>
                    <p className="text-xs text-muted-foreground">{s.v}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="features" className="border-t bg-muted/30 py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-semibold tracking-tight">Everything your workforce team needs</h2>
            <p className="mt-3 text-muted-foreground">From signal to decision — one cohesive platform.</p>
          </div>
          <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((f) => {
              const Icon = f.icon;
              return (
                <div key={f.title} className="rounded-xl border bg-card p-6 transition-colors hover:bg-accent/40">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <Icon className="h-5 w-5" />
                  </div>
                  <h3 className="mt-4 text-base font-semibold">{f.title}</h3>
                  <p className="mt-1.5 text-sm text-muted-foreground">{f.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <footer className="border-t py-8">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-3 px-4 text-xs text-muted-foreground sm:flex-row sm:px-6 lg:px-8">
          <p>© 2026 Workforce IQ · Capstone Project</p>
          
        </div>
      </footer>
    </div>
  );
}
