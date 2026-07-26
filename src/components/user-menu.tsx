import { LogOutIcon, MonitorIcon, MoonIcon, SunIcon } from "lucide-react";

import { useTheme } from "#/components/theme-provider";
import { Avatar, AvatarFallback, AvatarImage } from "#/components/ui/avatar";
import { Button } from "#/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "#/components/ui/dropdown-menu";
import { authClient } from "#/lib/auth/auth-client";
import { useAuth } from "#/lib/auth/hooks";

import { Skeleton } from "./ui/skeleton";

export function UserMenu() {
  const { user, isPending } = useAuth();
  const { theme, setTheme } = useTheme();
  const displayName = user?.name || user?.email || "Account";

  async function handleSignOut() {
    await authClient.signOut({
      fetchOptions: {
        onSuccess: () => {
          window.location.reload();
        },
      },
    });
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={<Button type="button" variant="ghost" size="icon" aria-label="Open user menu" />}
      >
        {isPending ? (
          <Skeleton className="size-8" />
        ) : (
          <Avatar>
            {user?.image ? <AvatarImage src={user.image} alt={displayName} /> : null}
            <AvatarFallback>{getInitials(displayName)}</AvatarFallback>
          </Avatar>
        )}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-56">
        <DropdownMenuGroup>
          <DropdownMenuLabel className="flex flex-col">
            <span className="truncate font-medium text-foreground">{displayName}</span>
            {user?.email && user.email !== displayName ? (
              <span className="truncate">{user.email}</span>
            ) : null}
          </DropdownMenuLabel>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuSub>
            <DropdownMenuSubTrigger>
              <SunIcon />
              Theme
            </DropdownMenuSubTrigger>
            <DropdownMenuSubContent>
              <DropdownMenuGroup>
                <DropdownMenuCheckboxItem
                  checked={theme === "light"}
                  onCheckedChange={(checked) => checked && setTheme("light")}
                >
                  <SunIcon />
                  Light
                </DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem
                  checked={theme === "dark"}
                  onCheckedChange={(checked) => checked && setTheme("dark")}
                >
                  <MoonIcon />
                  Dark
                </DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem
                  checked={theme === "system"}
                  onCheckedChange={(checked) => checked && setTheme("system")}
                >
                  <MonitorIcon />
                  System
                </DropdownMenuCheckboxItem>
              </DropdownMenuGroup>
            </DropdownMenuSubContent>
          </DropdownMenuSub>
          <DropdownMenuItem onClick={handleSignOut}>
            <LogOutIcon />
            Sign out
          </DropdownMenuItem>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function getInitials(name: string) {
  return name
    .split(/\s+/)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}
