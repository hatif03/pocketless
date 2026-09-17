"use client";

import { useQuery } from "@tanstack/react-query";
import Highlighter from "react-highlight-words";
import { useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { format } from "date-fns";
import ReactMarkdown from "react-markdown";

import { Input } from "@/components/ui/input";
import { LoadingState } from "@/components/loading-state";
import { ErrorState } from "@/components/error-state";
import { useTRPC } from "@/trpc/client";

export function EpisodeView() {
  const { episodeId } = useParams<{ episodeId: string }>();
  const trpc = useTRPC();
  const episode = useQuery(trpc.episodes.getOne.queryOptions({ id: episodeId }));
  const [search, setSearch] = useState("");

  if (episode.isPending) {
    return <LoadingState title="Loading episode" description="One click down from the person" />;
  }
  if (!episode.data) {
    return <ErrorState title="Not found" description="Episode missing" />;
  }

  const lines = (episode.data.transcript ?? "")
    .split("\n")
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
