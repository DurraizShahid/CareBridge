"use client";

import { Heart } from "lucide-react";
import { AuthControls } from "@/components/auth-controls";
import { useScroll } from "@/hooks/use-scroll";
import { cn } from "@/lib/utils";

export function Navbar() {
  const scrolled = useScroll();

  return (
    <div className="relative z-10 px-4 pt-4 sm:px-6 sm:pt-5 lg:px-8 lg:pt-6">
      <nav
        className={cn(
          "flex h-16 items-center justify-between rounded-full px-6 transition-all duration-300",
          scrolled
            ? "bg-white/10 shadow-sm ring-1 ring-white/10 backdrop-blur-md"
            : "bg-transparent"
        )}
      >
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
            <Heart className="h-4 w-4 text-white" />
          </div>
          <span className="font-heading text-xl font-bold text-white">
            CareBridge
          </span>
        </div>
        <div className="hidden items-center gap-8 sm:flex">
          <a
            href="#features"
            className="text-sm font-medium text-white/70 transition-colors hover:text-white"
          >
            Features
          </a>
          <a
            href="#about"
            className="text-sm font-medium text-white/70 transition-colors hover:text-white"
          >
            About
          </a>
          <AuthControls />
        </div>
      </nav>
    </div>
  );
}
