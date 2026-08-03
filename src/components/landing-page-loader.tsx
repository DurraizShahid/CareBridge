"use client";

import { useState, useCallback } from "react";
import { CareBridgeLoader } from "@/components/carebridge-loader";

export function LandingPageLoader({ children }: { children: React.ReactNode }) {
  const [loaderComplete, setLoaderComplete] = useState(false);

  const handleLoaderComplete = useCallback(() => {
    setLoaderComplete(true);
  }, []);

  return (
    <>
      {!loaderComplete && <CareBridgeLoader onComplete={handleLoaderComplete} dark />}
      <div
        className="transition-opacity duration-700 ease-[cubic-bezier(0.16,1,0.3,1)]"
        style={{ opacity: loaderComplete ? 1 : 0 }}
      >
        {children}
      </div>
    </>
  );
}
