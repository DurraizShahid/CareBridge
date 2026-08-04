"use client";

import { useState } from "react";
import { Building2, Hospital, Home, Building, ChevronDown } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { FacilityCategoryData } from "@/types";

const categoryIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  hospitals: Hospital,
  snf: Building2,
  rehab: Building,
  assisted: Home,
  other: Building,
};

interface VirtualCardsCardProps {
  loading?: boolean;
  error?: boolean;
  categories?: FacilityCategoryData[];
}

export function VirtualCardsCard({ error, categories = [] }: VirtualCardsCardProps) {
  const [openCategory, setOpenCategory] = useState<string | null>(
    categories[0]?.id ?? null,
  );

  const toggleCategory = (id: string) => {
    setOpenCategory((prev) => (prev === id ? null : id));
  };

  if (error) {
    return (
      <Card className="h-full">
        <CardContent className="p-6 flex flex-col items-center justify-center h-48 text-center">
          <p className="text-sm text-muted-foreground">Facility data unavailable</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-full">
      <CardContent className="p-0">
        <div className="flex items-center justify-between px-6 pt-6 pb-4">
          <h3 className="text-sm font-semibold tracking-tight text-foreground">Hospitals & Facilities</h3>
          <Building2 className="size-4 text-muted-foreground" />
        </div>

        <div className="px-4 pb-4">
          {categories.length === 0 ? (
            <p className="px-3 py-6 text-sm text-muted-foreground text-center">
              No hospitals or facilities found
            </p>
          ) : (
            categories.map((category, index) => {
              const isOpen = openCategory === category.id;
              const Icon = categoryIcons[category.id] ?? Building2;
              return (
                <div key={category.id} className={cn(index < categories.length - 1 && "border-b border-border/60")}>
                  <button
                    onClick={() => toggleCategory(category.id)}
                    className={cn(
                      "w-full flex items-center justify-between py-3 px-3 transition-colors rounded-xl",
                      isOpen ? "bg-muted" : "hover:bg-muted/50",
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        "size-8 rounded-full flex items-center justify-center shrink-0",
                        isOpen ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground",
                      )}>
                        <Icon className="size-4" />
                      </div>
                      <span className={cn("text-sm font-medium", isOpen ? "text-foreground" : "text-muted-foreground")}>
                        {category.label}
                      </span>
                      <span className="rounded-full bg-muted px-1.5 py-0.5 text-[10px] font-medium tabular-nums text-muted-foreground">
                        {category.items.length}
                      </span>
                    </div>
                    <ChevronDown className={cn("size-4 text-muted-foreground transition-transform duration-200", isOpen && "rotate-180")} />
                  </button>

                  {isOpen && (
                    <div className="pb-3 px-3 space-y-2.5">
                      {category.items.map((item) => {
                        const hasCapacity = item.total > 0;
                        const pct = hasCapacity
                          ? Math.round(((item.total - item.available) / item.total) * 100)
                          : 0;
                        return (
                          <div key={item.id} className="flex items-center gap-2.5 rounded-xl bg-card px-4 py-3 shadow-xs">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between">
                                <span className="text-[12px] font-medium text-foreground truncate">{item.name}</span>
                                {hasCapacity && (
                                  <span className="ml-2 text-[11px] font-medium tabular-nums text-muted-foreground">
                                    {item.available}/{item.total}
                                  </span>
                                )}
                              </div>
                              {hasCapacity && (
                                <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-muted">
                                  <div
                                    className={cn(
                                      "h-full rounded-full transition-all",
                                      pct >= 90 ? "bg-destructive" : "bg-primary",
                                    )}
                                    style={{ width: `${pct}%` }}
                                  />
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </CardContent>
    </Card>
  );
}
