"use client";

import Link from "next/link";
import { useState } from "react";
import {
  RiCheckLine,
  RiCloseLine,
  RiHospitalLine,
  RiUserHeartLine,
  RiHealthBookLine,
  RiCheckboxCircleLine,
  RiExternalLinkLine,
  RiEditLine,
} from "@remixicon/react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import type { PlacementDraft } from "@/lib/ai/tool-handlers";

const priorityLabels: Record<string, string> = {
  low: "Low",
  medium: "Medium",
  high: "High",
  emergency: "Emergency",
};

const priorityStyles: Record<string, string> = {
  low: "bg-[#f0f4f8] text-[#5a6a7a] border-[#e0ebf4]",
  medium: "bg-[#fff8e1] text-[#f57f17] border-[#ffecb3]",
  high: "bg-[#fce4ec] text-[#c62828] border-[#f8bbd0]",
  emergency: "bg-[#fce4ec] text-[#b71c1c] border-[#f8bbd0] font-semibold",
};

interface PlacementConfirmationCardProps {
  draft: PlacementDraft;
  onConfirmed: () => void;
  onDismiss: () => void;
}

export function PlacementConfirmationCard({
  draft,
  onConfirmed,
  onDismiss,
}: PlacementConfirmationCardProps) {
  const [isCreating, setIsCreating] = useState(false);
  const [isDone, setIsDone] = useState(false);

  const handleConfirm = async () => {
    setIsCreating(true);
    try {
      const res = await fetch("/api/placements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(draft.placementData),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Failed to create placement" }));
        throw new Error(err.error ?? "Failed to create placement");
      }

      setIsDone(true);
      toast.success("Placement created successfully");
      onConfirmed();
    } catch (e) {
      toast.error(
        e instanceof Error ? e.message : "Failed to create placement",
      );
    } finally {
      setIsCreating(false);
    }
  };

  if (isDone) {
    return (
      <div className="overflow-hidden rounded-2xl border border-[#c8e6c9] bg-gradient-to-br from-[#e8f5e9] to-white">
        <div className="h-1 w-full bg-gradient-to-r from-[#4caf50] via-[#66bb6a] to-[#4caf50]/60" />
        <div className="flex items-center gap-3 p-4">
          <div className="flex size-10 items-center justify-center rounded-xl bg-[#e8f5e9] shrink-0">
            <RiCheckboxCircleLine className="size-5 text-[#2e7d32]" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-[#1a2b3d]">
              Placement initiated for {draft.patientName}
            </p>
            <p className="text-xs text-[#5a6a7a] mt-0.5">
              {draft.facilityName} — {draft.careLevel}
            </p>
          </div>
          <Link href="/placements">
            <Button
              variant="outline"
              size="sm"
              className="shrink-0 text-xs gap-1.5 h-8 rounded-xl border-[#c8e6c9] hover:bg-[#e8f5e9] active:scale-[0.98]"
            >
              View <RiExternalLinkLine className="size-3" />
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-[#e0ebf4] bg-white shadow-sm">
      {/* Top accent bar */}
      <div className="h-1 w-full bg-gradient-to-r from-[#3a8bbf] via-[#58aade] to-[#3a8bbf]/60" />

      <div className="p-4 space-y-3.5">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex size-8 items-center justify-center rounded-lg bg-[#f0f6fb]">
              <RiHealthBookLine className="size-4 text-[#3a8bbf]" />
            </div>
            <h4 className="text-sm font-semibold text-[#1a2b3d]">
              New Placement Draft
            </h4>
          </div>
          <Badge
            variant="outline"
            className={`text-[10px] px-2.5 py-0.5 h-5 rounded-lg font-medium border ${priorityStyles[draft.priority] ?? "bg-[#f0f4f8] text-[#5a6a7a] border-[#e0ebf4]"}`}
          >
            {priorityLabels[draft.priority] ?? draft.priority}
          </Badge>
        </div>

        {/* Patient & Facility */}
        <div className="grid grid-cols-2 gap-2.5">
          <div className="flex items-center gap-2.5 p-2.5 rounded-xl bg-[#f6f9fc] border border-[#e0ebf4]/50">
            <div className="flex size-8 items-center justify-center rounded-lg bg-white border border-[#e0ebf4] shrink-0">
              <RiUserHeartLine className="size-4 text-[#3a8bbf]" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] text-[#9ca5b2] uppercase tracking-wide font-medium">Patient</p>
              <p className="font-semibold text-[13px] text-[#1a2b3d] truncate">{draft.patientName}</p>
            </div>
          </div>
          <div className="flex items-center gap-2.5 p-2.5 rounded-xl bg-[#f6f9fc] border border-[#e0ebf4]/50">
            <div className="flex size-8 items-center justify-center rounded-lg bg-white border border-[#e0ebf4] shrink-0">
              <RiHospitalLine className="size-4 text-[#3a8bbf]" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] text-[#9ca5b2] uppercase tracking-wide font-medium">Facility</p>
              <p className="font-semibold text-[13px] text-[#1a2b3d] truncate">{draft.facilityName}</p>
            </div>
          </div>
        </div>

        {/* Details row */}
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-[#5a6a7a]">
          <span>
            Care Level: <strong className="text-[#1a2b3d] font-semibold">{draft.careLevel}</strong>
          </span>
          <div className="flex items-center gap-1.5">
            Availability:
            {draft.hasAvailability ? (
              <span className="inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 h-5 rounded-lg bg-[#e8f5e9] text-[#2e7d32] border border-[#c8e6c9]">
                <span className="size-1.5 rounded-full bg-[#4caf50]" /> Available
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 h-5 rounded-lg bg-[#fce4ec] text-[#c62828] border border-[#f8bbd0]">
                <span className="size-1.5 rounded-full bg-[#ef5350]" /> Full
              </span>
            )}
          </div>
        </div>

        {/* Assessment notes */}
        {draft.assessmentNotes && (
          <div className="text-xs text-[#526273] bg-[#f6f9fc] rounded-xl p-3 border border-[#e0ebf4]/60 leading-relaxed">
            {draft.assessmentNotes}
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center gap-2 pt-0.5">
          <Button
            size="sm"
            onClick={handleConfirm}
            disabled={isCreating}
            className="gap-1.5 text-xs h-9 rounded-xl bg-[#3a8bbf] hover:bg-[#2d6f96] text-white active:scale-[0.98] shadow-sm"
            aria-label={isCreating ? "Creating placement" : "Confirm placement"}
          >
            <RiCheckLine className="size-3.5" />
            {isCreating ? "Creating..." : "Confirm Placement"}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={onDismiss}
            disabled={isCreating}
            className="gap-1.5 text-xs h-9 rounded-xl border-[#e0ebf4] hover:bg-[#f6f9fc]"
            aria-label="Dismiss placement draft"
          >
            <RiEditLine className="size-3.5" />
            Edit
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={onDismiss}
            disabled={isCreating}
            className="gap-1.5 text-xs h-9 rounded-xl text-[#9ca5b2] hover:text-[#5a6a7a] hover:bg-[#f6f9fc]"
            aria-label="Dismiss placement draft"
          >
            <RiCloseLine className="size-3.5" />
            Cancel
          </Button>
        </div>
      </div>
    </div>
  );
}
