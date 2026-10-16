"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2, AlertCircle, Loader2 } from "lucide-react";
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
  facilityId: string;
  facilityName: string;
}

export function DeleteFacilityDialog({ facilityId, facilityName }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");

  async function handleDelete() {
    setDeleting(true);
    setError("");

    try {
      const res = await fetch(`/api/facilities/${facilityId}`, {
        method: "DELETE",
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Failed to delete facility");
        return;
      }

      setOpen(false);
      router.push("/facilities");
      router.refresh();
    } catch {
      setError("Something went wrong. Please try again.");
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
            className="rounded-full border-[#A33632]/30 text-[#A33632] hover:bg-[#FAEEEB] hover:border-[#A33632]/50 text-xs font-semibold px-3.5 transition-all duration-200 active:scale-[0.98] gap-1.5"
          >
            <Trash2 className="size-3.5 text-[#A33632]" />
            Delete Facility
          </Button>
        }
      />
      <DialogContent className="rounded-2xl border border-[#DCE5DE] bg-white sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2.5 text-[#A33632] mb-1">
            <div className="flex size-9 items-center justify-center rounded-full bg-[#FAEEEB]">
              <Trash2 className="size-4" />
            </div>
            <DialogTitle className="font-serif text-xl font-medium text-[#0D1B17]">
              Delete Facility
            </DialogTitle>
          </div>
          <DialogDescription className="text-xs sm:text-sm text-[#53665E] leading-relaxed">
            Are you sure you want to permanently delete{" "}
            <strong className="text-[#0D1B17] font-semibold">{facilityName}</strong>?
            This action cannot be undone. Facilities with active placements or historical referral records cannot be deleted.
          </DialogDescription>
        </DialogHeader>

        {error && (
          <Alert variant="destructive" className="rounded-xl border-[#A33632]/20 bg-[#FAEEEB] text-[#A33632]">
            <AlertCircle className="size-4" />
            <AlertDescription className="text-xs font-medium">{error}</AlertDescription>
          </Alert>
        )}

        <DialogFooter className="gap-2 sm:gap-0 mt-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setOpen(false)}
            disabled={deleting}
            className="rounded-full border-[#DCE5DE] text-xs font-semibold text-[#203E39] hover:bg-[#FAFBF8]"
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            size="sm"
            onClick={handleDelete}
            disabled={deleting}
            className="rounded-full bg-[#A33632] hover:bg-[#8B2623] text-white text-xs font-semibold px-4 transition-all duration-200 active:scale-[0.98]"
          >
            {deleting ? (
              <>
                <Loader2 className="mr-1.5 size-3.5 animate-spin" />
                Deleting...
              </>
            ) : (
              "Confirm Deletion"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
