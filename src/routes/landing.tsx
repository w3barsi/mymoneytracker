import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRightIcon, WalletCardsIcon } from "lucide-react";

import { Container } from "#/components/container";
import { ThemeToggle } from "#/components/theme-toggle";
import { Button } from "#/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "#/components/ui/card";

export const Route = createFileRoute("/landing")({
  component: LandingPage,
});

function LandingPage() {
  return (
    <div className="min-h-svh bg-background">
      <header className="border-b">
        <Container className="flex h-16 items-center justify-between">
          <Link to="/landing" className="flex items-center gap-2 font-semibold tracking-tight">
            <span className="flex size-8 items-center justify-center rounded-xl bg-primary text-primary-foreground">
              <WalletCardsIcon className="size-4" />
            </span>
            MoneyTracker
          </Link>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Button render={<Link to="/login" />} nativeButton={false}>
              Get started
            </Button>
          </div>
        </Container>
      </header>

      <main>
        <Container className="grid items-center gap-12 py-16 md:min-h-[calc(100svh-4rem)] md:grid-cols-[1fr_0.85fr] md:py-20">
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
        </Container>
      </main>
    </div>
  );
}
