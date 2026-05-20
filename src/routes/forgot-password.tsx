import { createFileRoute, Link } from "@tanstack/react-router";
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

const schema = z.object({ email: z.string().email() });
type FV = z.infer<typeof schema>;

export const Route = createFileRoute("/forgot-password")({ component: Page });

function Page() {
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);
  const { register, handleSubmit, formState: { errors } } = useForm<FV>({ resolver: zodResolver(schema) });

  const onSubmit = async (v: FV) => {
    setSubmitting(true);
    try { await authService.forgot(v.email); setSent(true); toast.success("Reset email sent"); }
    catch (e: any) { toast.error(e?.message ?? "Failed"); }
    finally { setSubmitting(false); }
  };

  return (
    <AuthLayout title="Reset your password" subtitle="We'll send a reset link to your email.">
      {sent ? (
        <div className="space-y-4">
          <div className="rounded-md border bg-success/10 px-4 py-3 text-sm text-foreground">
            If an account exists, a reset link is on its way.
          </div>
          <Link to="/login"><Button variant="outline" className="w-full">Back to sign in</Button></Link>
        </div>
      ) : (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" {...register("email")} />
            {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
          </div>
          <Button type="submit" className="w-full" disabled={submitting}>
            {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Send reset link
          </Button>
          <Link to="/login" className="block text-center text-xs text-muted-foreground hover:text-foreground">
            Back to sign in
          </Link>
        </form>
      )}
    </AuthLayout>
  );
}
