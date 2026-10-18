import { beforeEach, describe, expect, it, vi } from "vitest";

const { prismaMock, orgMock, recommendedMock } = vi.hoisted(() => ({
  recommendedMock: vi.fn(),
  prismaMock: {
    organization: { findUnique: vi.fn() },
    facility: { findFirst: vi.fn(), findMany: vi.fn(), fields: { capacity: "capacity" } },
    referral: { findFirst: vi.fn(), findUniqueOrThrow: vi.fn(), updateMany: vi.fn(), create: vi.fn(), findMany: vi.fn() },
    contract: { create: vi.fn() },
    $transaction: vi.fn(),
  },
  orgMock: vi.fn(),
}));

vi.mock("server-only", () => ({}));
vi.mock("@/lib/prisma", () => ({ prisma: prismaMock }));
vi.mock("@/lib/server-organization", () => ({ getServerOrganization: orgMock }));
vi.mock("@/lib/recommended-facilities", () => ({ isFacilityRecommendedForOrg: recommendedMock }));

import { createReferral, getReferral, listReferrals, listReferralCandidates, parseReferralBody,
  referralContext, transitionReferral, ensureCareMatch } from "../referrals";

const valid = {
  patientName: "Test Patient", patientMrn: "T-123", patientDateOfBirth: "1975-03-02",
  careLevel: "skilled_nursing", requiredServices: ["Wound Care"], facilityId: "facility-1",
};

