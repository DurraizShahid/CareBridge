import { describe, it, expect, vi, beforeEach } from "vitest";

const { redirectMock, getServerOrganizationMock, getDashboardWidgetDataMock } = vi.hoisted(() => ({
  redirectMock: vi.fn((to: string) => {
    throw new Error(`REDIRECT:${to}`);
  }),
  getServerOrganizationMock: vi.fn(),
  getDashboardWidgetDataMock: vi.fn(),
}));

vi.mock("next/navigation", () => ({ redirect: redirectMock }));
vi.mock("@clerk/nextjs/server", () => ({ currentUser: vi.fn().mockResolvedValue(null) }));
vi.mock("@/lib/data-access", () => ({ getDashboardWidgetData: getDashboardWidgetDataMock }));
vi.mock("@/lib/server-organization", async () => {
  class AuthorizationError extends Error {}
  return { AuthorizationError, getServerOrganization: getServerOrganizationMock };
});

import DashboardPage from "../page";
import { AuthorizationError } from "@/lib/server-organization";

describe("DashboardPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getDashboardWidgetDataMock.mockRejectedValue(new Error("WIDGETS_REACHED"));
  });

  it("renders for a new hospital administrator instead of bouncing to /dashboard/home", async () => {
    getServerOrganizationMock.mockResolvedValue({ organizationId: "org_1", role: "administrator" });
    await expect(DashboardPage()).rejects.toThrow("WIDGETS_REACHED");
    expect(redirectMock).not.toHaveBeenCalled();
  });

  it("redirects to onboarding (not a 500) when membership cannot be verified", async () => {
    getServerOrganizationMock.mockRejectedValue(new AuthorizationError("no membership"));
    await expect(DashboardPage()).rejects.toThrow("REDIRECT:/onboarding");
    expect(getDashboardWidgetDataMock).not.toHaveBeenCalled();
  });
});
