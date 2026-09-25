"use client";

import Link from "next/link";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { PlusIcon } from "lucide-react";
import { useParams } from "next/navigation";
import ReactMarkdown from "react-markdown";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { GeneratedAvatar } from "@/components/generated-avatar";
import { LoadingState } from "@/components/loading-state";
import { ErrorState } from "@/components/error-state";
import { useTRPC } from "@/trpc/client";
import { SendPocketlessDialog } from "@/modules/sessions/ui/components/send-pocketless-dialog";
import { MindMap } from "@/modules/people/ui/components/mind-map";
import { Badge } from "@/components/ui/badge";

export function PersonView() {
  const { personId } = useParams<{ personId: string }>();
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const [sendOpen, setSendOpen] = useState(false);
  const [message, setMessage] = useState("");

  const person = useQuery(trpc.people.getOne.queryOptions({ id: personId }));
  const episodeList = useQuery(
    trpc.episodes.getMany.queryOptions({ personId }),
  );
  const promiseList = useQuery(
    trpc.promises.getMany.queryOptions({ personId }),
  );
  const talk = useQuery(trpc.talk.history.queryOptions({ personId }));
  const graph = useQuery(trpc.people.graph.queryOptions({ personId }));
  const send = useMutation(
    trpc.talk.send.mutationOptions({
      onSuccess: () => {
        setMessage("");
        void queryClient.invalidateQueries(
          trpc.talk.history.queryFilter({ personId }),
        );
      },
    }),
  );
  const setStatus = useMutation(
    trpc.promises.setStatus.mutationOptions({
      onSuccess: () => {
        void queryClient.invalidateQueries();
      },
    }),
  );

  if (person.isPending) {
    return <LoadingState title="Loading person" description="Memory card" />;
  }
  if (!person.data) {
    return (
      <ErrorState title="Not found" description="This person is not in your roster." />
    );
  }

  return (
    <>
      <SendPocketlessDialog
        open={sendOpen}
        onOpenChange={setSendOpen}
        personId={person.data.id}
        personName={person.data.name}
      />
      <div className="flex flex-col gap-6 py-4 px-4 md:px-8">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <GeneratedAvatar
              seed={person.data.name}
              variant="initials"
              className="size-12"
            />
            <div>
              <Link href="/" className="text-xs text-muted-foreground">
                Roster
              </Link>
              <h1 className="text-2xl font-semibold">{person.data.name}</h1>
            </div>
          </div>
          <Button onClick={() => setSendOpen(true)}>
            <PlusIcon />
            Send Pocketless
          </Button>
        </div>

        <div className="bg-background rounded-lg border p-4 prose prose-sm max-w-none">
          <p className="text-xs uppercase text-muted-foreground mb-2">Brief</p>
          <ReactMarkdown>{person.data.relationshipBrief || "_No brief yet._"}</ReactMarkdown>
        </div>

        <Tabs defaultValue="talk">
          <TabsList>
            <TabsTrigger value="talk">Talk to Pocketless</TabsTrigger>
            <TabsTrigger value="promises">Promises</TabsTrigger>
            <TabsTrigger value="episodes">Episodes</TabsTrigger>
            <TabsTrigger value="mind-map">Mind map</TabsTrigger>
          </TabsList>
          <TabsContent value="talk" className="bg-background rounded-lg border p-4">
            <ScrollArea className="h-[320px] pr-3">
              <div className="flex flex-col gap-3">
                {(talk.data ?? []).map((item) => (
                  <div
                    key={item.id}
                    className={
                      item.role === "user"
                        ? "ml-12 rounded-lg bg-muted p-3 text-sm"
                        : "mr-12 rounded-lg border p-3 text-sm"
                    }
                  >
                    {item.content}
                  </div>
                ))}
              </div>
            </ScrollArea>
            <form
              className="mt-3 flex gap-2"
              onSubmit={(event) => {
                event.preventDefault();
                if (!message.trim()) return;
                send.mutate({ personId, content: message.trim() });
              }}
            >
              <Input
                placeholder="Ask Pocketless about this person"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
              />
              <Button type="submit" disabled={send.isPending}>
                Send
              </Button>
            </form>
          </TabsContent>
          <TabsContent value="promises" className="grid gap-2">
            {(promiseList.data ?? []).map((item) => (
              <div
                key={item.id}
                className="bg-background rounded-lg border p-3 flex items-center justify-between gap-3"
              >
                <div>
                  <p className="text-sm">{item.text}</p>
                  <Badge variant="secondary" className="mt-1">
                    {item.status}
                  </Badge>
                </div>
                {item.status === "open" && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() =>
                      setStatus.mutate({ id: item.id, status: "done" })
                    }
                  >
                    Done
                  </Button>
                )}
              </div>
            ))}
          </TabsContent>
          <TabsContent value="episodes" className="grid gap-2">
            {(episodeList.data ?? []).map((item) => (
              <Link
                key={item.id}
                href={`/episodes/${item.id}`}
                className="bg-background rounded-lg border p-3 hover:bg-muted/40"
              >
                <p className="font-medium">{item.title}</p>
                <p className="text-xs text-muted-foreground">
                  {format(item.occurredAt, "MMM d, yyyy")}
                </p>
                <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                  {item.brief}
                </p>
              </Link>
            ))}
          </TabsContent>
          <TabsContent value="mind-map" className="bg-background rounded-lg border p-4">
            <MindMap nodes={graph.data?.nodes ?? []} edges={graph.data?.edges ?? []} />
          </TabsContent>
        </Tabs>
      </div>
    </>
  );
}
