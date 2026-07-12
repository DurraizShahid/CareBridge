"use client";

import { useState } from "react";
import { useUser } from "@clerk/nextjs";
import { RiSendPlaneLine, RiSparklingLine, RiBuildingLine, RiGroupLine, RiClipboardLine } from "@remixicon/react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const suggestions = [
  { icon: RiBuildingLine, label: "Find available facilities near me" },
  { icon: RiGroupLine, label: "Show my active patients" },
  { icon: RiClipboardLine, label: "Placement status summary" },
];

export default function HomePage() {
  const { user } = useUser();
  const [query, setQuery] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    toast.info("AI assistant is coming soon! Your question has been noted.");
    setQuery("");
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-12rem)]">
      <div className="flex flex-col items-center gap-2 mb-8">
        <div className="flex size-12 items-center justify-center rounded-xl bg-health/10">
          <RiSparklingLine className="size-6 text-health" />
        </div>
        <h1 className="text-2xl font-semibold tracking-tight">
          Good {new Date().getHours() < 12 ? "morning" : new Date().getHours() < 17 ? "afternoon" : "evening"},
          {" "}{user?.firstName ?? "there"}
        </h1>
        <p className="text-sm text-muted-foreground">
          Ask anything about patients, placements, or facilities
        </p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="relative w-full max-w-2xl"
      >
        <div className="relative">
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Ask a question..."
            className="h-14 rounded-2xl border-border bg-card pr-14 pl-5 text-base shadow-sm placeholder:text-muted-foreground/50 focus-visible:ring-1 focus-visible:ring-health/30"
          />
          <Button
            type="submit"
            size="icon"
            disabled={!query.trim()}
            className={cn(
              "absolute right-2 top-1/2 -translate-y-1/2 size-10 rounded-xl transition-all",
              query.trim()
                ? "bg-health text-white hover:bg-health/90 shadow-sm"
                : "bg-muted text-muted-foreground",
            )}
          >
            <RiSendPlaneLine className="size-4" />
          </Button>
        </div>
      </form>

      <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
        {suggestions.map((suggestion) => (
          <button
            key={suggestion.label}
            type="button"
            onClick={() => {
              setQuery(suggestion.label);
              toast.info("AI assistant is coming soon!");
            }}
            className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3.5 py-1.5 text-xs font-medium text-muted-foreground shadow-sm transition-colors hover:bg-accent hover:text-foreground"
          >
            <suggestion.icon className="size-3.5 text-health" />
            {suggestion.label}
          </button>
        ))}
      </div>
    </div>
  );
}
