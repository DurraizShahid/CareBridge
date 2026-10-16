"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface Props {
  placementId: string;
  patientName: string;
}

export function DeletePlacementDialog({ placementId, patientName }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");

  async function handleDelete() {
    setDeleting(true);
    setError("");

    try {
      const res = await fetch(`/api/placements/${placementId}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error ?? "Failed to delete placement");
        return;
      }

      router.push("/placements");
      router.refresh();
    } catch {
      setError("Something went wrong.");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button
            variant="outline"
            size="sm"
            className="rounded-full bg-white px-3.5 text-xs font-semibold text-[#A33632] border-[#F2D6D0] hover:bg-[#FAEEEB] active:scale-[0.98] gap-1.5"
          >
            <Trash2 className="size-3.5" />
            Delete
          </Button>
        }
      />
      <DialogContent className="rounded-2xl border-[#DCE5DE]">
        <DialogHeader>
          <DialogTitle className="font-serif text-xl font-medium text-[#0D1B17]">
            Delete Placement Case
          </DialogTitle>
          <DialogDescription className="text-sm text-[#53665E]">
            Are you sure you want to delete the placement case for {patientName}?
            Associated workflow records will be permanently removed. This action cannot be undone.
          </DialogDescription>
        </DialogHeader>

        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setOpen(false)}
            disabled={deleting}
            className="rounded-full border-[#DCE5DE] text-[#203E39]"
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            size="sm"
            onClick={handleDelete}
            disabled={deleting}
            className="rounded-full"
          >
            {deleting ? "Deleting..." : "Permanently Delete"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
