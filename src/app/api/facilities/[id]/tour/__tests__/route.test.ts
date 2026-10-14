import { beforeEach, describe, expect, it, vi } from "vitest";

const { authMock, orgMock, getFacilityMock, updateTourMock, permMock } = vi.hoisted(() => ({
  authMock: vi.fn(),
  orgMock: vi.fn(),
  getFacilityMock: vi.fn(),
  updateTourMock: vi.fn(),
  permMock: vi.fn(),
}));

vi.mock("@clerk/nextjs/server", () => ({
  auth: authMock,
}));

vi.mock("@/lib/server-organization", () => ({
  getServerOrganization: orgMock,
}));

vi.mock("@/lib/data-access", () => ({
  getFacility: getFacilityMock,
  updateFacilityTourConfig: updateTourMock,
}));

vi.mock("@/lib/permissions", () => ({
  roleHasPermission: permMock,
}));

import { GET, PUT } from "../route";

describe("Facility Tour API Route", () => {
  const params = Promise.resolve({ id: "fac-1" });

  beforeEach(() => {
    vi.resetAllMocks();
    authMock.mockResolvedValue({ userId: "user-123" });
    orgMock.mockResolvedValue({ organizationId: "org-1", role: "facility_coordinator" });
    permMock.mockReturnValue(true);
  });

  describe("GET", () => {
    it("returns 401 if unauthenticated", async () => {
      authMock.mockResolvedValue({ userId: null });
      const res = await GET(new Request("http://localhost"), { params });
      expect(res.status).toBe(401);
    });

    it("returns 404 if facility not found", async () => {
      getFacilityMock.mockResolvedValue(null);
      const res = await GET(new Request("http://localhost"), { params });
      expect(res.status).toBe(404);
    });

    it("returns the tour config if found", async () => {
      const mockTour = {
        accentColor: "#2f80c8",
        wallColor: "#f4f7fb",
        floorColor: "#e6ebf1",
        welcome: "Welcome",
        roomName: "Patient Suite",
        stops: [
          {
            id: "stop-1",
            area: "lobby" as const,
            label: "Arrival",
            description: "Entrance",
            highlights: [],
          },
        ],
      };
      getFacilityMock.mockResolvedValue({ id: "fac-1", tourConfig: mockTour });

      const res = await GET(new Request("http://localhost"), { params });
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data).toEqual(mockTour);
    });
  });

  describe("PUT", () => {
    it("returns 401 if unauthenticated", async () => {
      authMock.mockResolvedValue({ userId: null });
      const res = await PUT(
        new Request("http://localhost", {
          method: "PUT",
          body: JSON.stringify({ stops: [] }),
        }),
        { params },
      );
      expect(res.status).toBe(401);
    });

    it("returns 403 if user lacks facilities:update permission", async () => {
      permMock.mockReturnValue(false);
      const res = await PUT(
        new Request("http://localhost", {
          method: "PUT",
          body: JSON.stringify({ stops: [] }),
        }),
        { params },
      );
      expect(res.status).toBe(403);
    });

    it("returns 400 for invalid tour config", async () => {
      getFacilityMock.mockResolvedValue({ id: "fac-1" });
      const res = await PUT(
        new Request("http://localhost", {
          method: "PUT",
          body: JSON.stringify({ stops: [] }),
        }),
        { params },
      );
      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.error).toBeDefined();
    });

    it("validates and updates facility tour config", async () => {
      getFacilityMock.mockResolvedValue({ id: "fac-1" });
      const validConfig = {
        title: "New Tour",
        accentColor: "#2563eb",
        stops: [
          {
            title: "Lobby Stop",
            roomName: "Lobby",
            description: "Staffed 24/7",
            accentColor: "#2563eb",
          },
        ],
      };

      updateTourMock.mockResolvedValue({
        accentColor: "#2563eb",
        wallColor: "#f4f7fb",
        floorColor: "#e6ebf1",
        welcome: "New Tour",
        title: "New Tour",
        roomName: "Patient Suite",
        stops: [
          {
            id: "stop-1",
            area: "lobby",
            label: "Lobby Stop",
            description: "Staffed 24/7",
            roomName: "Lobby",
            accentColor: "#2563eb",
            highlights: [],
          },
        ],
      });

      const res = await PUT(
        new Request("http://localhost", {
          method: "PUT",
          body: JSON.stringify(validConfig),
        }),
        { params },
      );

      expect(res.status).toBe(200);
      expect(updateTourMock).toHaveBeenCalledWith(
        "fac-1",
        expect.objectContaining({
          welcome: "New Tour",
          accentColor: "#2563eb",
          stops: expect.arrayContaining([
            expect.objectContaining({
              label: "Lobby Stop",
              area: "lobby",
            }),
          ]),
        }),
        "org-1",
        "facility_coordinator",
      );
    });
  });
});
