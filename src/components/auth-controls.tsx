"use client";

import { UserButton, Show } from "@clerk/nextjs";
import Link from "next/link";
import { LayoutDashboard } from "lucide-react";
import { cn } from "@/lib/utils";

/** Account navigation retains the dashboard's dark variant. */
export function AuthControls({ tone = "light" }: { tone?: "light" | "dark" }) {
  return <>
    <Show when="signed-out">
      <div className="flex items-center gap-2">
        <Link href="/sign-in"
          className={cn("inline-flex min-h-11 items-center justify-center rounded-full px-3 text-sm font-semibold transition-colors sm:px-5",
            tone === "dark" ? "text-white hover:bg-white/10" : "text-[var(--brand-navy)] hover:bg-[var(--brand-mist)]")}>
          Sign in
        </Link>
        <Link href="/sign-up"
          className={cn("inline-flex min-h-11 items-center justify-center rounded-full px-4 text-sm font-semibold transition-colors",
            tone === "dark" ? "bg-white text-[#102B4E]" : "bg-[var(--brand-blue)] text-white hover:bg-[#19473f]")}>
          Get started
        </Link>
      </div>
    </Show>
    <Show when="signed-in">
      <div className="flex items-center gap-2">
        <Link href="/dashboard"
          className={cn("inline-flex min-h-11 items-center justify-center gap-2 rounded-full px-4 text-sm font-semibold transition-colors",
            tone === "dark" ? "bg-white text-[#102B4E]" : "bg-[var(--brand-blue)] text-white hover:bg-[#19473f]")}>
          <LayoutDashboard className="size-4" aria-hidden="true" />
          Dashboard
        </Link>
        <UserButton appearance={{ elements: {
          userButtonAvatarBox: "size-9",
          userButtonTrigger: "outline-none rounded-full focus-visible:ring-2 focus-visible:ring-[#6EA8F2]",
        } }}>
          <UserButton.MenuItems>
            <UserButton.Link label="Dashboard" href="/dashboard" labelIcon={<LayoutDashboard className="size-4" />} />
          </UserButton.MenuItems>
        </UserButton>
      </div>
    </Show>
  </>;
}
