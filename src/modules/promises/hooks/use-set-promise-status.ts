"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { useTRPC } from "@/trpc/client";

type PromiseStatus = "open" | "done" | "dropped";
type PromiseRow = { id: string; status: PromiseStatus; [key: string]: unknown };
type RosterData = { openPromises: PromiseRow[]; [key: string]: unknown };

export function useSetPromiseStatusMutation() {
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  return useMutation(
    trpc.promises.setStatus.mutationOptions({
      onMutate: async (vars) => {
        await queryClient.cancelQueries(trpc.promises.getMany.queryFilter());
        await queryClient.cancelQueries(trpc.people.roster.queryFilter());

        const previousPromises = queryClient.getQueriesData<PromiseRow[]>(
          trpc.promises.getMany.queryFilter(),
        );
        const previousRoster = queryClient.getQueriesData<RosterData>(
          trpc.people.roster.queryFilter(),
        );

        queryClient.setQueriesData<PromiseRow[]>(
          trpc.promises.getMany.queryFilter(),
          (old) =>
            old?.map((p) => (p.id === vars.id ? { ...p, status: vars.status } : p)),
        );
        queryClient.setQueriesData<RosterData>(
          trpc.people.roster.queryFilter(),
          (old) =>
            old && {
              ...old,
              openPromises:
                vars.status === "open"
                  ? old.openPromises
                  : old.openPromises.filter((p) => p.id !== vars.id),
            },
        );

        return { previousPromises, previousRoster };
      },
      onError: (_err, _vars, ctx) => {
        ctx?.previousPromises.forEach(([key, data]) => {
          queryClient.setQueryData(key, data);
        });
        ctx?.previousRoster.forEach(([key, data]) => {
          queryClient.setQueryData(key, data);
        });
      },
      onSettled: () => {
        void queryClient.invalidateQueries(trpc.promises.getMany.queryFilter());
        void queryClient.invalidateQueries(trpc.people.roster.queryFilter());
      },
    }),
  );
}
