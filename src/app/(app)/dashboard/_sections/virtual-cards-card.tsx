"use client";

import { useState } from "react";
import { Building2, Hospital, Home, Building, ChevronDown } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface Facility {
  name: string;
  total: number;
  available: number;
}

interface Category {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  items: Facility[];
}

const categories: Category[] = [
  {
    id: "hospitals",
    label: "Hospitals",
    icon: Hospital,
    items: [
      { name: "Northside Nursing", total: 45, available: 12 },
      { name: "Greenfield Care", total: 30, available: 3 },
      { name: "Sunnyvale Care", total: 25, available: 8 },
    ],
  },
  {
    id: "facilities",
    label: "Facilities",
    icon: Building2,
    items: [
      { name: "City General Hospital", total: 40, available: 8 },
      { name: "Memorial Hospital", total: 50, available: 15 },
      { name: "St. Mary's Hospital", total: 20, available: 0 },
    ],
  },
  {
    id: "old-homes",
    label: "Old Homes",
    icon: Home,
    items: [
      { name: "Golden Years Residence", total: 40, available: 5 },
      { name: "Sunset Senior Living", total: 35, available: 10 },
    ],
  },
  {
    id: "others",
    label: "Others",
    icon: Building,
    items: [
      { name: "City Health Clinic", total: 15, available: 2 },
      { name: "Rehab Center of Hope", total: 20, available: 6 },
    ],
  },
];

interface VirtualCardsCardProps {
  loading?: boolean;
  error?: boolean;
}

export function VirtualCardsCard({ error }: VirtualCardsCardProps) {
  const [openCategory, setOpenCategory] = useState<string | null>("hospitals");

  const toggleCategory = (id: string) => {
    setOpenCategory((prev) => (prev === id ? null : id));
  };

  if (error) {
    return (
      <Card hoverable className="h-full bg-card">
        <CardContent className="p-6 flex flex-col items-center justify-center h-48 text-center">
          <p className="text-sm text-muted-foreground">Facility data unavailable</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card hoverable className="h-full bg-card">
      <CardContent className="p-0">
        <div className="flex items-center justify-between px-6 pt-6 pb-4">
          <h3 className="text-sm font-bold tracking-widest text-foreground/80 uppercase">Hospitals & Facilities</h3>
          <button aria-label="Card menu" className="p-1.5 rounded-lg hover:bg-muted/60 transition-colors">
            <Building2 className="size-4 text-muted-foreground" />
          </button>
        </div>

        <div className="px-4 pb-4">
          {categories.map((category, index) => {
            const isOpen = openCategory === category.id;
            const Icon = category.icon;
            return (
              <div
                key={category.id}
                className={cn(
                  index < categories.length - 1 && "border-b border-border/15"
                )}
              >
                <button
                  onClick={() => toggleCategory(category.id)}
                  className={cn(
                    "w-full flex items-center justify-between py-3.5 px-2 transition-colors rounded-md",
                    isOpen && "bg-primary/5"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      "size-8 rounded-lg flex items-center justify-center shrink-0",
                      isOpen ? "bg-primary/10 text-primary" : "bg-muted/40 text-muted-foreground"
                    )}>
                      <Icon className="size-4" />
                    </div>
                    <span className={cn(
                      "text-sm font-medium",
                      isOpen ? "text-foreground" : "text-foreground/80"
                    )}>
                      {category.label}
                    </span>
                    <span className="text-[10px] font-medium text-muted-foreground bg-muted/40 px-1.5 py-0.5 rounded-full">
                      {category.items.length}
                    </span>
                  </div>
                  <ChevronDown
                    className={cn(
                      "size-4 text-muted-foreground transition-transform duration-200",
                      isOpen && "rotate-180"
                    )}
                  />
                </button>

                {isOpen && (
                  <div className="pb-3 pl-4 pr-1 space-y-2.5">
                    {category.items.map((item) => {
                      const pct = Math.round(((item.total - item.available) / item.total) * 100);
                      return (
                        <div key={item.name} className="flex items-center gap-2.5">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <span className="text-[11px] font-medium text-foreground truncate">{item.name}</span>
                              <span className="text-[10px] font-medium tabular-nums ml-2 text-muted-foreground">
                                {item.available}/{item.total}
                              </span>
                            </div>
                            <div className="h-1 bg-muted/60 rounded-full mt-1.5 overflow-hidden">
                              <div
                                className="h-full rounded-full transition-all bg-[#A0E0E0]"
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
