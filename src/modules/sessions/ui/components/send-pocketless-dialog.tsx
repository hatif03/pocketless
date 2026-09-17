"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useTRPC } from "@/trpc/client";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  personId?: string;
  personName?: string;
}

export function SendPocketlessDialog({
  open,
  onOpenChange,
  personId,
  personName,
}: Props) {
  const [meetingUrl, setMeetingUrl] = useState("");
  const [selectedPersonId, setSelectedPersonId] = useState(personId ?? "");
  const router = useRouter();
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const people = useQuery(trpc.people.getMany.queryOptions());
  const create = useMutation(
    trpc.sessions.create.mutationOptions({
      onSuccess: (session) => {
        toast.success("Pocketless is joining the Google Meet");
        onOpenChange(false);
        setMeetingUrl("");
        void queryClient.invalidateQueries();
        router.push(`/sessions/${session.id}`);
      },
      onError: (error) => {
        toast.error(error.message);
      },
    }),
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Send Pocketless</DialogTitle>
          <DialogDescription>
            Paste a Google Meet link. Pocketless joins that call. Zoom and Teams
            ship after launch.
            {personName ? ` Linked to ${personName}.` : ""}
          </DialogDescription>
        </DialogHeader>
        <form
          className="flex flex-col gap-4"
          onSubmit={(event) => {
            event.preventDefault();
            create.mutate({
              meetingUrl,
              personId: selectedPersonId || personId,
            });
          }}
        >
          <div className="flex flex-col gap-2">
            <Label htmlFor="meet-url">Google Meet URL</Label>
            <Input
              id="meet-url"
              placeholder="https://meet.google.com/abc-defg-hij"
              value={meetingUrl}
              onChange={(e) => setMeetingUrl(e.target.value)}
              required
            />
          </div>
          {!personId && (
            <div className="flex flex-col gap-2">
              <Label>Person</Label>
              <Select
                value={selectedPersonId}
                onValueChange={setSelectedPersonId}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Link a person (Priya for the demo)" />
                </SelectTrigger>
                <SelectContent>
                  {(people.data ?? []).map((person) => (
                    <SelectItem key={person.id} value={person.id}>
                      {person.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          <Button type="submit" disabled={create.isPending}>
            {create.isPending ? "Joining…" : "Send Pocketless"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
