import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { AppLayout } from "@/layouts/app-layout";
import { tokenStore } from "@/api/client";

export const Route = createFileRoute("/app")({
  beforeLoad: ({ location }) => {
    if (typeof window !== "undefined" && !tokenStore.get()) {
      throw redirect({ to: "/login", search: { redirect: location.href } as any });
    }
  },
  component: () => (
    <AppLayout>
      <Outlet />
    </AppLayout>
  ),
});
