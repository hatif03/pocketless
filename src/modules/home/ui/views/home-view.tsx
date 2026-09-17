"use client";

import Link from "next/link";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns";
import { PlusIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { GeneratedAvatar } from "@/components/generated-avatar";
import { LoadingState } from "@/components/loading-state";
import { EmptyState } from "@/components/empty-state";
import { useTRPC } from "@/trpc/client";
import { SendPocketlessDialog } from "@/modules/sessions/ui/components/send-pocketless-dialog";

export function HomeView() {
  const trpc = useTRPC();
  const { data, isPending } = useQuery(trpc.people.roster.queryOptions());
  const [sendOpen, setSendOpen] = useState(false);

  if (isPending) {
    return (
      <LoadingState title="Loading roster" description="People and promises" />
    );
  }

  const people = data?.people ?? [];
  const openPromises = data?.openPromises ?? [];

  return (
    <>
      <SendPocketlessDialog open={sendOpen} onOpenChange={setSendOpen} />
      <div className="flex flex-col gap-6 py-4 px-4 md:px-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold">People</h1>
            <p className="text-sm text-muted-foreground">
              Memory lives here. Pocketless joins their Google Meet.
            </p>
          </div>
          <Button onClick={() => setSendOpen(true)}>
            <PlusIcon />
            Send Pocketless
          </Button>
        </div>

        {people.length === 0 ? (
          <EmptyState
            title="No people yet"
            description="Priya should seed on first load. Refresh if this is empty."
          />
        ) : (
          <div className="grid gap-3">
            {people.map((person) => (
              <Link
                key={person.id}
                href={`/people/${person.id}`}
                className="bg-background rounded-lg border p-4 flex items-start gap-3 hover:bg-muted/40"
              >
                <GeneratedAvatar
                  seed={person.name}
                  variant="initials"
                  className="size-10"
                />
                <div className="min-w-0 flex-1">
                  <p className="font-medium">{person.name}</p>
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {person.relationshipBrief}
                  </p>
                  {person.lastSpokeAt && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Last spoke{" "}
                      {formatDistanceToNow(person.lastSpokeAt, {
                        addSuffix: true,
                      })}
                    </p>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}

        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-medium">Open promises</h2>
            <Button variant="ghost" asChild>
              <Link href="/promises">View all</Link>
            </Button>
          </div>
          {openPromises.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nothing open.</p>
          ) : (
            <div className="grid gap-2">
              {openPromises.map((item) => (
                <div key={item.id} className="bg-background rounded-lg border p-3 text-sm">
                  {item.text}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
