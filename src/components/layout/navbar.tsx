"use client";

import { AuthControls } from "@/components/auth-controls";
import Image from "next/image";
import Link from "next/link";

export function Navbar() {
  return (
    <div className="relative z-10 pt-4 sm:pt-5 lg:pt-6">
      <nav className="relative mx-4 flex h-16 items-center px-4 sm:mx-6 sm:px-6 lg:mx-8 lg:px-8">
        {/* Logo - Left */}
        <div className="flex items-center gap-2">
          <Image
            src="/carebridge.svg"
            alt="CareBridge"
            width={32}
            height={32}
            className="h-8 w-8"
          />
          <span className="font-heading text-xl font-bold text-white">
            CareBridge
          </span>
        </div>

        {/* Menu Items - Center */}
        <div className="absolute left-1/2 top-1/2 hidden -translate-x-1/2 -translate-y-1/2 items-center gap-6 sm:flex lg:gap-8">
          <a
            href="#features"
            className="text-sm font-medium text-white transition-colors hover:text-white/80"
          >
            Features
          </a>
          <a
            href="#about"
            className="text-sm font-medium text-white transition-colors hover:text-white/80"
          >
            About
          </a>
          <a
            href="#contact"
            className="text-sm font-medium text-white transition-colors hover:text-white/80"
          >
            Contact Us
          </a>
          <Link
            href="/sign-up"
            className="text-sm font-medium text-white transition-colors hover:text-white/80"
          >
            Register
          </Link>
        </div>

        {/* Auth Controls - Right */}
        <div className="ml-auto hidden sm:block">
          <AuthControls />
        </div>
      </nav>
    </div>
  );
}
