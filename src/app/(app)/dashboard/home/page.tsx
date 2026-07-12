"use client";

import { useState } from "react";
import { useUser } from "@clerk/nextjs";
import {
  RiSendPlaneFill,
  RiSparkling2Line,
  RiBuilding2Line,
  RiUserHeartLine,
  RiStethoscopeLine,
  RiMapPinLine,
  RiAttachmentLine,
  RiArrowUpSLine,
} from "@remixicon/react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const suggestions = [
  {
    icon: RiBuilding2Line,
    label: "Find facilities with cardiac care beds",
  },
  {
    icon: RiUserHeartLine,
    label: "Show pending discharge approvals",
  },
  {
    icon: RiStethoscopeLine,
    label: "Compare skilled nursing options",
  },
  {
    icon: RiMapPinLine,
    label: "Nearest rehab centers to patient",
  },
];

export default function HomePage() {
  const { user } = useUser();
  const [query, setQuery] = useState("");
  const [isFocused, setIsFocused] = useState(false);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good Morning";
    if (hour < 17) return "Good Afternoon";
    return "Good Evening";
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    toast.info("AI assistant is coming soon! Your question has been noted.");
    setQuery("");
  };

  return (
    <div className="flex flex-col items-center justify-center h-screen px-4 overflow-hidden">
      {/* Animated Gradient Blob */}
      <div className="relative mb-3">
        <div className="gradient-blob" aria-hidden="true" />
      </div>

      {/* Greeting */}
      <div className="flex flex-col items-center gap-1 mb-6">
        <h1 className="text-[2rem] font-bold tracking-tight text-foreground leading-tight">
          {getGreeting()}, {user?.firstName ?? "there"}
        </h1>
        <p className="text-[2rem] font-bold tracking-tight leading-tight">
          What can I help you{" "}
          <span className="bg-gradient-to-r from-health to-warmth bg-clip-text text-transparent">
            find today?
          </span>
        </p>
      </div>

      {/* Input Area */}
      <form onSubmit={handleSubmit} className="w-full max-w-[680px]">
        <div
          className={cn(
            "relative rounded-2xl border transition-all duration-300",
            isFocused
              ? "border-health/30 shadow-[0_4px_24px_oklch(0.55_0.15_215/0.08)] bg-white"
              : "border-border/60 bg-muted/10",
          )}
        >
          <div className="flex items-start p-4 pb-0">
            <RiSparkling2Line className="size-5 text-health mt-0.5 shrink-0" />
            <textarea
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              placeholder="Ask AI a question or make a request."
              rows={3}
              className="flex-1 bg-transparent border-0 outline-none resize-none text-base text-foreground placeholder:text-muted-foreground/50 pl-3 pt-0.5"
            />
          </div>

          <div className="flex items-center justify-between p-3 pt-2">
            <div className="flex items-center gap-1">
              <button
                type="button"
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
              >
                <RiAttachmentLine className="size-4" />
                Attach
              </button>
              <button
                type="button"
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
              >
                Writing Styles
                <RiArrowUpSLine className="size-4" />
              </button>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
              >
                <div className="size-4 rounded-full border-2 border-health/40 flex items-center justify-center">
                  <div className="size-1.5 rounded-full bg-health" />
                </div>
                Citation
              </button>
              <Button
                type="submit"
                size="icon"
                disabled={!query.trim()}
                className={cn(
                  "size-9 rounded-full transition-all duration-200",
                  query.trim()
                    ? "bg-foreground text-background hover:bg-foreground/90"
                    : "bg-muted text-muted-foreground",
                )}
              >
                <RiSendPlaneFill className="size-4" />
              </Button>
            </div>
          </div>
        </div>
      </form>

      {/* Suggestion Cards */}
      <div className="w-full max-w-[680px] mt-6">
        <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-muted-foreground mb-3 text-center">
          Get started with an example below
        </p>
        <div className="grid grid-cols-4 gap-3">
          {suggestions.map((suggestion) => (
            <button
              key={suggestion.label}
              type="button"
              onClick={() => {
                setQuery(suggestion.label);
                toast.info("AI assistant is coming soon!");
              }}
              className="group flex flex-col justify-between items-start p-4 h-24 rounded-xl border border-border/50 bg-card/30 text-left transition-all duration-200 hover:bg-card hover:border-border hover:shadow-sm hover:scale-[1.01] active:scale-[0.99]"
            >
              <span className="text-sm text-muted-foreground leading-snug group-hover:text-foreground transition-colors">
                {suggestion.label}
              </span>
              <suggestion.icon className="size-4 text-muted-foreground/50 group-hover:text-foreground/60 transition-colors" />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
