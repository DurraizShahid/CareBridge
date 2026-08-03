"use client";

import { SignInButton, UserButton, Show } from "@clerk/nextjs";
import Link from "next/link";
import { ShimmerButton } from "@/components/ui/shimmer-button";

export function AuthControls() {
  return (
    <>
      <Show when="signed-out">
        <div className="flex items-center gap-2">
          <SignInButton mode="redirect">
            <ShimmerButton
              shimmerColor="#ffffff"
              shimmerSize="0.05em"
              shimmerDuration="3s"
              borderRadius="100px"
              background="transparent"
              className="border border-white/20 text-white/90 hover:text-white hover:bg-white/15 px-5 py-2.5 text-sm font-medium"
            >
              Sign In
            </ShimmerButton>
          </SignInButton>
          <Link href="/sign-up">
            <ShimmerButton
              shimmerColor="#134675"
              shimmerSize="0.05em"
              shimmerDuration="3s"
              borderRadius="100px"
              background="rgba(255, 255, 255, 1)"
              className="text-[#134675] font-semibold shadow-[0_2px_10px_rgba(0,0,0,0.3)] hover:bg-white/90 px-5 py-2.5 text-sm"
            >
              Get Started
            </ShimmerButton>
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
