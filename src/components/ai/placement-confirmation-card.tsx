"use client";

import { useState } from "react";
import {
  RiCheckLine,
  RiCloseLine,
  RiHospitalLine,
  RiUserHeartLine,
  RiHealthBookLine,
  RiCheckboxCircleLine,
  RiExternalLinkLine,
} from "@remixicon/react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import type { PlacementDraft } from "@/lib/ai/tool-handlers";

const priorityLabels: Record<string, string> = {
  low: "Low",
  medium: "Medium",
  high: "High",
  emergency: "Emergency",
};

const priorityColors: Record<string, string> = {
  low: "bg-muted text-muted-foreground",
  medium: "bg-warmth/10 text-warmth",
  high: "bg-destructive/10 text-destructive",
  emergency: "bg-destructive/15 text-destructive font-semibold",
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
      <Card className="border-health/30 bg-health/5">
        <CardContent className="p-4 flex items-center gap-3">
          <RiCheckboxCircleLine className="size-6 text-health shrink-0" />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-foreground">
              Placement initiated for {draft.patientName}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {draft.facilityName} — {draft.careLevel}
            </p>
          </div>
          <a href="/placements">
            <Button variant="outline" size="sm" className="shrink-0 text-xs gap-1 h-8">
              View <RiExternalLinkLine className="size-3" />
            </Button>
          </a>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-health/20">
      <CardContent className="p-4 space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-semibold flex items-center gap-1.5">
            <RiHealthBookLine className="size-4 text-health" />
            New Placement Draft
          </h4>
          <Badge
            variant="outline"
            className={priorityColors[draft.priority] ?? "bg-muted text-muted-foreground"}
          >
            {priorityLabels[draft.priority] ?? draft.priority}
          </Badge>
        </div>

        <div className="grid grid-cols-2 gap-2 text-sm">
          <div className="flex items-center gap-2 p-2 rounded-lg bg-muted/30">
            <RiUserHeartLine className="size-4 text-muted-foreground shrink-0" />
            <div className="min-w-0">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Patient</p>
              <p className="font-medium truncate">{draft.patientName}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 p-2 rounded-lg bg-muted/30">
            <RiHospitalLine className="size-4 text-muted-foreground shrink-0" />
            <div className="min-w-0">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Facility</p>
              <p className="font-medium truncate">{draft.facilityName}</p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span className="capitalize">Care Level: <strong className="text-foreground">{draft.careLevel}</strong></span>
          <span className="text-border/50">|</span>
          <span className="flex items-center gap-1">
            Availability:
            {draft.hasAvailability ? (
              <Badge variant="default" className="text-[10px] px-1.5 h-4">Available</Badge>
            ) : (
              <Badge variant="destructive" className="text-[10px] px-1.5 h-4">Full</Badge>
            )}
          </span>
        </div>

        {draft.assessmentNotes && (
          <p className="text-xs text-muted-foreground bg-muted/20 rounded-lg p-2 border border-border/30">
            {draft.assessmentNotes}
          </p>
        )}

        <div className="flex items-center gap-2 pt-1">
          <Button
            size="sm"
            onClick={handleConfirm}
            disabled={isCreating}
            className="gap-1.5 text-xs h-8"
          >
            <RiCheckLine className="size-3.5" />
            {isCreating ? "Creating..." : "Confirm Placement"}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={onDismiss}
            disabled={isCreating}
            className="gap-1.5 text-xs h-8 text-muted-foreground"
          >
            <RiCloseLine className="size-3.5" />
            Cancel
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
