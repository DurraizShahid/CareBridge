"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { roleLabels } from "./shared";

interface UsersByRoleCardProps {
  totalUsers: number;
  usersByRole: Record<string, number>;
  allUsers: { id: string; firstName: string; lastName: string; email: string; role: string }[];
}

const segmentColors = [
  "bg-warmth",
  "bg-foreground",
  "bg-muted-foreground/50",
  "bg-health",
  "bg-primary",
  "bg-destructive/60",
];

const segmentHoverColors = [
  "hover:bg-warmth/80",
  "hover:bg-foreground/80",
  "hover:bg-muted-foreground/60",
  "hover:bg-health/80",
  "hover:bg-primary/80",
  "hover:bg-destructive/70",
];

export default function UsersByRoleCard({ totalUsers, usersByRole, allUsers }: UsersByRoleCardProps) {
  const [hoveredRole, setHoveredRole] = useState<string | null>(null);

  const entries = Object.entries(usersByRole).filter(([, count]) => count > 0);
  const total = entries.reduce((sum, [, count]) => sum + count, 0);

  const hoveredUsers = hoveredRole
    ? allUsers.filter((u) => u.role === hoveredRole)
    : [];

  return (
    <Card className="group shadow-sm card-glass rounded-2xl transition-all duration-300 hover:shadow-lg hover:shadow-health/5 hover:scale-[1.02]">
      <CardContent className="p-[18px]">
        <div className="flex items-start justify-between mb-5">
          <div>
            <h3 className="text-sm font-semibold text-muted-foreground">Users by Role</h3>
            <div className="flex items-baseline gap-2 mt-1.5">
              <span className="text-4xl font-semibold text-foreground tracking-tight">{totalUsers}</span>
              <span className="text-[11px] text-muted-foreground">total users</span>
            </div>
          </div>
          <Link href="/dashboard/users" className="p-2 rounded-xl bg-muted/40 hover:bg-muted/70 transition-all duration-200 hover:scale-110 active:scale-95 opacity-0 group-hover:opacity-100">
            <ArrowRight className="h-4 w-4 text-muted-foreground" />
          </Link>
        </div>

        <div className="flex flex-col gap-2">
          <div className="flex gap-1.5">
            {entries.map(([userRole, count], i) => {
              const pct = total > 0 ? Math.round((count / total) * 100) : 0;
              return (
                <div
                  key={userRole}
                  className="flex flex-col items-center flex-1 min-w-0 group cursor-pointer"
                  onMouseEnter={() => setHoveredRole(userRole)}
                  onMouseLeave={() => setHoveredRole(null)}
                >
                  <span className="text-[10px] font-medium text-muted-foreground mb-1.5 transition-transform duration-200 group-hover:scale-110">{pct}%</span>
                  <div
                    className={cn(
                      "w-full h-10 rounded-xl cursor-pointer transition-all duration-300",
                      segmentColors[i % segmentColors.length],
                      segmentHoverColors[i % segmentHoverColors.length],
                      hoveredRole === userRole && "ring-2 ring-offset-2 ring-foreground/20 scale-y-110 shadow-lg",
                    )}
                  />
                </div>
              );
            })}
          </div>

          <div className="flex gap-1.5 mt-1">
            {entries.map(([userRole]) => (
              <div
                key={userRole}
                className="flex-1 min-w-0"
                onMouseEnter={() => setHoveredRole(userRole)}
                onMouseLeave={() => setHoveredRole(null)}
              >
                <span className="text-[10px] text-muted-foreground truncate block text-center">
                  {(roleLabels[userRole] ?? userRole).split(" ")[0]}
                </span>
              </div>
            ))}
          </div>
        </div>

        {hoveredRole && hoveredUsers.length > 0 && (
          <div className="mt-4 p-3 rounded-xl bg-muted/30 border border-border/40 animate-in fade-in slide-in-from-top-1 duration-200">
            <p className="text-xs font-semibold text-foreground mb-2">
              {roleLabels[hoveredRole] ?? hoveredRole} ({hoveredUsers.length})
            </p>
            <div className="flex flex-col gap-1 max-h-20 overflow-y-auto">
              {hoveredUsers.slice(0, 4).map((user) => (
                <div key={user.id} className="flex items-center justify-between gap-2">
                  <span className="text-[11px] text-foreground truncate">
                    {user.firstName} {user.lastName}
                  </span>
                  <span className="text-[10px] text-muted-foreground truncate">{user.email}</span>
                </div>
              ))}
              {hoveredUsers.length > 4 && (
                <span className="text-[10px] text-muted-foreground">
                  +{hoveredUsers.length - 4} more
                </span>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
