"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { toast } from "sonner";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface DischargeButtonProps {
  patientId: string;
  patientName: string;
  className?: string;
}

export function DischargeButton({
  patientId,
  patientName,
  className,
}: DischargeButtonProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [discharging, setDischarging] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleDischarge() {
    setDischarging(true);
    setError(null);

    try {
      const res = await fetch(`/api/patients/${patientId}/discharge`, {
        method: "POST",
      });

      const data = await res.json().catch(() => null);

      if (!res.ok) {
        const errorMsg = data?.error ?? "Failed to discharge patient";
        setError(errorMsg);
        toast.error(errorMsg);
        return;
      }

      toast.success(`${patientName} has been discharged successfully.`);
      setOpen(false);
      router.refresh();
    } catch {
      const errorMsg = "Something went wrong while discharging the patient.";
      setError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setDischarging(false);
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) setError(null);
      }}
    >
      <DialogTrigger
        render={
          <Button
            variant="outline"
            size="sm"
            className={
              className ??
              "rounded-full bg-white px-4 text-xs font-semibold text-[#854D0E] border-[#FDE68A] hover:bg-[#FEF9C3] active:scale-[0.98] gap-1.5"
            }
          >
            <LogOut className="size-3.5" />
            Discharge Patient
          </Button>
        }
      />
      <DialogContent className="rounded-2xl border-[#DCE5DE]">
        <DialogHeader>
          <DialogTitle className="font-serif text-xl font-medium text-[#0D1B17]">
            Discharge Patient
          </DialogTitle>
          <DialogDescription className="text-sm text-[#53665E]">
            Are you sure you want to discharge{" "}
            <strong className="font-semibold text-[#0D1B17]">
              {patientName}
            </strong>
            ?
          </DialogDescription>
        </DialogHeader>

        <div className="rounded-xl border border-[#FDE68A] bg-[#FEFCE8] p-3.5 text-xs text-[#854D0E] leading-relaxed">
          <p className="font-semibold mb-1">Important Action Warning</p>
          <p>
            Confirming this discharge will free the facility bed, close the active
            placement, and mark the patient record as{" "}
            <strong>discharged</strong>.
          </p>
        </div>

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
            disabled={discharging}
            className="rounded-full border-[#DCE5DE] text-[#203E39]"
          >
            Cancel
          </Button>
          <Button
            size="sm"
            onClick={handleDischarge}
            disabled={discharging}
            className="rounded-full bg-[#854D0E] text-white hover:bg-[#713F12] gap-1.5"
          >
            {discharging && <Spinner className="size-3.5" />}
            {discharging ? "Discharging..." : "Confirm Discharge"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default DischargeButton;
