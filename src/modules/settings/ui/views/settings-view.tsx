"use client";

import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/auth-client";

type LinkedAccount = { provider: string };

const GOOGLE_SCOPES = [
  "https://www.googleapis.com/auth/calendar.events",
  "https://www.googleapis.com/auth/gmail.compose",
];

export function SettingsView() {
  const [accounts, setAccounts] = useState<LinkedAccount[] | null>(null);

  const refresh = async () => {
    const { data } = await authClient.listAccounts();
    setAccounts(data ?? []);
  };

  useEffect(() => {
    void refresh();
  }, []);

  const connected = (providerId: string) =>
    accounts?.some((a) => a.provider === providerId) ?? false;

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
            {connected("google") ? "Connected" : "Not connected"}
          </p>
        </div>
        {connected("google") ? (
          <Button
            variant="outline"
            size="sm"
            onClick={async () => {
              await authClient.unlinkAccount({ providerId: "google" });
              await refresh();
            }}
          >
            Disconnect
          </Button>
        ) : (
          <Button
            size="sm"
            onClick={() =>
              authClient.linkSocial({
                provider: "google",
                scopes: GOOGLE_SCOPES,
                callbackURL: "/settings",
              })
            }
          >
            Connect
          </Button>
        )}
      </div>
    </div>
  );
}
