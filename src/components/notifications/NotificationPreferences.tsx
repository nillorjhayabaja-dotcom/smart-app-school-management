/**
 * NotificationPreferences — User preferences for notification delivery channels.
 * Allows toggling in-app, email, push, and SMS notifications per category.
 */

import { useCallback, useEffect, useState } from "react";
import {
  Bell,
  Mail,
  Smartphone,
  Monitor,
  Save,
  Loader2,
  Users,
  ShieldAlert,
  CalendarRange,
  GraduationCap,
  Sparkles,
  TrendingUp,
  Lock,
  Server,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { notificationService } from "@/services/notifications";
import { cn } from "@/lib/utils";
import type { NotificationCategory, NotificationPreference } from "@/types/notifications";
import { CATEGORY_CONFIG } from "@/types/notifications";

// ── Category Icons ────────────────────────────────────────────────────

const categoryIcons: Record<NotificationCategory, React.ComponentType<{ className?: string }>> = {
  workforce: Users,
  risk: ShieldAlert,
  scheduling: CalendarRange,
  enrollment: GraduationCap,
  recommendation: Sparkles,
  performance: TrendingUp,
  security: Lock,
  system: Server,
};

// ── Component ─────────────────────────────────────────────────────────

export function NotificationPreferences() {
  const [preferences, setPreferences] = useState<NotificationPreference[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const prefs = await notificationService.getPreferences();
        setPreferences(prefs);
      } catch (err) {
        console.error("Failed to load preferences:", err);
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  const updatePreference = useCallback(
    (category: NotificationCategory, channel: keyof Pick<NotificationPreference, "in_app_enabled" | "email_enabled" | "push_enabled" | "sms_enabled">, value: boolean) => {
      setPreferences((prev) =>
        prev.map((p) =>
          p.category === category ? { ...p, [channel]: value } : p
        )
      );
    },
    []
  );

  const handleSave = useCallback(async () => {
    setIsSaving(true);
    try {
      // Save all preferences
      for (const pref of preferences) {
        await notificationService.updatePreferences(pref.category, {
          in_app_enabled: pref.in_app_enabled,
          email_enabled: pref.email_enabled,
          push_enabled: pref.push_enabled,
          sms_enabled: pref.sms_enabled,
        });
      }
      toast.success("Notification preferences saved");
    } catch (err) {
      toast.error("Failed to save preferences");
    } finally {
      setIsSaving(false);
    }
  }, [preferences]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold">Notification Preferences</h2>
        <p className="text-sm text-muted-foreground">
          Configure how you receive notifications for each category
        </p>
      </div>

      <div className="rounded-lg border">
        {/* Header */}
        <div className="grid grid-cols-[1fr_80px_80px_80px_80px] gap-4 border-b bg-muted/50 px-4 py-3 text-xs font-medium text-muted-foreground">
          <div>Category</div>
          <div className="text-center">
            <Monitor className="mx-auto mb-1 h-3.5 w-3.5" />
            In-App
          </div>
          <div className="text-center">
            <Mail className="mx-auto mb-1 h-3.5 w-3.5" />
            Email
          </div>
          <div className="text-center">
            <Bell className="mx-auto mb-1 h-3.5 w-3.5" />
            Push
          </div>
          <div className="text-center">
            <Smartphone className="mx-auto mb-1 h-3.5 w-3.5" />
            SMS
          </div>
        </div>

        {/* Rows */}
        {preferences.map((pref) => {
          const config = CATEGORY_CONFIG[pref.category];
          const Icon = categoryIcons[pref.category];

          return (
            <div
              key={pref.category}
              className="grid grid-cols-[1fr_80px_80px_80px_80px] gap-4 border-b last:border-b-0 px-4 py-3 items-center hover:bg-accent/30 transition-colors"
            >
              <div className="flex items-center gap-2">
                <Icon className={cn("h-4 w-4", config.color)} />
                <span className="text-sm font-medium">{config.label}</span>
              </div>
              <div className="flex justify-center">
                <Switch
                  checked={pref.in_app_enabled}
                  onCheckedChange={(checked) =>
                    updatePreference(pref.category, "in_app_enabled", checked)
                  }
                />
              </div>
              <div className="flex justify-center">
                <Switch
                  checked={pref.email_enabled}
                  onCheckedChange={(checked) =>
                    updatePreference(pref.category, "email_enabled", checked)
                  }
                />
              </div>
              <div className="flex justify-center">
                <Switch
                  checked={pref.push_enabled}
                  onCheckedChange={(checked) =>
                    updatePreference(pref.category, "push_enabled", checked)
                  }
                />
              </div>
              <div className="flex justify-center">
                <Switch
                  checked={pref.sms_enabled}
                  onCheckedChange={(checked) =>
                    updatePreference(pref.category, "sms_enabled", checked)
                  }
                />
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex items-center justify-end gap-3">
        <Button variant="outline" size="sm" onClick={() => setPreferences(preferences)}>
          Reset
        </Button>
        <Button size="sm" onClick={handleSave} disabled={isSaving}>
          {isSaving ? (
            <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
          ) : (
            <Save className="mr-1.5 h-3.5 w-3.5" />
          )}
          Save Preferences
        </Button>
      </div>

      {/* Delivery Channel Descriptions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Delivery Channel Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-start gap-2">
            <Monitor className="mt-0.5 h-4 w-4 text-muted-foreground" />
            <div>
              <p className="text-sm font-medium">In-App Notifications</p>
              <p className="text-xs text-muted-foreground">
                Notifications displayed in the notification bell and notification center
              </p>
            </div>
          </div>
          <div className="flex items-start gap-2">
            <Mail className="mt-0.5 h-4 w-4 text-muted-foreground" />
            <div>
              <p className="text-sm font-medium">Email Notifications</p>
              <p className="text-xs text-muted-foreground">
                Notifications sent to your registered email address
              </p>
            </div>
          </div>
          <div className="flex items-start gap-2">
            <Bell className="mt-0.5 h-4 w-4 text-muted-foreground" />
            <div>
              <p className="text-sm font-medium">Push Notifications</p>
              <p className="text-xs text-muted-foreground">
                Browser push notifications (requires browser permission)
              </p>
            </div>
          </div>
          <div className="flex items-start gap-2">
            <Smartphone className="mt-0.5 h-4 w-4 text-muted-foreground" />
            <div>
              <p className="text-sm font-medium">SMS Notifications</p>
              <p className="text-xs text-muted-foreground">
                Text message notifications for critical alerts (coming soon)
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}