import { convexQuery } from "@convex-dev/react-query";
import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMutation } from "convex/react";
import { ArrowLeftIcon, FileQuestionIcon, Loader2Icon, Trash2Icon } from "lucide-react";
import { useEffect, useEffectEvent, useRef, useState } from "react";
import { toast } from "sonner";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "#/components/ui/alert-dialog";
import { Button } from "#/components/ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "#/components/ui/card";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "#/components/ui/empty";
import { Input } from "#/components/ui/input";
import { Skeleton } from "#/components/ui/skeleton";
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
  loader: async ({ context, params }) =>
    await context.queryClient.prefetchQuery(convexQuery(api.notes.get, { noteId: params.noteId })),
  pendingComponent: NoteLoading,
  component: NotePage,
});

function NotePage() {
  const { noteId } = Route.useParams();
  const { data: note } = useSuspenseQuery(convexQuery(api.notes.get, { noteId }));

  if (note === null) {
    return <NoteNotFound />;
  }

  return <NoteEditor key={note._id} note={note} />;
}

function NoteEditor({ note }: { readonly note: Doc<"notes"> }) {
  const navigate = useNavigate({ from: "/$noteId" });
  const updateNote = useMutation(api.notes.update);
  const removeNote = useMutation(api.notes.remove);
  const [title, setTitle] = useState(note.title);
  const [body, setBody] = useState(note.body);
  const [saveStatus, setSaveStatus] = useState("saved");
  const [isDeleting, setIsDeleting] = useState(false);
  const savedDraft = useRef({ title: note.title, body: note.body });
  const currentDraft = useRef({ title: note.title, body: note.body });
  const latestSaveRequest = useRef(0);
  const totalInCents = calculateNoteTotalInCents(body);

  async function persistDraft(nextTitle: string, nextBody: string) {
    if (savedDraft.current.title === nextTitle && savedDraft.current.body === nextBody) {
      return true;
    }

    const requestId = latestSaveRequest.current + 1;
    latestSaveRequest.current = requestId;
    setSaveStatus("saving");

    try {
      await updateNote({ noteId: note._id, title: nextTitle, body: nextBody });

      if (requestId === latestSaveRequest.current) {
        savedDraft.current = { title: nextTitle, body: nextBody };
        const hasNewerDraft =
          currentDraft.current.title !== nextTitle || currentDraft.current.body !== nextBody;
        setSaveStatus(hasNewerDraft ? "pending" : "saved");
      }

      return true;
    } catch {
      if (requestId === latestSaveRequest.current) {
        const hasNewerDraft =
          currentDraft.current.title !== nextTitle || currentDraft.current.body !== nextBody;
        setSaveStatus(hasNewerDraft ? "pending" : "error");

        if (!hasNewerDraft) {
          toast.error("Could not save this note. Your changes are still in the editor.");
        }
      }

      return false;
    }
  }

  const autosave = useEffectEvent((nextTitle: string, nextBody: string) => {
    void persistDraft(nextTitle, nextBody);
  });

  useEffect(() => {
    if (savedDraft.current.title === title && savedDraft.current.body === body) {
      return;
    }

    const timeout = window.setTimeout(() => autosave(title, body), AUTOSAVE_DELAY_MS);
    return () => window.clearTimeout(timeout);
  }, [title, body]);

  async function handleBack() {
    const didSave = await persistDraft(title, body);
    if (didSave) {
      await navigate({ to: "/" });
    }
  }

  async function handleDelete() {
    setIsDeleting(true);

    const didDelete = await removeNote({ noteId: note._id }).then(
      () => true,
      () => false,
    );

    if (!didDelete) {
      toast.error("Could not delete this note. Please try again.");
      setIsDeleting(false);
      return;
    }

    const didNavigate = await navigate({ to: "/" }).then(
      () => true,
      () => false,
    );

    if (!didNavigate) {
      toast.error("The note was deleted, but the notes list could not be opened.");
      setIsDeleting(false);
    }
  }

  function markDraftChanged() {
    setSaveStatus("pending");
  }

  return (
    <div className="min-h-svh bg-background">
      <header className="border-b">
        <div className="mx-auto grid w-full max-w-3xl grid-cols-[2rem_minmax(0,1fr)_2rem] items-center gap-2 px-4 py-3 sm:grid-cols-[6rem_minmax(0,1fr)_6rem] sm:px-6">
          <Button
            type="button"
            variant="ghost"
            className="w-8 justify-self-start px-0 sm:w-auto sm:px-3"
            onClick={handleBack}
            disabled={saveStatus === "saving" || isDeleting}
          >
            <ArrowLeftIcon data-icon="inline-start" />
            <span className="hidden sm:inline">Back</span>
            <span className="sr-only sm:hidden">Back to notes</span>
          </Button>

          <div className="flex min-w-0 flex-col items-center gap-0.5">
            <Input
              aria-label="Note title"
              value={title}
              placeholder="Untitled note"
              maxLength={120}
              className="h-8 max-w-md bg-transparent text-center font-semibold focus-visible:bg-input/50"
              onChange={(event) => {
                const nextTitle = event.target.value;
                currentDraft.current = { title: nextTitle, body };
                setTitle(nextTitle);
                markDraftChanged();
              }}
            />
            <p className="text-xs text-muted-foreground" aria-live="polite">
              {getSaveStatusLabel(saveStatus)}
            </p>
          </div>

          <AlertDialog>
            <AlertDialogTrigger
              render={
                <Button
                  type="button"
                  variant="destructive"
                  size="icon"
                  className="justify-self-end"
                  disabled={isDeleting}
                />
              }
            >
              <Trash2Icon data-icon="inline-start" />
              <span className="sr-only">Delete note</span>
            </AlertDialogTrigger>
            <AlertDialogContent size="sm">
              <AlertDialogHeader>
                <AlertDialogTitle>Delete this note?</AlertDialogTitle>
                <AlertDialogDescription>
                  This action cannot be undone. The note and all of its entries will be permanently
                  deleted.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel variant="ghost" disabled={isDeleting}>
                  Cancel
                </AlertDialogCancel>
                <AlertDialogAction
                  variant="destructive"
                  onClick={handleDelete}
                  disabled={isDeleting}
                >
                  {isDeleting ? (
                    <Loader2Icon data-icon="inline-start" className="animate-spin" />
                  ) : null}
                  {isDeleting ? "Deleting" : "Delete"}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-3xl flex-col gap-4 px-4 py-6 sm:px-6 sm:py-8">
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
          className="min-h-[calc(100svh-15rem)] resize-none rounded-3xl bg-card p-5 font-mono text-base leading-8 md:text-base"
          onChange={(event) => {
            const nextBody = event.target.value;
            currentDraft.current = { title, body: nextBody };
            setBody(nextBody);
            markDraftChanged();
          }}
        />
      </main>
    </div>
  );
}

