"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, Search, Check } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
}

interface RecentUsersCardProps {
  users: User[];
}

const roleDisplay: Record<string, { label: string; color: string }> = {
  superadmin: { label: "Super Admin", color: "text-warmth" },
  administrator: { label: "Admin", color: "text-primary" },
  "social-worker": { label: "Social Worker", color: "text-health" },
  "discharge-planner": { label: "Discharge Planner", color: "text-health" },
  "facility-coordinator": { label: "Facility Coord.", color: "text-warmth" },
  customer: { label: "Customer", color: "text-muted-foreground" },
};

const statusConfig: Record<string, { dot: string; bg: string }> = {
  superadmin: { dot: "bg-health", bg: "bg-health/10 text-health" },
  administrator: { dot: "bg-health", bg: "bg-health/10 text-health" },
  "social-worker": { dot: "bg-muted-foreground", bg: "bg-muted text-muted-foreground" },
  "discharge-planner": { dot: "bg-muted-foreground", bg: "bg-muted text-muted-foreground" },
  "facility-coordinator": { dot: "bg-warmth", bg: "bg-warmth/10 text-warmth" },
  customer: { dot: "bg-muted-foreground/50", bg: "bg-muted/50 text-muted-foreground" },
};

function getInitials(firstName: string, lastName: string) {
  return `${firstName?.[0] ?? ""}${lastName?.[0] ?? ""}`.toUpperCase();
}

const avatarColors = [
  "bg-warmth/15 text-warmth",
  "bg-health/15 text-health",
  "bg-primary/15 text-primary",
  "bg-warmth/10 text-warmth",
  "bg-health/10 text-health",
  "bg-primary/10 text-primary",
];

export default function RecentUsersCard({ users }: RecentUsersCardProps) {
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const filtered = users.filter((u) => {
    const q = search.toLowerCase();
    return (
      u.firstName?.toLowerCase().includes(q) ||
      u.lastName?.toLowerCase().includes(q) ||
      u.email?.toLowerCase().includes(q) ||
      u.role?.toLowerCase().includes(q)
    );
  });

  const toggleSelect = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <Card className="group shadow-sm card-glass rounded-2xl transition-all duration-300 hover:shadow-lg hover:shadow-health/5 hover:scale-[1.01]">
      <CardContent className="p-[18px]">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-muted-foreground">Recent Users</h3>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="h-8 w-36 rounded-xl bg-muted/40 border-0 pl-8 pr-3 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/20 focus:bg-muted/60 transition-all duration-200"
              />
            </div>
            <Link href="/dashboard/users" className="p-2 rounded-xl bg-muted/40 hover:bg-muted/70 transition-all duration-200 hover:scale-110 active:scale-95">
              <ArrowRight className="h-4 w-4 text-muted-foreground" />
            </Link>
          </div>
        </div>

        <div className="w-full">
          <div className="grid grid-cols-[1.75fr_1fr_0.7fr] gap-2 pb-2 border-b border-border/30">
            <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Name</span>
            <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Role</span>
            <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Status</span>
          </div>

          <div className="flex flex-col">
            {filtered.map((user, i) => {
              const role = roleDisplay[user.role] ?? { label: user.role, color: "text-muted-foreground" };
              const status = statusConfig[user.role] ?? { dot: "bg-muted-foreground", bg: "bg-muted text-muted-foreground" };
              const isSelected = selected.has(user.id);

              return (
                <div
                  key={user.id}
                  className={cn(
                    "group row grid grid-cols-[1.75fr_1fr_0.7fr] gap-2 items-center py-2.5 border-b border-border/20 last:border-0 transition-all duration-200 hover:bg-muted/20 cursor-pointer rounded-lg",
                    isSelected && "bg-muted/30",
                  )}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <button
                      onClick={() => toggleSelect(user.id)}
                      className={cn(
                        "w-4 h-4 rounded border flex items-center justify-center shrink-0 transition-all duration-200 hover:scale-110 active:scale-90",
                        isSelected
                          ? "bg-foreground border-foreground"
                          : "border-border/50 hover:border-foreground/50",
                      )}
                    >
                      {isSelected && <Check className="w-2.5 h-2.5 text-background" />}
                    </button>
                    <div className={cn("w-7 h-7 rounded-lg flex items-center justify-center text-[9px] font-bold shrink-0 transition-all duration-200 group-hover:scale-110", avatarColors[i % avatarColors.length])}>
                      {getInitials(user.firstName, user.lastName)}
                    </div>
                    <span className="text-xs font-medium text-foreground truncate transition-colors duration-200 group-hover:text-foreground/80">
                      {user.firstName} {user.lastName}
                    </span>
                  </div>

                  <span className={cn("text-xs font-medium truncate", role.color)}>
                    {role.label}
                  </span>

                  <div className={cn("inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-medium w-fit", status.bg)}>
                    <span className={cn("w-1.5 h-1.5 rounded-full", status.dot)} />
                    {status.dot === "bg-health" ? "Active" : "On Leave"}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
