"use client";

import { UserButton, Show } from "@clerk/nextjs";
import Link from "next/link";
import { cn } from "@/lib/utils";

/** Works on both the warm landing canvas and deep-blue marketing navigation. */
export function AuthControls({ tone = "light" }: { tone?: "light" | "dark" }) {
  return <>
    <Show when="signed-out">
      <div className="flex items-center gap-2">
        <Link href="/sign-in"
          className={cn("inline-flex min-h-10 items-center justify-center rounded-full px-4 text-sm font-semibold transition-colors sm:px-5",
            tone === "dark" ? "text-white hover:bg-white/10" : "text-[#102B4E] hover:bg-[#EEF4FC]")}>
          Sign in
        </Link>
        <Link href="/sign-up"
          className={cn("inline-flex min-h-10 items-center justify-center rounded-full px-5 text-sm font-semibold transition-transform hover:-translate-y-0.5",
            tone === "dark" ? "bg-white text-[#102B4E]" : "bg-[#D9F477] text-[#26390A]")}>
          Get started
        </Link>
      </div>
    </Show>
    <Show when="signed-in">
      <UserButton appearance={{ elements: {
        userButtonAvatarBox: "size-9",
        userButtonTrigger: "outline-none rounded-full focus-visible:ring-2 focus-visible:ring-[#6EA8F2]",
      } }}/>
    </Show>
  </>;
}