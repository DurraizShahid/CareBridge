import { describe, it, expect, vi, beforeEach } from "vitest";

const { redirectMock, getServerOrganizationMock, currentUserMock } = vi.hoisted(() => ({
  redirectMock: vi.fn((to: string) => {
    throw new Error(`REDIRECT:${to}`);
  }),
  getServerOrganizationMock: vi.fn(),
  currentUserMock: vi.fn(),
}));

vi.mock("next/navigation", () => ({ redirect: redirectMock }));
vi.mock("@clerk/nextjs/server", () => ({ currentUser: currentUserMock }));
vi.mock("@/lib/server-organization", () => ({
  getServerOrganization: getServerOrganizationMock,
}));

import AdminSeedPage from "../page";

describe("AdminSeedPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("redirects unauthenticated users to /sign-in", async () => {
    currentUserMock.mockResolvedValue(null);

    await expect(AdminSeedPage()).rejects.toThrow("REDIRECT:/sign-in");
    expect(redirectMock).toHaveBeenCalledWith("/sign-in");
  });

  it("redirects non-admin users to /dashboard", async () => {
    currentUserMock.mockResolvedValue({
      id: "user-1",
      publicMetadata: { role: "social-worker" },
    });
    getServerOrganizationMock.mockResolvedValue({
      organizationId: "org-1",
      role: "social-worker",
    });

    await expect(AdminSeedPage()).rejects.toThrow("REDIRECT:/dashboard");
    expect(redirectMock).toHaveBeenCalledWith("/dashboard");
  });

  it("renders successfully for administrator via organization role", async () => {
    currentUserMock.mockResolvedValue({
      id: "admin-1",
      publicMetadata: { role: "administrator" },
    });
    getServerOrganizationMock.mockResolvedValue({
      organizationId: "org-1",
      role: "administrator",
    });

    const jsx = await AdminSeedPage();
    expect(jsx).toBeDefined();
    expect(redirectMock).not.toHaveBeenCalled();
  });

  it("renders successfully for superadmin via Clerk metadata fallback when db org is unseeded", async () => {
    currentUserMock.mockResolvedValue({
      id: "superadmin-1",
      publicMetadata: { role: "superadmin" },
    });
    getServerOrganizationMock.mockRejectedValue(new Error("Active organization membership required"));

    const jsx = await AdminSeedPage();
    expect(jsx).toBeDefined();
    expect(redirectMock).not.toHaveBeenCalled();
  });
});
