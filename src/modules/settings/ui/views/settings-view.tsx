"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/auth-client";
import { useTRPC } from "@/trpc/client";

const GOOGLE_SCOPES = [
  "https://www.googleapis.com/auth/calendar.events",
  "https://www.googleapis.com/auth/gmail.compose",
];

export function SettingsView() {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const googleStatus = useQuery(trpc.settings.googleStatus.queryOptions());

  const refresh = () =>
    queryClient.invalidateQueries(trpc.settings.googleStatus.queryFilter());

  const hasFullScopes = googleStatus.data?.hasFullScopes ?? false;
  const linked = googleStatus.data?.linked ?? false;

  return (
    <div className="flex flex-col gap-4 py-4 px-4 md:px-8 max-w-xl">
      <h1 className="text-2xl font-semibold">Settings</h1>
      <p className="text-sm text-muted-foreground">
        Connect Google so hold_calendar and draft_email create real Calendar
        events and Gmail drafts instead of mock placeholders.
      </p>

      <div className="bg-background rounded-lg border p-4 flex items-center justify-between">
        <div>
          <p className="text-sm font-medium">Google Calendar &amp; Gmail</p>
          <p className="text-xs text-muted-foreground">
            {hasFullScopes
              ? "Connected"
              : linked
                ? "Signed in with Google — Calendar & Gmail access not yet granted"
                : "Not connected"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {linked && (
            <Button
              variant="outline"
              size="sm"
              onClick={async () => {
                try {
                  await authClient.unlinkAccount({ providerId: "google" });
                  toast.success("Disconnected Google");
                } catch {
                  toast.error(
                    "Couldn't disconnect — Google may be your only sign-in method",
                  );
                } finally {
                  await refresh();
                }
              }}
            >
              Disconnect
            </Button>
          )}
          {!hasFullScopes && (
            <Button
              size="sm"
              onClick={async () => {
                try {
                  await authClient.linkSocial({
                    provider: "google",
                    scopes: GOOGLE_SCOPES,
                    callbackURL: "/settings",
                  });
                } catch {
                  toast.error("Couldn't start Google connect flow");
                }
              }}
            >
              {linked ? "Grant Calendar & Gmail access" : "Connect"}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
