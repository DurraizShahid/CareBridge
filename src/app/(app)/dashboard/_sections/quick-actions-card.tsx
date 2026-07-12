"use client";

import Link from "next/link";
import { UserPlus, Building2, ClipboardList, FileText, Settings, Bell } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

const actions = [
  { label: "Add Patient", icon: UserPlus, href: "/patients", color: "bg-health/10 text-health" },
  { label: "Add Facility", icon: Building2, href: "/facilities", color: "bg-warmth/10 text-warmth" },
  { label: "New Placement", icon: ClipboardList, href: "/placements", color: "bg-primary/10 text-primary" },
  { label: "View Reports", icon: FileText, href: "/dashboard", color: "bg-health/10 text-health" },
  { label: "Settings", icon: Settings, href: "/dashboard", color: "bg-muted text-muted-foreground" },
  { label: "Notifications", icon: Bell, href: "/dashboard", color: "bg-warmth/10 text-warmth" },
];

export default function QuickActionsCard() {
  return (
    <Card className="group shadow-sm card-glass rounded-2xl transition-all duration-300 hover:shadow-lg hover:shadow-health/5 hover:scale-[1.02]">
      <CardContent className="p-[18px]">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-muted-foreground">Quick Actions</h3>
        </div>
        <div className="grid grid-cols-2 gap-2">
          {actions.map((action) => (
            <Link
              key={action.label}
              href={action.href}
              className="flex items-center gap-2.5 p-2.5 rounded-xl hover:bg-muted/40 transition-all duration-200 group/item hover:scale-[1.02] active:scale-[0.98]"
            >
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${action.color} transition-all duration-200 group-hover/item:scale-110 group-hover/item:shadow-sm`}>
                <action.icon className="w-4 h-4" />
              </div>
              <span className="text-xs font-medium text-foreground truncate transition-colors duration-200 group-hover/item:text-foreground/80">{action.label}</span>
            </Link>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