describe("money-loop referrals: authorization and transitions", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    recommendedMock.mockResolvedValue(true);
    prismaMock.$transaction.mockImplementation(async (fn: (tx: typeof prismaMock) => Promise<unknown>) => fn(prismaMock));
    orgMock.mockResolvedValue({ organizationId: "hospital-1", userId: "user-1", role: "social-worker" });
    prismaMock.organization.findUnique.mockResolvedValue({ type: "hospital" });
  });
  it("rejects malformed PHI and invalid care levels before persistence", () => {
    expect(() => parseReferralBody({ ...valid, patientDateOfBirth: "2026-02-30" })).toThrow();
    expect(() => parseReferralBody({ ...valid, careLevel: "not-a-care-level" })).toThrow();
    expect(() => parseReferralBody({ ...valid, patientMrn: "" })).toThrow();
  });
  it("only matches available facilities with requested care and services", () => {
    const f = { careLevelsOffered: ["skilled_nursing"] as any, specialties: ["Wound Care"],
      hasAvailability: true, capacity: 6, currentOccupancy: 5 };
    expect(ensureCareMatch(f, "skilled_nursing", ["wound care"])).toBe(true);
    expect(ensureCareMatch({ ...f, currentOccupancy: 6 }, "skilled_nursing", [])).toBe(false);
    expect(ensureCareMatch(f, "hospice", [])).toBe(false);
    expect(ensureCareMatch(f, "skilled_nursing", ["IV therapy"])).toBe(false);
  });
  it("rejects organizations that are neither hospitals nor facilities", async () => {
    prismaMock.organization.findUnique.mockResolvedValue({ type: "other" });
    await expect(referralContext()).rejects.toMatchObject({ statusCode: 403 });
  });
  it("denies creation by facility organizations", async () => {
    prismaMock.organization.findUnique.mockResolvedValue({ type: "facility" });
    orgMock.mockResolvedValue({ organizationId: "facility-org", userId: "u", role: "facility-coordinator" });
    await expect(createReferral(valid)).rejects.toMatchObject({ statusCode: 403 });
    expect(prismaMock.referral.create).not.toHaveBeenCalled();
  });
  it("rejects a new draft that would manufacture access to an arbitrary facility", async () => {
    recommendedMock.mockResolvedValue(false);
    await expect(createReferral(valid)).rejects.toMatchObject({ statusCode: 403 });
    expect(prismaMock.facility.findFirst).not.toHaveBeenCalled();
    expect(prismaMock.referral.create).not.toHaveBeenCalled();
  });

  it("creates only with server-side hospital identity and eligible receiving facility", async () => {
    prismaMock.facility.findFirst.mockResolvedValue({
      careLevelsOffered: ["skilled_nursing"], specialties: ["Wound Care"],
      hasAvailability: true, currentOccupancy: 1, capacity: 3,
    });
    prismaMock.referral.create.mockResolvedValue({ id: "ref-1", status: "sent" });
    await createReferral({ ...valid, status: "sent", sendingOrgId: "injected", createdById: "attacker" });
    expect(prismaMock.referral.create).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ sendingOrgId: "hospital-1", createdById: "user-1", status: "sent" }),
    }));
  });
  it("scopes sender list to its own hospital organization", async () => {
    prismaMock.referral.findMany.mockResolvedValue([]);
    await listReferrals();
    expect(prismaMock.referral.findMany).toHaveBeenCalledWith(expect.objectContaining({
      where: { sendingOrgId: "hospital-1" },
    }));
  });
  it("scopes facility inbox and blocks drafts from recipients", async () => {
    orgMock.mockResolvedValue({ organizationId: "facility-org", userId: "u", role: "facility-coordinator" });
    prismaMock.organization.findUnique.mockResolvedValue({ type: "facility" });
    prismaMock.referral.findMany.mockResolvedValue([]);
    await listReferrals();
    expect(prismaMock.referral.findMany).toHaveBeenCalledWith(expect.objectContaining({
      where: { facility: { organizationId: "facility-org" }, status: { not: "draft" } },
    }));
  });
  it("prevents facility staff sending and hospital staff accepting", async () => {
    await expect(transitionReferral("ref-1", "accepted")).rejects.toMatchObject({ statusCode: 403 });
    orgMock.mockResolvedValue({ organizationId: "facility-org", userId: "u", role: "facility-coordinator" });
    prismaMock.organization.findUnique.mockResolvedValue({ type: "facility" });
    await expect(transitionReferral("ref-1", "sent")).rejects.toMatchObject({ statusCode: 403 });
  });
  it("updates only sent referrals belonging to the facility org and rejects races", async () => {
    orgMock.mockResolvedValue({ organizationId: "facility-org", userId: "u", role: "facility-coordinator" });
    prismaMock.organization.findUnique.mockResolvedValue({ type: "facility" });
    prismaMock.referral.findFirst.mockResolvedValue({ id: "ref-1" });
    prismaMock.referral.updateMany.mockResolvedValue({ count: 0 });
    await expect(transitionReferral("ref-1", "accepted")).rejects.toMatchObject({ statusCode: 409 });
    expect(prismaMock.referral.updateMany).toHaveBeenCalledWith(expect.objectContaining({
      where: { id: "ref-1", status: "sent", facility: { organizationId: "facility-org" } },
    }));
  });
  it("accepting a referral atomically generates a hashed draft agreement without raw PHI", async () => {
    orgMock.mockResolvedValue({ organizationId: "facility-org", userId: "u", role: "facility-coordinator" });
    prismaMock.organization.findUnique.mockResolvedValue({ type: "facility" });
    prismaMock.referral.findFirst.mockResolvedValue({ id: "ref-1" });
    prismaMock.referral.updateMany.mockResolvedValue({ count: 1 });
    prismaMock.referral.findUniqueOrThrow.mockResolvedValue({
      id: "ref-1", facilityId: "facility-1", careLevel: "skilled_nursing",
      requiredServices: ["Wound Care"], sendingOrganization: { name: "Hospital A" },
      facility: { name: "Facility B" },
      patientName: "SECRET PATIENT", patientMrn: "SECRET MRN",
    });
    await expect(transitionReferral("ref-1", "accepted")).resolves.toMatchObject({ status: "accepted" });
    expect(prismaMock.$transaction).toHaveBeenCalledTimes(1);
    const args = prismaMock.contract.create.mock.calls[0][0].data;
    expect(args.status).toBe("draft");
    expect(args.documentText).not.toContain("SECRET PATIENT");
    expect(args.documentText).not.toContain("SECRET MRN");
    expect(args.documentHash).toMatch(/^[0-9a-f]{64}$/);
  });

  it("does not allow patient lookups across organizations", async () => {
    prismaMock.referral.findFirst.mockResolvedValue(null);
    await expect(getReferral("another-org-ref")).rejects.toMatchObject({ statusCode: 404 });
    expect(prismaMock.referral.findFirst).toHaveBeenCalledWith(expect.objectContaining({
      where: { id: "another-org-ref", sendingOrgId: "hospital-1" },
    }));
  });

  it("CB-002: pushes specialty filtering into database query with cursor pagination and deterministic order", async () => {
    prismaMock.facility.findMany.mockResolvedValue([]);
    await listReferralCandidates("skilled_nursing", ["Wound Care", "IV therapy"], {
      take: 25,
      cursor: "fac-10",
      facilityIds: ["recommended"],
    });
    expect(prismaMock.facility.findMany).toHaveBeenCalledWith(expect.objectContaining({
      where: expect.objectContaining({
        id: { in: ["recommended"] },
        organization: { type: "facility" },
        hasAvailability: true,
        careLevelsOffered: { has: "skilled_nursing" },
        specialties: { hasEvery: ["Wound Care", "IV therapy"] },
      }),
      orderBy: [{ name: "asc" }, { id: "asc" }],
      take: 25,
      cursor: { id: "fac-10" },
      skip: 1,
    }));
  });

  it("CB-022: ranks referral candidates by normalized matching score instead of available beds alone", async () => {
    // Facility A has fewer empty beds (2 beds) but a high rating (5.0) and 0 waitlist.
    // Facility B has more empty beds (10 beds) but a low rating (1.0) and 5-day waitlist.
    const facA = {
      id: "fac-a", name: "High Quality Suites", capacity: 10, currentOccupancy: 8,
      hasAvailability: true, careLevelsOffered: ["skilled_nursing"], specialties: ["Wound Care"],
      rating: 5.0, waitlistDays: 0, insuranceAccepted: [], acceptsMedicare: true, acceptsMedicaid: false,
      address: {},
    };
    const facB = {
      id: "fac-b", name: "Empty Budget Home", capacity: 20, currentOccupancy: 10,
      hasAvailability: true, careLevelsOffered: ["skilled_nursing"], specialties: ["Wound Care"],
      rating: 1.0, waitlistDays: 5, insuranceAccepted: [], acceptsMedicare: true, acceptsMedicaid: false,
      address: {},
    };
    prismaMock.facility.findMany.mockResolvedValue([facB, facA]);

    const candidates = await listReferralCandidates("skilled_nursing", ["Wound Care"]);

    // Score A = 50 + 2 + 25 - 0 = 77
    // Score B = 50 + 10 + 5 - 5 = 60
    // Facility A must be ranked first despite having fewer available beds!
    expect(candidates).toHaveLength(2);
    expect(candidates[0].id).toBe("fac-a");
    expect(candidates[0].score).toBe(77);
    expect(candidates[1].id).toBe("fac-b");
    expect(candidates[1].score).toBe(60);
  });

  it("CB-021: listReferrals supports cursor pagination and optional filters (status, date range, patient, facility)", async () => {
    prismaMock.referral.findMany.mockResolvedValue([]);
    await listReferrals({
      status: "sent",
      startDate: "2026-01-01",
      endDate: "2026-01-31",
      patient: "Smith",
      facilityId: "fac-1",
      take: 20,
      cursor: "ref-100",
    });

    expect(prismaMock.referral.findMany).toHaveBeenCalledWith(expect.objectContaining({
      where: expect.objectContaining({
        sendingOrgId: "hospital-1",
        status: "sent",
        facilityId: "fac-1",
        createdAt: {
          gte: new Date("2026-01-01"),
          lte: new Date("2026-01-31"),
        },
        OR: [
          { patientName: { contains: "Smith", mode: "insensitive" } },
          { patientMrn: { contains: "Smith", mode: "insensitive" } },
        ],
      }),
      take: 20,
      cursor: { id: "ref-100" },
      skip: 1,
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    }));
  });
});
