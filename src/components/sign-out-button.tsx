import { LogOutIcon } from "lucide-react";

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
      variant="ghost"
      size="sm"
    >
      <LogOutIcon data-icon="inline-start" />
      Sign out
    </Button>
  );
}
