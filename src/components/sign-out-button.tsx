import { Button } from "#/components/ui/button";
import { authClient } from "#/lib/auth/auth-client";

export function SignOutButton() {
  return (
    <Button
      onClick={async () => {
        await authClient.signOut({
          fetchOptions: {
            onSuccess: () => {
              window.location.reload();
            },
          },
        });
      }}
      type="button"
      className="w-fit"
      variant="destructive"
      size="lg"
    >
      Sign out
    </Button>
  );
}
