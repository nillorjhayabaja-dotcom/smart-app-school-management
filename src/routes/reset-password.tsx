import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { AuthLayout } from "@/layouts/auth-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { authService } from "@/services";
import { toast } from "sonner";
import { useState } from "react";
import { Loader2 } from "lucide-react";

const schema = z.object({
  password: z.string().min(8, "At least 8 characters"),
  confirm: z.string(),
}).refine((d) => d.password === d.confirm, { path: ["confirm"], message: "Passwords don't match" });
type FV = z.infer<typeof schema>;

export const Route = createFileRoute("/reset-password")({ component: Page });

function Page() {
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const { register, handleSubmit, formState: { errors } } = useForm<FV>({ resolver: zodResolver(schema) });

  const onSubmit = async (v: FV) => {
    setSubmitting(true);
    try {
      await authService.reset("token", v.password);
      toast.success("Password updated. Please sign in.");
      navigate({ to: "/login" });
    } catch (e: any) { toast.error(e?.message ?? "Failed"); }
    finally { setSubmitting(false); }
  };

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
