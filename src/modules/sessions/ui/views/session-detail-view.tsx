"use client";

import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useParams } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { LoadingState } from "@/components/loading-state";
import { ErrorState } from "@/components/error-state";
import { useTRPC } from "@/trpc/client";

function Lane({
  label,
  text,
  active,
}: {
  label: string;
  text?: string | null;
  active?: boolean;
}) {
  return (
    <div
      className={`rounded-lg border p-4 min-h-32 ${active ? "ring-2 ring-emerald-500" : "bg-background"}`}
    >
      <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="mt-2 text-sm whitespace-pre-wrap">{text || "—"}</p>
    </div>
  );
}

export function SessionDetailView() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const session = useQuery({
    ...trpc.sessions.getOne.queryOptions({ id: sessionId }),
    refetchInterval: (query) => {
      const status = query.state.data?.status;
      return status === "completed" || status === "failed" ? false : 2000;
    },
  });
  const stop = useMutation(
    trpc.sessions.stop.mutationOptions({
      onSuccess: () => {
        void queryClient.invalidateQueries(
          trpc.sessions.getOne.queryFilter({ id: sessionId }),
        );
        void queryClient.invalidateQueries(trpc.sessions.getMany.queryFilter());
      },
    }),
  );

  if (session.isPending) {
    return <LoadingState title="Loading session" description="Observer, not the call" />;
  }
  if (!session.data) {
    return <ErrorState title="Not found" description="Session missing" />;
  }

  const data = session.data;
  const participants = data.participantsJson
    ? (JSON.parse(data.participantsJson) as string[])
    : [];

  return (
    <div className="flex flex-col gap-4 py-4 px-4 md:px-8">
      <Link href="/sessions" className="text-sm text-muted-foreground">
        Sessions
      </Link>
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Live observer</h1>
          <p className="text-sm text-muted-foreground break-all">{data.meetingUrl}</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge>{data.status}</Badge>
          {(data.status === "queued" || data.status === "in_call") && (
            <Button
              variant="outline"
              onClick={() => stop.mutate({ id: data.id })}
              disabled={stop.isPending}
            >
              Remove Pocketless
            </Button>
          )}
        </div>
      </div>
      {data.personId && (
        <Link href={`/people/${data.personId}`} className="text-sm underline">
          Open person card
        </Link>
      )}
      <div className="grid md:grid-cols-3 gap-3">
        <Lane label="You" text={data.liveYou} />
        <Lane label="Them" text={data.liveThem} />
        <Lane
          label="Pocketless"
          text={data.livePocketless}
          active={data.agentStatus === "speaking"}
        />
      </div>
      <p className="text-sm text-muted-foreground">
        Agent: {data.agentStatus}
        {data.lastTool ? ` · last tool ${data.lastTool}` : ""}
      </p>
      {participants.length > 0 && (
        <p className="text-sm">In Meet: {participants.join(", ")}</p>
      )}
    </div>
  );
}
