"use client";

import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { LoadingState } from "@/components/loading-state";
import { useTRPC } from "@/trpc/client";

export function PromisesView() {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const list = useQuery(trpc.promises.getMany.queryOptions({ status: "open" }));
  const setStatus = useMutation(
    trpc.promises.setStatus.mutationOptions({
      onSuccess: () => {
        void queryClient.invalidateQueries();
      },
    }),
  );

  if (list.isPending) {
    return <LoadingState title="Loading promises" description="Open follow-through" />;
  }

  return (
    <div className="flex flex-col gap-4 py-4 px-4 md:px-8">
      <h1 className="text-2xl font-semibold">Promises</h1>
      {(list.data ?? []).map((item) => (
        <div
          key={item.id}
          className="bg-background rounded-lg border p-4 flex items-center justify-between gap-3"
        >
          <div>
            <p className="text-sm">{item.text}</p>
            <Link
              href={`/people/${item.personId}`}
              className="text-xs text-muted-foreground"
            >
              {item.personName}
            </Link>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="secondary">{item.status}</Badge>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setStatus.mutate({ id: item.id, status: "done" })}
            >
              Done
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
}
