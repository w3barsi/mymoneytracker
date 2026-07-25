import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import {
  Authenticated,
  AuthLoading,
  Unauthenticated,
  useMutation,
  usePaginatedQuery,
} from "convex/react";
import { ArrowRightIcon, FileTextIcon, Loader2Icon, PlusIcon, WalletCardsIcon } from "lucide-react";
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
import { Skeleton } from "#/components/ui/skeleton";

import { api } from "../../convex/_generated/api";

const NOTES_PER_PAGE = 12;
const dateFormatter = new Intl.DateTimeFormat("en", {
  day: "numeric",
  month: "short",
  year: "numeric",
  timeZone: "UTC",
});

export const Route = createFileRoute("/")({
  component: HomePage,
});

function HomePage() {
  const { isAuthenticated } = Route.useRouteContext();

  return (
    <>
      <AuthLoading>{isAuthenticated ? <DashboardLoading /> : <LandingLoading />}</AuthLoading>
      <Authenticated>
        <NotesDashboard />
      </Authenticated>
      <Unauthenticated>
        <LandingPage />
      </Unauthenticated>
    </>
  );
}

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

function LandingPage() {
  return (
    <div className="min-h-svh bg-background">
      <header className="border-b">
        <div className="mx-auto flex h-16 w-full max-w-5xl items-center justify-between px-4 sm:px-6">
          <SiteBrand />
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Button render={<Link to="/login" />} nativeButton={false}>
              Get started
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto grid w-full max-w-5xl items-center gap-12 px-4 py-16 sm:px-6 md:min-h-[calc(100svh-4rem)] md:grid-cols-[1fr_0.85fr] md:py-20">
        <section className="flex max-w-xl flex-col items-start gap-6">
          <p className="text-sm font-medium text-muted-foreground">
            Money tracking, without the spreadsheet
          </p>
          <div className="flex flex-col gap-4">
            <h1 className="text-4xl font-semibold tracking-tight text-balance sm:text-5xl">
              Write it down. See where your money stands.
            </h1>
            <p className="max-w-lg text-base/7 text-muted-foreground sm:text-lg/8">
              A simple notes app that automatically totals every amount you write. Add income,
              subtract expenses, and keep the context that matters.
            </p>
          </div>
          <Button render={<Link to="/login" />} size="lg" nativeButton={false}>
            Get started
            <ArrowRightIcon data-icon="inline-end" />
          </Button>
        </section>

        <Card className="mx-auto w-full max-w-sm" aria-label="Example money note">
          <CardHeader>
            <CardTitle>Weekend</CardTitle>
            <CardDescription>Every line stays a note. Amounts update the total.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-5">
            <div className="rounded-2xl bg-muted p-5">
              <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
                Total
              </p>
              <p className="mt-1 font-mono text-3xl font-semibold tracking-tight tabular-nums">
                1,000.00
              </p>
            </div>
            <div className="flex flex-col gap-3 font-mono text-sm tabular-nums">
              <p>-500 dinner</p>
              <p>-250 coffee</p>
              <p>2000</p>
              <p>-250</p>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}

function NotesDashboard() {
  const { results, status, loadMore } = usePaginatedQuery(
    api.notes.list,
    {},
    { initialNumItems: NOTES_PER_PAGE },
  );

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

        {status === "LoadingFirstPage" ? <NotesLoading /> : null}

        {status !== "LoadingFirstPage" && results.length === 0 ? (
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

        {results.length > 0 ? (
          <ul className="grid gap-3 sm:grid-cols-2">
            {results.map((note) => (
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

        {status === "CanLoadMore" || status === "LoadingMore" ? (
          <Button
            type="button"
            variant="outline"
            className="self-center"
            disabled={status === "LoadingMore"}
            onClick={() => loadMore(NOTES_PER_PAGE)}
          >
            {status === "LoadingMore" ? (
              <Loader2Icon data-icon="inline-start" className="animate-spin" />
            ) : null}
            {status === "LoadingMore" ? "Loading" : "Load more"}
          </Button>
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

function NotesLoading() {
  return (
    <div className="grid gap-3 sm:grid-cols-2" aria-label="Loading notes">
      {Array.from({ length: 4 }, (_, index) => (
        <Card key={index} size="sm">
          <CardHeader>
            <Skeleton className="h-5 w-2/3" />
            <Skeleton className="h-10 w-full" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-3 w-24" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function LoadingHeader() {
  return (
    <header className="border-b">
      <div className="mx-auto flex h-16 w-full max-w-5xl items-center justify-between px-4 sm:px-6">
        <SiteBrand />
        <div className="flex items-center gap-2">
          <Skeleton className="size-8" />
          <Skeleton className="h-8 w-24" />
        </div>
      </div>
    </header>
  );
}

function DashboardLoading() {
  return (
    <div className="min-h-svh bg-background">
      <LoadingHeader />
      <main className="mx-auto flex w-full max-w-5xl flex-col gap-8 px-4 py-10 sm:px-6 sm:py-14">
        <div className="flex items-center justify-between gap-4">
          <div className="flex flex-col gap-2">
            <Skeleton className="h-7 w-36" />
            <Skeleton className="h-4 w-64" />
          </div>
          <Skeleton className="h-8 w-24" />
        </div>
        <NotesLoading />
      </main>
    </div>
  );
}

function LandingLoading() {
  return (
    <div className="min-h-svh bg-background">
      <LoadingHeader />
      <main className="mx-auto grid w-full max-w-5xl items-center gap-12 px-4 py-16 sm:px-6 md:min-h-[calc(100svh-4rem)] md:grid-cols-[1fr_0.85fr] md:py-20">
        <section className="flex max-w-xl flex-col items-start gap-6">
          <Skeleton className="h-5 w-56" />
          <div className="flex w-full flex-col gap-4">
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-20 w-full max-w-lg" />
          </div>
          <Skeleton className="h-9 w-32" />
        </section>
        <Card className="mx-auto w-full max-w-sm">
          <CardHeader>
            <Skeleton className="h-5 w-24" />
            <Skeleton className="h-10 w-full" />
          </CardHeader>
          <CardContent className="flex flex-col gap-5">
            <Skeleton className="h-24 w-full" />
            <div className="flex flex-col gap-3">
              <Skeleton className="h-5 w-2/3" />
              <Skeleton className="h-5 w-1/2" />
              <Skeleton className="h-5 w-1/3" />
              <Skeleton className="h-5 w-1/4" />
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
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
