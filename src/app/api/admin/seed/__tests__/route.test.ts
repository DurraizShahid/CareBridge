import { describe, it, expect, vi, beforeEach } from "vitest";

const {
  authMock,
  currentUserMock,
  getServerOrgMock,
  prismaMock,
  seedMock,
  seedAmpleMock,
} = vi.hoisted(() => ({
  authMock: vi.fn(),
  currentUserMock: vi.fn(),
  getServerOrgMock: vi.fn(),
  prismaMock: {
    organization: { count: vi.fn().mockResolvedValue(11) },
    hospital: { count: vi.fn().mockResolvedValue(8) },
    user: { count: vi.fn().mockResolvedValue(27), update: vi.fn().mockResolvedValue({}) },
    facility: { count: vi.fn().mockResolvedValue(44) },
    facilityMedia: { count: vi.fn().mockResolvedValue(30) },
    patient: { count: vi.fn().mockResolvedValue(56) },
    placement: { count: vi.fn().mockResolvedValue(33) },
    referral: { count: vi.fn().mockResolvedValue(24) },
    contract: { count: vi.fn().mockResolvedValue(8) },
    contractSignature: { count: vi.fn().mockResolvedValue(8) },
    payment: { count: vi.fn().mockResolvedValue(8) },
    bedReservation: { count: vi.fn().mockResolvedValue(8) },
    document: { count: vi.fn().mockResolvedValue(15) },
    documentVersion: { count: vi.fn().mockResolvedValue(15) },
    documentAccessLog: { count: vi.fn().mockResolvedValue(30) },
    activityEvent: { count: vi.fn().mockResolvedValue(20) },
  },
  seedMock: vi.fn(),
  seedAmpleMock: vi.fn(),
}));

vi.mock("@clerk/nextjs/server", () => ({
  auth: authMock,
  currentUser: currentUserMock,
}));

vi.mock("@/lib/server-organization", () => {
  class MockAuthorizationError extends Error {
    status = 403;
    statusCode = 403;
    constructor(message = "Active organization membership required") {
      super(message);
      this.name = "AuthorizationError";
    }
  }

  return {
    AuthorizationError: MockAuthorizationError,
    getServerOrganization: getServerOrgMock,
  };
});

vi.mock("@/lib/prisma", () => ({
  prisma: prismaMock,
}));

vi.mock("../../../../../../prisma/seed", () => ({
  seed: seedMock,
}));

vi.mock("../../../../../../prisma/seed-ample", () => ({
  seedAmple: seedAmpleMock,
}));

import { POST } from "../route";

describe("POST /api/admin/seed", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    authMock.mockResolvedValue({ userId: "admin-user-1" });
    currentUserMock.mockResolvedValue({
      id: "admin-user-1",
      publicMetadata: { role: "administrator" },
    });
    getServerOrgMock.mockResolvedValue({
      organizationId: "org-001",
      organizationType: "hospital",
      role: "administrator",
      isSuperadmin: false,
      userId: "admin-user-1",
    });
    seedMock.mockResolvedValue(undefined);
    seedAmpleMock.mockResolvedValue(undefined);

    // Setup default count mock values
    prismaMock.organization.count.mockResolvedValue(11);
    prismaMock.hospital.count.mockResolvedValue(8);
    prismaMock.user.count.mockResolvedValue(27);
    prismaMock.user.update.mockResolvedValue({});
    prismaMock.facility.count.mockResolvedValue(44);
    prismaMock.facilityMedia.count.mockResolvedValue(30);
    prismaMock.patient.count.mockResolvedValue(56);
    prismaMock.placement.count.mockResolvedValue(33);
    prismaMock.referral.count.mockResolvedValue(24);
    prismaMock.contract.count.mockResolvedValue(8);
    prismaMock.contractSignature.count.mockResolvedValue(8);
    prismaMock.payment.count.mockResolvedValue(8);
    prismaMock.bedReservation.count.mockResolvedValue(8);
    prismaMock.document.count.mockResolvedValue(15);
    prismaMock.documentVersion.count.mockResolvedValue(15);
    prismaMock.documentAccessLog.count.mockResolvedValue(30);
    prismaMock.activityEvent.count.mockResolvedValue(20);
  });

  it("returns 401 when user is unauthenticated", async () => {
    authMock.mockResolvedValue({ userId: null });
    currentUserMock.mockResolvedValue(null);

    const res = await POST();
    expect(res.status).toBe(401);
    const data = await res.json();
    expect(data.error).toBe("Unauthorized");
    expect(seedMock).not.toHaveBeenCalled();
    expect(seedAmpleMock).not.toHaveBeenCalled();
  });

  it("returns 403 when user does not have admin role", async () => {
    getServerOrgMock.mockResolvedValue({
      organizationId: "org-001",
      organizationType: "hospital",
      role: "social-worker",
      isSuperadmin: false,
      userId: "user-1",
    });
    currentUserMock.mockResolvedValue({
      id: "user-1",
      publicMetadata: { role: "social-worker" },
    });

    const res = await POST();
    expect(res.status).toBe(403);
    const data = await res.json();
    expect(data.error).toBe("Forbidden");
    expect(seedMock).not.toHaveBeenCalled();
    expect(seedAmpleMock).not.toHaveBeenCalled();
  });

  it("successfully runs seed and seedAmple for administrator and returns record counts", async () => {
    const res = await POST();
    expect(res.status).toBe(200);

    expect(seedMock).toHaveBeenCalledWith(prismaMock);
    expect(seedAmpleMock).toHaveBeenCalledWith(prismaMock);
    expect(prismaMock.user.update).toHaveBeenCalledWith({
      where: { id: "admin-user-1" },
      data: { organizationId: "org-tx-001" },
    });

    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.message).toBe("Database seeded successfully");
    expect(body.counts).toEqual({
      organizations: 11,
      hospitals: 8,
      users: 27,
      facilities: 44,
      facilityMedia: 30,
      patients: 56,
      placements: 33,
      referrals: 24,
      contracts: 8,
      signatures: 8,
      payments: 8,
      bedReservations: 8,
      documents: 15,
      documentVersions: 15,
      documentAccessLogs: 30,
      activityEvents: 20,
    });
    expect(body.totalRecords).toBe(345);
  });

  it("successfully runs seeds for superadmin", async () => {
    getServerOrgMock.mockResolvedValue({
      organizationId: "org-001",
      organizationType: "hospital",
      role: "superadmin",
      isSuperadmin: true,
      userId: "superadmin-1",
    });
    currentUserMock.mockResolvedValue({
      id: "superadmin-1",
      publicMetadata: { role: "superadmin" },
    });

    const res = await POST();
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(seedMock).toHaveBeenCalledWith(prismaMock);
    expect(seedAmpleMock).toHaveBeenCalledWith(prismaMock);
  });

  it("allows seeding when database has no user records yet but Clerk user is superadmin", async () => {
    const { AuthorizationError } = await import("@/lib/server-organization");
    getServerOrgMock.mockRejectedValue(
      new AuthorizationError("Active organization membership required"),
    );
    currentUserMock.mockResolvedValue({
      id: "fresh-superadmin",
      publicMetadata: { role: "superadmin" },
    });

    const res = await POST();
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(seedMock).toHaveBeenCalledWith(prismaMock);
    expect(seedAmpleMock).toHaveBeenCalledWith(prismaMock);
  });

  it("returns 500 when seeding encounters an unexpected database error", async () => {
    seedMock.mockRejectedValue(new Error("Database connection lost"));

    const res = await POST();
    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.error).toBe("Database connection lost");
  });
});
