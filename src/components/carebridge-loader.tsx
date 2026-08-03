"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";

interface CareBridgeLoaderProps {
  onComplete?: () => void;
  className?: string;
  dark?: boolean;
}

export function CareBridgeLoader({ onComplete, className, dark = false }: CareBridgeLoaderProps) {
  const [progress, setProgress] = useState(0);
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const duration = 2200;
    const interval = 20;
    const steps = duration / interval;
    const increment = 100 / steps;
    let current = 0;

    const timer = setInterval(() => {
      current += increment;
      if (current >= 100) {
        current = 100;
        setProgress(100);
        clearInterval(timer);
        setTimeout(() => {
          setIsVisible(false);
          setTimeout(() => onComplete?.(), 500);
        }, 400);
      } else {
        setProgress(Math.floor(current));
      }
    }, interval);

    return () => clearInterval(timer);
  }, [onComplete]);

  return (
    <div
      className={cn(
        "fixed inset-0 z-[9999] flex flex-col items-center justify-center transition-opacity duration-500 ease-out",
        dark ? "bg-[#0a1628]" : "bg-[#faf9fc]",
        isVisible ? "opacity-100" : "opacity-0 pointer-events-none",
        className
      )}
    >
      {/* Logo */}
      <div className="relative mb-10">
        {/* Glow ring behind logo */}
        <div
          className="absolute inset-0 -m-4 rounded-full opacity-30 blur-xl"
          style={{
            background: dark
              ? "radial-gradient(circle, rgba(68,190,175,0.2) 0%, transparent 70%)"
              : "radial-gradient(circle, rgba(26,26,46,0.15) 0%, transparent 70%)",
            animation: "loader-pulse-glow 2s ease-in-out infinite",
          }}
        />

        {/* Logo container */}
        <div
          className="relative flex items-center justify-center"
          style={{ animation: "loader-logo-enter 0.8s cubic-bezier(0.16,1,0.3,1) forwards" }}
        >
          <Image
            src="/carebridge.svg"
            alt="CareBridge"
            width={64}
            height={64}
            className="relative z-10"
            priority
          />
        </div>
      </div>

      {/* Brand name */}
      <h1
        className={cn(
          "text-2xl font-semibold tracking-tight mb-8",
          dark ? "text-white" : "text-[#1a1a2e]"
        )}
        style={{ animation: "loader-text-enter 0.6s cubic-bezier(0.16,1,0.3,1) 0.2s both" }}
      >
        CareBridge
      </h1>

      {/* Progress bars */}
      <div
        className="flex flex-col items-center gap-2.5 w-56"
        style={{ animation: "loader-bars-enter 0.6s cubic-bezier(0.16,1,0.3,1) 0.4s both" }}
      >
        {[0, 10, 40, 70, 100].map((target, index) => (
          <div key={index} className="relative w-full">
            <div className={cn(
              "h-1.5 w-full overflow-hidden rounded-full",
              dark ? "bg-white/10" : "bg-[#e8e6f0]"
            )}>
              <div
                className="h-full rounded-full transition-all duration-150 ease-out"
                style={{
                  width: `${Math.min(progress, target)}%`,
                  backgroundColor: dark
                    ? (target === 100 ? "#44BEAF" : "rgba(255,255,255,0.6)")
                    : (target === 100 ? "#1a1a2e" : "#6c7a9a"),
                  opacity: 0.15 + (index * 0.175),
                  transitionDelay: `${index * 50}ms`,
                }}
              />
            </div>
          </div>
        ))}
      </div>

      {/* Loading text */}
      <p
        className={cn(
          "mt-6 text-xs font-medium tracking-wide",
          dark ? "text-white/50" : "text-[#8a8a9a]"
        )}
        style={{ animation: "loader-text-enter 0.6s cubic-bezier(0.16,1,0.3,1) 0.6s both" }}
      >
        {progress < 100 ? "Preparing your workspace..." : "Welcome back"}
      </p>

      <style jsx>{`
        @keyframes loader-logo-enter {
          from {
            opacity: 0;
            transform: scale(0.8) translateY(8px);
          }
          to {
            opacity: 1;
            transform: scale(1) translateY(0);
          }
        }

        @keyframes loader-text-enter {
          from {
            opacity: 0;
            transform: translateY(6px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes loader-bars-enter {
          from {
            opacity: 0;
            transform: translateY(6px) scaleX(0.95);
          }
          to {
            opacity: 1;
            transform: translateY(0) scaleX(1);
          }
        }

        @keyframes loader-pulse-glow {
          0%, 100% {
            opacity: 0.2;
            transform: scale(1);
          }
          50% {
            opacity: 0.4;
            transform: scale(1.1);
          }
        }
      `}</style>
    </div>
  );
}
