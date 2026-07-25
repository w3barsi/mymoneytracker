import { SiGoogle } from "@icons-pack/react-simple-icons";
import { createFileRoute, Link } from "@tanstack/react-router";
import { GalleryVerticalEndIcon } from "lucide-react";

import { SignInSocialButton } from "#/components/sign-in-social-button";

export const Route = createFileRoute("/_guest/login")({
  component: LoginForm,
});

function LoginForm() {
  const { redirectUrl } = Route.useRouteContext();

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col items-center gap-2 text-center">
        <Link to="/" className="flex flex-col items-center gap-2 font-medium">
          <div className="flex h-8 w-8 items-center justify-center rounded-md">
            <GalleryVerticalEndIcon className="size-6" />
          </div>
          <span className="sr-only">Acme Inc.</span>
        </Link>
        <h1 className="text-xl font-bold">Welcome to Acme Inc.</h1>
        <p className="text-sm text-muted-foreground">Sign in or create an account with Google.</p>
      </div>
      <SignInSocialButton
        provider="google"
        callbackURL={redirectUrl}
        icon={<SiGoogle className="size-4" />}
      />
    </div>
  );
}
