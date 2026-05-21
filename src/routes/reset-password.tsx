import { createFileRoute, Link, useNavigate, useSearch } from "@tanstack/react-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { AuthLayout } from "@/layouts/auth-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { authService } from "@/services";
import { toast } from "sonner";
import { useState, useEffect } from "react";
import { Loader2 } from "lucide-react";

const schema = z.object({
  password: z.string().min(8, "At least 8 characters"),
  confirm: z.string(),
}).refine((d) => d.password === d.confirm, { path: ["confirm"], message: "Passwords don't match" });
type FV = z.infer<typeof schema>;

export const Route = createFileRoute("/reset-password")({
  validateSearch: (search: Record<string, unknown>) => ({
    token: (search.token as string) || "",
  }),
  component: Page,
});

function Page() {
  const navigate = useNavigate();
  const { token } = useSearch({ from: "/reset-password" });
  const [submitting, setSubmitting] = useState(false);
  const [validToken, setValidToken] = useState(false);
  const { register, handleSubmit, formState: { errors } } = useForm<FV>({ resolver: zodResolver(schema) });

  useEffect(() => {
    if (!token) {
      toast.error("Invalid reset link. No token provided.");
      navigate({ to: "/login" });
    } else {
      setValidToken(true);
    }
  }, [token, navigate]);

  const onSubmit = async (v: FV) => {
    if (!validToken || !token) {
      toast.error("Invalid reset link.");
      return;
    }
    setSubmitting(true);
    try {
      await authService.reset(token, v.password);
      toast.success("Password updated. Please sign in.");
      navigate({ to: "/login" });
    } catch (e: any) { toast.error(e?.message ?? "Failed to reset password"); }
    finally { setSubmitting(false); }
  };

  if (!validToken) {
    return (
      <AuthLayout title="Invalid Link" subtitle="This password reset link is invalid or expired.">
        <Link to="/login" className="block text-center text-sm text-blue-600 hover:text-blue-700">
          Back to sign in
        </Link>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout title="Set a new password" subtitle="Choose a strong password you haven't used before.">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="password">New password</Label>
          <Input id="password" type="password" {...register("password")} />
          {errors.password && <p className="text-xs text-destructive">{errors.password.message}</p>}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="confirm">Confirm password</Label>
          <Input id="confirm" type="password" {...register("confirm")} />
          {errors.confirm && <p className="text-xs text-destructive">{errors.confirm.message}</p>}
        </div>
        <Button type="submit" className="w-full" disabled={submitting}>
          {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Update password
        </Button>
        <Link to="/login" className="block text-center text-xs text-muted-foreground hover:text-foreground">
          Back to sign in
        </Link>
      </form>
    </AuthLayout>
  );
}
