"use client";

import { SignInButton, UserButton, Show } from "@clerk/nextjs";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export function AuthControls() {
  return (
    <>
      <Show when="signed-out">
        <div className="flex items-center gap-2">
          <SignInButton mode="redirect">
            <button
              type="button"
              className="rounded-full px-5 py-2.5 text-sm font-medium text-white/90 transition-colors hover:bg-white/15 hover:text-white"
            >
              Sign In
            </button>
          </SignInButton>
          <Button
            variant="default"
            size="sm"
            nativeButton={false}
            render={<Link href="/sign-up" />}
            className="rounded-full bg-white text-[#134675] shadow-[0_2px_10px_rgba(0,0,0,0.3)] hover:bg-white/90"
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
                "focus-visible:ring-2 focus-visible:ring-white/50 focus-visible:border-white outline-none rounded-full",
            },
          }}
        />
      </Show>
    </>
  );
}
