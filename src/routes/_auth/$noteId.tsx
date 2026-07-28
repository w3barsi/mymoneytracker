import { convexQuery } from "@convex-dev/react-query";
import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMutation } from "convex/react";
import { ArrowLeftIcon } from "lucide-react";
import { useEffect, useEffectEvent, useRef, useState } from "react";

import { Container } from "#/components/container";
import { Button } from "#/components/ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "#/components/ui/card";
import { Textarea } from "#/components/ui/textarea";
import { calculateNoteTotalInCents } from "#/lib/note-total";

import { api } from "../../../convex/_generated/api";
import type { Doc } from "../../../convex/_generated/dataModel";

const AUTOSAVE_DELAY_MS = 600;
const totalFormatter = new Intl.NumberFormat("en", {
  maximumFractionDigits: 2,
  minimumFractionDigits: 2,
});

export const Route = createFileRoute("/_auth/$noteId")({
  loader: ({ context, params }) =>
    context.queryClient.prefetchQuery(convexQuery(api.notes.get, { noteId: params.noteId })),
  component: NotePage,
});

function NotePage() {
  const { noteId } = Route.useParams();
  const { data: note } = useSuspenseQuery(convexQuery(api.notes.get, { noteId }));

  if (note === null) {
    return null;
  }

  return <NoteEditor key={note._id} note={note} />;
}

function NoteEditor({ note }: { readonly note: Doc<"notes"> }) {
  const navigate = useNavigate({ from: "/$noteId" });
  const updateNote = useMutation(api.notes.update);
  const [body, setBody] = useState(note.body);
  const [saveStatus, setSaveStatus] = useState("saved");
  const savedBody = useRef(note.body);
  const currentBody = useRef(note.body);
  const latestSaveRequest = useRef(0);
  const totalInCents = calculateNoteTotalInCents(body);

  async function persistDraft(nextBody: string) {
    if (savedBody.current === nextBody) {
      return true;
    }

    const requestId = latestSaveRequest.current + 1;
    latestSaveRequest.current = requestId;
    setSaveStatus("saving");

    try {
      await updateNote({ noteId: note._id, title: note.title, body: nextBody });

      if (requestId === latestSaveRequest.current) {
        savedBody.current = nextBody;
        setSaveStatus(currentBody.current === nextBody ? "saved" : "pending");
      }

      return true;
    } catch {
      if (requestId === latestSaveRequest.current) {
        setSaveStatus(currentBody.current === nextBody ? "error" : "pending");
      }

      return false;
    }
  }

  useDebounce(
    body,
    (nextBody) => {
      void persistDraft(nextBody);
    },
    AUTOSAVE_DELAY_MS,
  );

  useEffect(() => {
    if (note.body === savedBody.current) {
      return;
    }

    latestSaveRequest.current += 1;
    savedBody.current = note.body;
    currentBody.current = note.body;
    setBody(note.body);
    setSaveStatus("saved");
  }, [note.body]);

  async function handleBack() {
    const didSave = await persistDraft(body);
    if (didSave) {
      await navigate({ to: "/" });
    }
  }

  return (
    <div className="min-h-svh bg-background">
      <header className="border-b">
        <Container className="grid h-16 grid-cols-[2rem_minmax(0,1fr)_2rem] items-center gap-2 sm:grid-cols-[6rem_minmax(0,1fr)_6rem]">
          <Button
            type="button"
            variant="ghost"
            className="w-8 justify-self-start px-0 sm:w-auto sm:px-3"
            onClick={handleBack}
            disabled={saveStatus === "saving"}
          >
            <ArrowLeftIcon data-icon="inline-start" />
            <span className="hidden sm:inline">Back</span>
            <span className="sr-only sm:hidden">Back to notes</span>
          </Button>

          <div className="flex min-w-0 flex-col items-center gap-0.5">
            <h1 className="truncate font-semibold">{note.title.trim() || "Untitled note"}</h1>
            <p className="text-xs text-muted-foreground" aria-live="polite">
              {getSaveStatusLabel(saveStatus)}
            </p>
          </div>

          <span />
        </Container>
      </header>

      <main>
        <Container className="flex flex-col gap-4 py-4">
          <Card size="sm">
            <CardHeader>
              <CardDescription>Total</CardDescription>
              <CardTitle className="font-mono text-3xl font-semibold tracking-tight tabular-nums">
                {totalFormatter.format(totalInCents / 100)}
              </CardTitle>
            </CardHeader>
          </Card>

          <Textarea
            aria-label="Note entries"
            value={body}
            placeholder={"1000 salary\n-500 dinner\n-250 coffee"}
            spellCheck
            className="min-h-[calc(100svh-15rem)] resize-none rounded-none bg-card p-5 font-mono text-base leading-8 md:text-base"
            onChange={(event) => {
              currentBody.current = event.target.value;
              setBody(event.target.value);
              setSaveStatus("pending");
            }}
          />
        </Container>
      </main>
    </div>
  );
}

function getSaveStatusLabel(status: string) {
  if (status === "saving") {
    return "Saving...";
  }

  if (status === "pending") {
    return "Unsaved changes";
  }

  if (status === "error") {
    return "Could not save";
  }

  return "Saved";
}

function useDebounce<TValue>(value: TValue, callback: (value: TValue) => void, delay: number) {
  const onDebounce = useEffectEvent(callback);

  useEffect(() => {
    const timeout = window.setTimeout(() => onDebounce(value), delay);
    return () => window.clearTimeout(timeout);
  }, [value, delay]);
}
