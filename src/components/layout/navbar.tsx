"use client";

import { AuthControls } from "@/components/auth-controls";
import Image from "next/image";
import Link from "next/link";
import { useState, useEffect } from "react";

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div
      className={`absolute inset-x-0 z-30 px-4 transition-all duration-300 sm:px-6 lg:px-8 ${
        scrolled
          ? "fixed top-0 bg-[#134675] shadow-lg"
          : "top-0 pt-[50px]"
      }`}
    >
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-3">
        {/* Left bar - Logo + Nav links */}
        <nav className="flex h-12 items-center gap-1 rounded-full bg-[#134675] px-3 sm:h-14 sm:px-4 lg:px-5">
          {/* Logo */}
          <Link href="/" className="mr-[20px] flex items-center">
            <Image
              src="/Images/Logo.png"
              alt="CareBridge"
              width={185}
              height={53}
              className="h-[35px] w-auto sm:h-[40px]"
            />
          </Link>

          {/* Nav links - centered */}
          <div className="hidden items-center gap-[5px] lg:flex">
            {["Features", "Solutions", "About", "Resources"].map((item) => (
              <a
                key={item}
                href={`#${item.toLowerCase()}`}
                className="relative z-10 rounded-full px-4 py-2 text-sm font-medium text-white/80 transition-colors hover:bg-white/10 hover:text-white"
              >
                {item}
              </a>
            ))}
          </div>
        </nav>

        {/* Right bar - Auth controls */}
        <div className="flex h-12 items-center rounded-full bg-[#134675] px-2 sm:h-14 sm:px-3">
          <AuthControls />
        </div>
      </div>
    </div>
  );
}
