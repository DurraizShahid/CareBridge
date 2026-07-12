"use client";

import { useUser } from "@clerk/nextjs";

export default function DashboardHeader() {
  const { user } = useUser();

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 17) return "Good afternoon";
    return "Good evening";
  };

  return (
    <div className="flex flex-col gap-6 mb-2">
      <div className="animate-in fade-in slide-in-from-left-4 duration-500">
        <h1 className="text-3xl font-bold tracking-wide text-foreground">
          {getGreeting()}, {user?.firstName ?? "there"}.
        </h1>
        <p className="text-xs text-muted-foreground mt-1">
          Here&apos;s what&apos;s happening with your placements today.
        </p>
      </div>
    </div>
  );
}
