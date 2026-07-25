import { createFileRoute, Link } from "@tanstack/react-router";

import { Button } from "#/components/ui/button";

export const Route = createFileRoute("/_auth/$noteId")({
  component: NotePlaceholder,
});

function NotePlaceholder() {
  return (
    <main className="flex min-h-svh items-center justify-center px-4">
      <div className="flex max-w-sm flex-col items-center gap-4 text-center">
        <h1 className="text-2xl font-semibold tracking-tight">Note editor coming next</h1>
        <p className="text-sm text-muted-foreground">
          This note was created successfully. The editor will be implemented in the next step.
        </p>
        <Button render={<Link to="/" />} nativeButton={false} variant="outline">
          Back to notes
        </Button>
      </div>
    </main>
  );
}
