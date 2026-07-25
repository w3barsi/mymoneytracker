import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";

import { Button } from "#/components/ui/button";
import { authClient } from "#/lib/auth/auth-client";

interface SocialLoginButtonProps {
  provider: "google";
  icon: React.ReactNode;
  disabled?: boolean;
  callbackURL: string;
}

export function SignInSocialButton(props: SocialLoginButtonProps) {
  const providerLabel = "Google";

  const mutation = useMutation({
    mutationFn: async () =>
      await authClient.signIn.social(
        {
          provider: props.provider,
          callbackURL: props.callbackURL,
        },
        {
          onError: ({ error }) => {
            toast.error(error.message || `An error occurred during ${providerLabel} sign-in.`);
          },
        },
      ),
  });

  return (
    <Button
      variant="secondary"
      className="w-full"
      type="button"
      disabled={mutation.isSuccess || mutation.isPending || props.disabled}
      onClick={() => mutation.mutate()}
    >
      {props.icon}
      Login with {providerLabel}
    </Button>
  );
}
