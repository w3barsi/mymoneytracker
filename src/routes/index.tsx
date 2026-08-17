import { convexQuery } from "@convex-dev/react-query";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMutation } from "convex/react";
import { FileTextIcon, Loader2Icon, PlusIcon, Trash2Icon, WalletCardsIcon } from "lucide-react";
import { animate, domMax, LazyMotion, m, useMotionValue } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

import { Container } from "#/components/container";
import { LandingPage } from "#/components/landing-page";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
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
import { UserMenu } from "#/components/user-menu";
import { calculateNoteTotalInCents } from "#/lib/note-total";

import { api } from "../../convex/_generated/api";
import type { Doc, Id } from "../../convex/_generated/dataModel";

const SWIPE_ACTION_WIDTH = 80;
const SWIPE_ACTION_GAP = 12;
const SWIPE_REVEAL_DISTANCE = SWIPE_ACTION_WIDTH + SWIPE_ACTION_GAP;
const totalFormatter = new Intl.NumberFormat("en", {
  maximumFractionDigits: 2,
  minimumFractionDigits: 2,
});

const notesQueryOptions = queryOptions({
  ...convexQuery(api.notes.list, {}),
  gcTime: Infinity,
});

export const Route = createFileRoute("/")({
  loader: ({ context }) => {
    if (context.isAuthenticated) {
      return context.queryClient.ensureQueryData(notesQueryOptions);
    }
  },
  component: HomePage,
});

function HomePage() {
  const { isAuthenticated } = Route.useRouteContext();

  return isAuthenticated ? <NotesDashboard /> : <LandingPage />;
}

function SiteBrand() {
  return (
    <Link to="/" className="flex items-center gap-2 font-semibold tracking-tight">
      <span className="flex size-8 items-center justify-center rounded-xl bg-primary text-primary-foreground">
        <WalletCardsIcon className="size-4" />
      </span>
      MoneyTracker
    </Link>
  );
}

function NotesDashboard() {
  const { data: notes } = useSuspenseQuery(notesQueryOptions);
  const removeNote = useMutation(api.notes.remove);
  const [openNoteId, setOpenNoteId] = useState<Id<"notes"> | null>(null);
  const [noteToDelete, setNoteToDelete] = useState<Doc<"notes"> | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  async function handleDelete() {
    if (noteToDelete === null) {
      return;
    }

    setIsDeleting(true);
    setDeleteError(null);

    try {
      await removeNote({ noteId: noteToDelete._id });
      setNoteToDelete(null);
      setOpenNoteId(null);
      setIsDeleting(false);
      toast.success("Note deleted");
    } catch {
      setDeleteError("The note could not be deleted. Please try again.");
      setIsDeleting(false);
    }
  }

  return (
    <LazyMotion features={domMax}>
      <div className="min-h-svh bg-background">
        <header className="border-b">
          <Container className="flex h-16 items-center justify-between">
            <SiteBrand />
            <UserMenu />
          </Container>
        </header>

        <main>
          <Container className="flex flex-col gap-8 py-4 sm:py-8">
            <div className="flex items-center justify-between gap-4">
              <div className="flex flex-col gap-1">
                <h1 className="text-2xl font-semibold tracking-tight">Your notes</h1>
                <p className="text-sm text-muted-foreground">
                  A running record of money in and out.
                </p>
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
                {notes.map((note, index) => (
                  <SwipeableNoteRow
                    key={note._id}
                    note={note}
                    preload={index < 2 ? "render" : "intent"}
                    isOpen={openNoteId === note._id}
                    onOpenChange={(open) => setOpenNoteId(open ? note._id : null)}
                    onRequestDelete={() => {
                      setDeleteError(null);
                      setNoteToDelete(note);
                    }}
                  />
                ))}
              </ul>
            ) : null}
          </Container>
        </main>

        <AlertDialog
          open={noteToDelete !== null}
          onOpenChange={(open) => {
            if (!open && !isDeleting) {
              setNoteToDelete(null);
              setOpenNoteId(null);
              setDeleteError(null);
            }
          }}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete this note?</AlertDialogTitle>
              <AlertDialogDescription>
                This will permanently delete &ldquo;
                {noteToDelete?.title.trim() || "Untitled note"}&rdquo;. This action cannot be
                undone.
                {deleteError && ` ${deleteError}`}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
              <AlertDialogAction variant="destructive" disabled={isDeleting} onClick={handleDelete}>
                <Trash2Icon data-icon="inline-start" />
                {isDeleting ? "Deleting..." : "Delete"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </LazyMotion>
  );
}

function SwipeableNoteRow({
  note,
  preload,
  isOpen,
  onOpenChange,
  onRequestDelete,
}: {
  readonly note: Doc<"notes">;
  readonly preload: "render" | "intent";
  readonly isOpen: boolean;
  readonly onOpenChange: (open: boolean) => void;
  readonly onRequestDelete: () => void;
}) {
  const x = useMotionValue(0);
  const didDrag = useRef(false);

  useEffect(() => {
    const animation = animate(x, isOpen ? -SWIPE_REVEAL_DISTANCE : 0, {
      type: "spring",
      stiffness: 500,
      damping: 40,
    });

    return () => animation.stop();
  }, [isOpen, x]);

  return (
    <li className="relative isolate overflow-hidden">
      <m.div
        className="relative z-10 h-full touch-pan-y bg-background"
        style={{ x }}
        drag="x"
        dragConstraints={{ left: -SWIPE_REVEAL_DISTANCE, right: 0 }}
        dragDirectionLock
        dragElastic={0.08}
        dragMomentum={false}
        onPointerDown={() => {
          didDrag.current = false;
        }}
        onDragStart={() => {
          didDrag.current = true;
        }}
        onDragEnd={(_, info) => {
          const swipedLeft = info.velocity.x < -500;
          const swipedRight = info.velocity.x > 500;
          const shouldOpen = swipedLeft || (!swipedRight && x.get() < -SWIPE_REVEAL_DISTANCE / 2);

          onOpenChange(shouldOpen);
          void animate(x, shouldOpen ? -SWIPE_REVEAL_DISTANCE : 0, {
            type: "spring",
            stiffness: 500,
            damping: 40,
          });
        }}
      >
        <Link
          to="/$noteId"
          params={{ noteId: note._id }}
          preload={preload}
          className="group block h-full outline-none focus-visible:ring-3 focus-visible:ring-ring/30"
          onClick={(event) => {
            if (didDrag.current || isOpen) {
              event.preventDefault();
              onOpenChange(false);
            }
          }}
        >
          <Card
            size="sm"
            className="h-full transition-colors group-hover:bg-muted/50 group-focus-visible:bg-muted/50"
          >
            <CardHeader>
              <CardTitle className="truncate">{note.title.trim() || "Untitled note"}</CardTitle>
              <CardDescription>
                {totalFormatter.format(calculateNoteTotalInCents(note.body) / 100)}
              </CardDescription>
            </CardHeader>
          </Card>
        </Link>
      </m.div>

      <Button
        type="button"
        variant="destructive"
        className="absolute inset-y-0 right-0 h-full w-20 flex-col gap-1 rounded-none p-0"
        onFocus={() => onOpenChange(true)}
        onClick={onRequestDelete}
      >
        <Trash2Icon />
        <span className="text-xs">Delete</span>
      </Button>
    </li>
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
