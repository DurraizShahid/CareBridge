"use client";

import { SignInButton, UserButton, Show } from "@clerk/nextjs";
import Link from "next/link";

export function AuthControls() {
  return (
    <>
      <Show when="signed-out">
        <div className="flex items-center gap-1">
          <SignInButton mode="modal">
            <button
              type="button"
              className="rounded-full px-4 py-2 text-sm font-medium text-white/80 transition-colors hover:bg-white/10 hover:text-white"
            >
              Sign In
            </button>
          </SignInButton>
          <Link
            href="/sign-up"
            className="rounded-full bg-[#44BEAF] px-5 py-2 text-sm font-semibold text-white transition-all hover:opacity-90"
          >
            Get Started
          </Link>
        </div>
      </Show>
      <Show when="signed-in">
        <UserButton
          appearance={{
            elements: {
              userButtonAvatarBox: "h-8 w-8",
              userButtonTrigger:
                "focus-visible:ring-2 focus-visible:ring-white/50 focus-visible:border-white outline-none rounded-full",
            },
          }}
        />
      </Show>
    </>
  );
}
