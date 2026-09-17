import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { Dispatch, SetStateAction, useState } from "react";

import {
  CommandResponsiveDialog,
  CommandInput,
  CommandItem,
  CommandList,
  CommandGroup,
  CommandEmpty,
} from "@/components/ui/command";
import { useTRPC } from "@/trpc/client";
import { GeneratedAvatar } from "@/components/generated-avatar";

interface Props {
  open: boolean;
  setOpen: Dispatch<SetStateAction<boolean>>;
}

export const DashboardCommand = ({ open, setOpen }: Props) => {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const trpc = useTRPC();
  const people = useQuery(trpc.people.search.queryOptions({ query: search }));
  const sessions = useQuery(trpc.sessions.getMany.queryOptions());

  return (
    <CommandResponsiveDialog
      shouldFilter={false}
      open={open}
      onOpenChange={setOpen}
    >
      <CommandInput
        placeholder="Find a person or session…"
        value={search}
        onValueChange={setSearch}
      />
      <CommandList>
        <CommandGroup heading="People">
          <CommandEmpty>
            <span className="text-muted-foreground text-sm">No people found</span>
          </CommandEmpty>
          {(people.data ?? []).map((person) => (
            <CommandItem
              key={person.id}
              onSelect={() => {
                router.push(`/people/${person.id}`);
                setOpen(false);
              }}
            >
              <GeneratedAvatar
                seed={person.name}
                variant="initials"
                className="size-5"
              />
              {person.name}
            </CommandItem>
          ))}
        </CommandGroup>
        <CommandGroup heading="Sessions">
          {(sessions.data ?? [])
            .filter((item) =>
              item.meetingUrl.toLowerCase().includes(search.toLowerCase()),
            )
            .slice(0, 8)
            .map((item) => (
              <CommandItem
                key={item.id}
                onSelect={() => {
                  router.push(`/sessions/${item.id}`);
                  setOpen(false);
                }}
              >
                {item.provider} · {item.status}
              </CommandItem>
            ))}
        </CommandGroup>
      </CommandList>
    </CommandResponsiveDialog>
  );
};
