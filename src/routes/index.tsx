import { convexQuery } from "@convex-dev/react-query";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, Link, redirect, useNavigate } from "@tanstack/react-router";
import { useMutation } from "convex/react";
import { FileTextIcon, Loader2Icon, PlusIcon, WalletCardsIcon } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { SignOutButton } from "#/components/sign-out-button";
import { ThemeToggle } from "#/components/theme-toggle";
import { Button } from "#/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "#/components/ui/card";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "#/components/ui/empty";

import { api } from "../../convex/_generated/api";

const dateFormatter = new Intl.DateTimeFormat("en", {
  day: "numeric",
  month: "short",
  year: "numeric",
  timeZone: "UTC",
});

const notesQueryOptions = queryOptions({
  ...convexQuery(api.notes.list, {}),
  gcTime: Infinity,
});

export const Route = createFileRoute("/")({
  beforeLoad: ({ context }) => {
    if (!context.isAuthenticated) {
      throw redirect({ to: "/login" });
    }
  },
  loader: ({ context }) => context.queryClient.ensureQueryData(notesQueryOptions),
  component: NotesDashboard,
});

function SiteBrand() {
  return (
    <Link to="/" className="flex items-center gap-2 font-semibold tracking-tight">
      <span className="flex size-8 items-center justify-center rounded-xl bg-primary text-primary-foreground">
        <WalletCardsIcon className="size-4" />
      </span>
      Money Tracker
    </Link>
  );
}

function NotesDashboard() {
  const { data: notes } = useSuspenseQuery(notesQueryOptions);

  return (
    <div className="min-h-svh bg-background">
      <header className="border-b">
        <div className="mx-auto flex h-16 w-full max-w-5xl items-center justify-between px-4 sm:px-6">
          <SiteBrand />
          <div className="flex items-center gap-1">
            <ThemeToggle />
            <SignOutButton />
          </div>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-5xl flex-col gap-8 px-4 py-10 sm:px-6 sm:py-14">
        <div className="flex items-center justify-between gap-4">
          <div className="flex flex-col gap-1">
            <h1 className="text-2xl font-semibold tracking-tight">Your notes</h1>
            <p className="text-sm text-muted-foreground">A running record of money in and out.</p>
          </div>
          <CreateNoteButton />
        </div>

        {notes.length === 0 ? (
          <Empty className="min-h-80 border">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <FileTextIcon />
              </EmptyMedia>
              <EmptyTitle>No notes yet</EmptyTitle>
              <EmptyDescription>
                Create your first note and start recording income and expenses as plain text.
              </EmptyDescription>
            </EmptyHeader>
            <EmptyContent>
              <CreateNoteButton />
            </EmptyContent>
          </Empty>
        ) : null}

        {notes.length > 0 ? (
          <ul className="grid gap-3 sm:grid-cols-2">
            {notes.map((note) => (
              <li key={note._id}>
                <Link
                  to="/$noteId"
                  params={{ noteId: note._id }}
                  preload="intent"
                  className="group block h-full rounded-[min(var(--radius-4xl),24px)] outline-none focus-visible:ring-3 focus-visible:ring-ring/30"
                >
                  <Card
                    size="sm"
                    className="h-full transition-colors group-hover:bg-muted/50 group-focus-visible:bg-muted/50"
                  >
                    <CardHeader>
                      <CardTitle className="truncate">
                        {note.title.trim() || "Untitled note"}
                      </CardTitle>
                      <CardDescription className="line-clamp-2 min-h-10">
                        {getNotePreview(note.body)}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <time
                        dateTime={new Date(note.updatedAt).toISOString()}
                        className="text-xs text-muted-foreground"
                      >
                        Updated {dateFormatter.format(note.updatedAt)}
                      </time>
                    </CardContent>
                  </Card>
                </Link>
              </li>
            ))}
          </ul>
        ) : null}
      </main>
    </div>
  );
}

function CreateNoteButton() {
  const createNote = useMutation(api.notes.create);
  const navigate = useNavigate({ from: "/" });
  const [isCreating, setIsCreating] = useState(false);

  async function handleCreate() {
    setIsCreating(true);

    try {
      const noteId = await createNote({});
      await navigate({ to: "/$noteId", params: { noteId } });
    } catch {
      toast.error("Could not create the note. Please try again.");
      setIsCreating(false);
    }
  }

  return (
    <Button type="button" onClick={handleCreate} disabled={isCreating}>
      {isCreating ? (
        <Loader2Icon data-icon="inline-start" className="animate-spin" />
      ) : (
        <PlusIcon data-icon="inline-start" />
      )}
      {isCreating ? "Creating" : "New note"}
    </Button>
  );
}

function getNotePreview(body: string) {
  return (
    body
      .split(/\r?\n/)
      .find((line) => line.trim())
      ?.trim() || "No entries yet"
  );
}
