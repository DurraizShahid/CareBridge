"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center gap-4 py-20">
      <h2 className="font-heading text-xl font-bold">Something went wrong</h2>
      <p className="text-sm text-muted-foreground">
        Failed to load facility details.
      </p>
      <Button onClick={reset}>Try Again</Button>
    </div>
  );
}
