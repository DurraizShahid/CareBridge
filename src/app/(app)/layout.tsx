"use client";

import { useState } from "react";
import { Sidebar } from "@/components/layout/sidebar";
import { Footer } from "@/components/layout/footer";

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  return (
    <div className="flex h-full flex-1">
      <Sidebar
        collapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed((prev) => !prev)}
      />
      <main className="flex flex-1 flex-col overflow-auto bg-muted/30">
        <div className="mx-auto w-full max-w-7xl flex-1 px-6 py-8">
          {children}
        </div>
        <Footer compact />
      </main>
    </div>
  );
}
