import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, expect, it, vi } from "vitest";
import { roleHasPermission } from "@/lib/permissions";
import type { UserRole } from "@/types";

const state = vi.hoisted(() => ({ role: "administrator", pathname: "/patients/123" }));
vi.mock("next/navigation", () => ({ usePathname: () => state.pathname }));
vi.mock("@/hooks/use-permissions", () => ({
  usePermissions: () => ({
    role: state.role,
    can: (permission: Parameters<typeof roleHasPermission>[1]) =>
      roleHasPermission(state.role as UserRole, permission),
  }),
}));

import { AppSidebar } from "../app-sidebar";
import { SidebarProvider } from "@/components/ui/sidebar";
import { TooltipProvider } from "@/components/ui/tooltip";

function renderSidebar(open = true) {
  return renderToStaticMarkup(createElement(TooltipProvider, null,
    createElement(SidebarProvider, { open }, createElement(AppSidebar))));
}

beforeEach(() => {
  state.role = "administrator";
  state.pathname = "/patients/123";
});

it("renders the hospital destinations and marks the current nested route", () => {
  const html = renderSidebar();
  for (const label of ["Assistant", "Dashboard", "Patients", "Placements", "Referrals", "Users", "Hospitals"]) {
    expect(html).toContain(`aria-label="${label}"`);
  }
  expect(html).toMatch(/<a\b(?=[^>]*href="\/patients")(?=[^>]*aria-current="page")[^>]*>/);
  expect(html.match(/aria-current="page"/g)).toHaveLength(1);
});

it("preserves hospital permissions and facility-account navigation", () => {
  state.role = "social-worker";
  expect(renderSidebar()).not.toContain('aria-label="Hospitals"');
  state.role = "facility-coordinator";
  const html = renderSidebar();
  expect(html).toContain('aria-label="Facilities"');
  expect(html).not.toContain('aria-label="Users"');
});

it("keeps collapsed links accessible and avoids selecting Dashboard on a child page", () => {
  state.pathname = "/dashboard/users";
  const html = renderSidebar(false);
  expect(html).toContain('data-collapsible="icon"');
  expect(html).toContain('aria-label="Users"');
  expect(html.match(/aria-current="page"/g)).toHaveLength(1);
  expect(html).toMatch(/<a\b(?=[^>]*href="\/dashboard\/users")(?=[^>]*aria-current="page")[^>]*>/);
});
