"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Highlighter from "react-highlight-words";
import { useMemo, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { format } from "date-fns";
import ReactMarkdown from "react-markdown";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { LoadingState } from "@/components/loading-state";
import { ErrorState } from "@/components/error-state";
import { useTRPC } from "@/trpc/client";

type Utterance = { speaker?: string; text: string };
type Entity = { entity_type: string; text: string };

export function EpisodeView() {
  const { episodeId } = useParams<{ episodeId: string }>();
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const episode = useQuery(trpc.episodes.getOne.queryOptions({ id: episodeId }));
  const people = useQuery(trpc.people.getMany.queryOptions());
  const [search, setSearch] = useState("");

  const setYouSpeaker = useMutation(
    trpc.episodes.setYouSpeaker.mutationOptions({
      onSuccess: () => void queryClient.invalidateQueries(),
    }),
  );
  const addToRoster = useMutation(
    trpc.people.create.mutationOptions({
      onSuccess: () => void queryClient.invalidateQueries(),
    }),
  );

  const speakers = useMemo(() => {
    if (!episode.data?.transcriptJson) return [];
    try {
      const utterances = JSON.parse(episode.data.transcriptJson) as Utterance[];
      return Array.from(
        new Set(utterances.map((u) => u.speaker).filter((s): s is string => !!s)),
      );
    } catch {
      return [];
    }
  }, [episode.data?.transcriptJson]);

  const knownNames = useMemo(() => {
    const names = new Set<string>();
    for (const person of people.data ?? []) {
      names.add(person.name.toLowerCase());
      for (const alias of (person.aliases ?? "").split(",")) {
        if (alias.trim()) names.add(alias.trim().toLowerCase());
      }
    }
    return names;
  }, [people.data]);

  const suggestedPeople = useMemo(() => {
    if (!episode.data?.entitiesJson) return [];
    try {
      const entities = JSON.parse(episode.data.entitiesJson) as Entity[];
      const names = new Set<string>();
      for (const entity of entities) {
        if (entity.entity_type !== "person_name") continue;
        if (knownNames.has(entity.text.trim().toLowerCase())) continue;
        names.add(entity.text.trim());
      }
      return Array.from(names);
    } catch {
      return [];
    }
  }, [episode.data?.entitiesJson, knownNames]);

  if (episode.isPending) {
    return <LoadingState title="Loading episode" description="One click down from the person" />;
  }
  if (!episode.data) {
    return <ErrorState title="Not found" description="Episode missing" />;
  }

  const lines = (episode.data.transcript ?? "")
    .split("\n")
    .map((line) =>
      episode.data.youSpeakerLabel && line.startsWith(`${episode.data.youSpeakerLabel}:`)
        ? line.replace(`${episode.data.youSpeakerLabel}:`, "You:")
        : line,
    )
    .filter(Boolean)
    .filter((line) => line.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="flex flex-col gap-4 py-4 px-4 md:px-8">
      <Link href={`/people/${episode.data.personId}`} className="text-sm text-muted-foreground">
        Back to person
      </Link>
      <h1 className="text-2xl font-semibold">{episode.data.title}</h1>
      <p className="text-sm text-muted-foreground">
        {format(episode.data.occurredAt, "MMMM d, yyyy")}
        {episode.data.topics ? ` · ${episode.data.topics}` : ""}
      </p>
      <div className="bg-background rounded-lg border p-4 prose prose-sm max-w-none">
        <ReactMarkdown>{episode.data.brief || ""}</ReactMarkdown>
      </div>

      {speakers.length > 1 && !episode.data.youSpeakerLabel && (
        <div className="bg-background rounded-lg border p-4 flex items-center gap-3 flex-wrap">
          <p className="text-sm text-muted-foreground">Which speaker is you?</p>
          {speakers.map((speaker) => (
            <Button
              key={speaker}
              size="sm"
              variant="outline"
              onClick={() => setYouSpeaker.mutate({ id: episode.data.id, speaker })}
            >
              {speaker}
            </Button>
          ))}
        </div>
      )}

      {suggestedPeople.length > 0 && (
        <div className="bg-background rounded-lg border p-4 flex items-center gap-3 flex-wrap">
          <p className="text-sm text-muted-foreground">Mentioned, not in your roster:</p>
          {suggestedPeople.map((name) => (
            <Badge key={name} variant="secondary" className="gap-2">
              {name}
              <button
                type="button"
                className="underline"
                onClick={() => addToRoster.mutate({ name })}
              >
                Add
              </button>
            </Badge>
          ))}
        </div>
      )}

      <div className="bg-background rounded-lg border p-4">
        <p className="text-sm font-medium mb-3">Transcript</p>
        <Input
          placeholder="Search transcript"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="mb-4 max-w-sm"
        />
        <div className="flex flex-col gap-2">
          {lines.map((line, index) => (
            <p key={index} className="text-sm">
              <Highlighter
                searchWords={[search]}
                autoEscape
                textToHighlight={line}
                highlightClassName="bg-yellow-200"
              />
            </p>
          ))}
        </div>
      </div>
    </div>
  );
}
