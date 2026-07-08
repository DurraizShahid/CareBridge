"use client";

import { SignInButton, SignUpButton, UserButton, Show } from "@clerk/nextjs";
import Link from "next/link";

export function AuthControls() {
  return (
    <>
      <Show when="signed-out">
        <SignInButton mode="modal">
          <button
            type="button"
            className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            Sign In
          </button>
        </SignInButton>
        <Link
          href="/sign-up"
          className="inline-flex h-9 items-center justify-center rounded-full bg-primary px-4 text-sm font-medium text-primary-foreground shadow-sm transition-all hover:bg-primary/90 active:translate-y-px"
        >
          Get Started
        </Link>
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