function NoteLoading() {
  return (
    <div className="min-h-svh bg-background">
      <header className="border-b">
        <div className="mx-auto grid w-full max-w-3xl grid-cols-[2rem_minmax(0,1fr)_2rem] items-center gap-2 px-4 py-3 sm:grid-cols-[6rem_minmax(0,1fr)_6rem] sm:px-6">
          <Skeleton className="size-8" />
          <div className="flex flex-col items-center gap-1">
            <Skeleton className="h-8 w-full max-w-56" />
            <Skeleton className="h-3 w-14" />
          </div>
          <Skeleton className="size-8 justify-self-end" />
        </div>
      </header>
      <main className="mx-auto flex w-full max-w-3xl flex-col gap-4 px-4 py-6 sm:px-6 sm:py-8">
        <Card size="sm">
          <CardHeader>
            <Skeleton className="h-4 w-12" />
            <Skeleton className="h-9 w-40" />
          </CardHeader>
        </Card>
        <Skeleton className="min-h-[calc(100svh-15rem)] w-full rounded-3xl" />
      </main>
    </div>
  );
}

function NoteNotFound() {
  return (
    <main className="flex min-h-svh items-center justify-center px-4">
      <Empty className="max-w-lg border">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <FileQuestionIcon />
          </EmptyMedia>
          <EmptyTitle>Note not found</EmptyTitle>
          <EmptyDescription>
            This note may have been deleted, or you may not have permission to view it.
          </EmptyDescription>
        </EmptyHeader>
        <EmptyContent>
          <Button render={<Link to="/" />} nativeButton={false} variant="outline">
            <ArrowLeftIcon data-icon="inline-start" />
            Back to notes
          </Button>
        </EmptyContent>
      </Empty>
    </main>
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
