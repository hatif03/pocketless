"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns";

import { Badge } from "@/components/ui/badge";
import { LoadingState } from "@/components/loading-state";
import { EmptyState } from "@/components/empty-state";
import { useTRPC } from "@/trpc/client";

export function SessionsView() {
  const trpc = useTRPC();
  const list = useQuery(trpc.sessions.getMany.queryOptions());

  if (list.isPending) {
    return <LoadingState title="Loading sessions" description="Audit trail only" />;
  }

  if (!list.data?.length) {
    return (
      <div className="py-4 px-4 md:px-8">
        <h1 className="text-2xl font-semibold mb-4">Sessions</h1>
        <EmptyState
          title="No sessions yet"
          description="Send Pocketless to a Google Meet from the roster."
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3 py-4 px-4 md:px-8">
      <h1 className="text-2xl font-semibold">Sessions</h1>
      <p className="text-sm text-muted-foreground">
        Audit of bots we sent. Home is still people.
      </p>
      {list.data.map((item) => (
        <Link
          key={item.id}
          href={`/sessions/${item.id}`}
          className="bg-background rounded-lg border p-4 flex items-center justify-between"
        >
          <div>
            <p className="text-sm font-medium truncate max-w-md">{item.meetingUrl}</p>
            <p className="text-xs text-muted-foreground">
              {formatDistanceToNow(item.createdAt, { addSuffix: true })}
            </p>
          </div>
          <Badge variant="secondary">{item.status}</Badge>
        </Link>
      ))}
    </div>
  );
}
