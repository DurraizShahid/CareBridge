import { beforeEach, describe, expect, it, vi } from "vitest";

const { db } = vi.hoisted(() => ({ db: {
  chatFacilityRecommendation: { findMany: vi.fn(), findFirst: vi.fn() },
  referral: { findFirst: vi.fn() },
  placement: { findFirst: vi.fn() },
  facility: { findMany: vi.fn() },
} }));
vi.mock("server-only", () => ({}));
vi.mock("@/lib/prisma", () => ({ prisma: db }));

import { getRecommendedFacilityIds, isFacilityRecommendedForOrg } from "../recommended-facilities";
import { searchFacilities } from "../data-access";

describe("Organization facility recommendations", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    db.chatFacilityRecommendation.findMany.mockResolvedValue([]);
    db.chatFacilityRecommendation.findFirst.mockResolvedValue(null);
    db.referral.findFirst.mockResolvedValue(null);
    db.placement.findFirst.mockResolvedValue(null);
    db.facility.findMany.mockResolvedValue([]);
  });

  it("returns only this organization's recommended IDs as a set", async () => {
    db.chatFacilityRecommendation.findMany.mockResolvedValue([{ facilityId: "f-1" }, { facilityId: "f-1" }]);
    expect(await getRecommendedFacilityIds("hospital-1")).toEqual(new Set(["f-1"]));
    expect(db.chatFacilityRecommendation.findMany).toHaveBeenCalledWith(expect.objectContaining({ where: { organizationId: "hospital-1" } }));
  });

  it("returns an empty set without recommendations", async () => {
    expect(await getRecommendedFacilityIds("hospital-1")).toEqual(new Set());
  });

  it("allows a recommendation only within the requesting organization", async () => {
    db.chatFacilityRecommendation.findFirst.mockResolvedValue({ id: "rec-1" });
    expect(await isFacilityRecommendedForOrg("hospital-1", "f-1")).toBe(true);
    expect(db.chatFacilityRecommendation.findFirst).toHaveBeenCalledWith(expect.objectContaining({ where: { organizationId: "hospital-1", facilityId: "f-1" } }));
  });

  it("preserves referral and contract access through the hospital's own referral", async () => {
    db.referral.findFirst.mockResolvedValue({ id: "ref-1" });
    expect(await isFacilityRecommendedForOrg("hospital-1", "f-1")).toBe(true);
    expect(db.referral.findFirst).toHaveBeenCalledWith(expect.objectContaining({ where: { sendingOrgId: "hospital-1", facilityId: "f-1" } }));
  });

  it("preserves assigned and selected facilities on the hospital's own placements", async () => {
    db.placement.findFirst.mockResolvedValue({ id: "placement-1" });
    expect(await isFacilityRecommendedForOrg("hospital-1", "f-1")).toBe(true);
    expect(db.placement.findFirst).toHaveBeenCalledWith(expect.objectContaining({ where: { organizationId: "hospital-1", OR: [{ facilityId: "f-1" }, { selectedFacilityId: "f-1" }] } }));
  });

  it("denies facilities without a recommendation or an owned relationship", async () => {
    expect(await isFacilityRecommendedForOrg("hospital-1", "f-1")).toBe(false);
  });

  it.each([{ facilityIds: [] }, { facilityIds: ["f-1"] }])("applies the allowlist before limiting results: $facilityIds", async ({ facilityIds }) => {
    await searchFacilities({ facilityIds });
    expect(db.facility.findMany).toHaveBeenCalledWith(expect.objectContaining({ where: { id: { in: facilityIds } }, take: 50 }));
  });
});
