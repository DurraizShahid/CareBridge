"use client";

import { SignInButton, UserButton, Show } from "@clerk/nextjs";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export function AuthControls() {
  return (
    <>
      <Show when="signed-out">
        <div className="flex items-center gap-4">
          <SignInButton mode="modal">
            <button
              type="button"
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              Sign In
            </button>
          </SignInButton>
          <Button
            variant="default"
            size="lg"
            render={<Link href="/sign-up" />}
          >
            Get Started
          </Button>
        </div>
      </Show>
      <Show when="signed-in">
        <UserButton
          appearance={{
            elements: {
              userButtonAvatarBox: "h-8 w-8",
              userButtonTrigger:
                "focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:border-ring outline-none rounded-full",
            },
          }}
        />
      </Show>
    </>
  );
}
