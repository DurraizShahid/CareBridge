import { beforeEach, describe, expect, it, vi } from "vitest";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";

const { org, data, recommendations, candidates } = vi.hoisted(() => ({
  org: vi.fn(),
  data: {
    searchFacilities: vi.fn(), getFacilities: vi.fn(),
    getFacility: vi.fn(), getFacilityById: vi.fn(),
  },
  recommendations: {
    getRecommendedFacilityIds: vi.fn(), isFacilityRecommendedForOrg: vi.fn(),
  },
  candidates: vi.fn(),
}));

vi.mock("@clerk/nextjs/server", () => ({
  auth: vi.fn(async () => ({ userId: "user-1" })),
  currentUser: vi.fn(async () => ({ id: "user-1", firstName: "Staff" })),
}));
vi.mock("@/lib/prisma", () => ({ prisma: {
  user: { findUnique: vi.fn(async () => ({ hospitalId: "hospital-1" })) },
  hospital: { findUnique: vi.fn(async () => ({ address: { city: "Austin", state: "TX" } })) },
} }));
vi.mock("next/navigation", () => ({
  redirect: (path: string) => { throw new Error(`REDIRECT:${path}`); },
  notFound: () => { throw new Error("NOT_FOUND"); },
}));
vi.mock("@/lib/server-organization", () => ({ getServerOrganization: org }));
vi.mock("@/lib/server-auth", () => ({ requireAuthenticatedUser: vi.fn() }));
vi.mock("@/lib/data-access", () => data);
vi.mock("@/lib/recommended-facilities", () => recommendations);
vi.mock("@/lib/referrals", () => ({
  listReferralCandidates: candidates,
  careLevels: ["skilled_nursing"],
  referralFailure: () => ({ status: 403, error: "Forbidden" }),
}));

import { GET as list } from "@/app/api/facilities/route";
import { GET as profile } from "@/app/api/facilities/[id]/route";
import { GET as tour } from "@/app/api/facilities/[id]/tour/route";
import { GET as referralFacilities } from "@/app/api/referrals/facilities/route";
import { searchFacilitiesAction, getFacilityDetailAction } from "@/app/(app)/dashboard/facility-network/actions";
import NetworkPage from "@/app/(app)/dashboard/facility-network/page";
import NetworkDetailPage from "@/app/(app)/dashboard/facility-network/[id]/page";
import TourPage from "@/app/(app)/facilities/[id]/tour/page";
import DirectoryPage from "@/app/(app)/facilities/page";
import { FacilityNetworkClient } from "@/app/(app)/dashboard/facility-network/facility-network-client";

describe("Hospital facility discovery", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    org.mockResolvedValue({ organizationId: "hospital-1", organizationType: "hospital", isSuperadmin: false, role: "social-worker" });
    recommendations.getRecommendedFacilityIds.mockResolvedValue(new Set(["recommended"]));
    recommendations.isFacilityRecommendedForOrg.mockResolvedValue(false);
    data.searchFacilities.mockResolvedValue([]);
    data.getFacilities.mockResolvedValue([]);
    data.getFacility.mockResolvedValue({ id: "arbitrary", tourConfig: {} });
    data.getFacilityById.mockResolvedValue({ id: "arbitrary", tourConfig: {} });
    candidates.mockResolvedValue([]);
  });

  it("scopes the facility list before the search limit is applied", async () => {
    expect((await list()).status).toBe(200);
    expect(data.searchFacilities).toHaveBeenCalledWith({ facilityIds: ["recommended"] });
  });

  it("uses an empty allowlist for hospitals without recommendations", async () => {
    recommendations.getRecommendedFacilityIds.mockResolvedValue(new Set());
    await list();
    expect(data.searchFacilities).toHaveBeenCalledWith({ facilityIds: [] });
  });

  for (const [name, handler] of [["profile", profile], ["tour", tour]] as const) {
    it(`denies an arbitrary facility ${name} before loading its data`, async () => {
      const response = await handler(new Request("http://localhost"), { params: Promise.resolve({ id: "arbitrary" }) });
      expect(response.status).toBe(403);
      expect(data.getFacility).not.toHaveBeenCalled();
      expect(data.getFacilityById).not.toHaveBeenCalled();
    });

    it(`allows a recommended or connected facility ${name}`, async () => {
      recommendations.isFacilityRecommendedForOrg.mockResolvedValue(true);
      expect((await handler(new Request("http://localhost"), { params: Promise.resolve({ id: "recommended" }) })).status).toBe(200);
      expect(recommendations.isFacilityRecommendedForOrg).toHaveBeenCalledWith("hospital-1", "recommended");
    });

    it.each(["facility", "superadmin"])(`keeps ${name} access for %s`, async (kind) => {
      org.mockResolvedValue({ organizationId: "org-1", organizationType: kind === "facility" ? "facility" : "hospital", isSuperadmin: kind === "superadmin", role: kind });
      expect((await handler(new Request("http://localhost"), { params: Promise.resolve({ id: "arbitrary" }) })).status).toBe(200);
      expect(recommendations.isFacilityRecommendedForOrg).not.toHaveBeenCalled();
    });
  }

  it("does not let a forged search-action allowlist expand discovery", async () => {
    await searchFacilitiesAction({ location: "Austin", facilityIds: ["arbitrary"] } as Parameters<typeof searchFacilitiesAction>[0]);
    expect(data.searchFacilities).toHaveBeenCalledWith({ location: "Austin", facilityIds: ["recommended"] });
  });

  it("denies arbitrary server-action profile requests", async () => {
    await expect(getFacilityDetailAction("arbitrary")).rejects.toThrow();
    expect(data.getFacilityById).not.toHaveBeenCalled();
  });

  it("scopes referral candidates before pagination", async () => {
    const response = await referralFacilities(new Request("http://localhost/api/referrals/facilities?careLevel=skilled_nursing&take=1"));
    expect(response.status).toBe(200);
    expect(candidates).toHaveBeenCalledWith("skilled_nursing", [], expect.objectContaining({ take: 1, facilityIds: ["recommended"] }));
  });

  it("keeps superadmin discovery unrestricted", async () => {
    org.mockResolvedValue({ organizationId: "hospital-1", organizationType: "hospital", isSuperadmin: true, role: "superadmin" });
    await list();
    await searchFacilitiesAction({});
    await referralFacilities(new Request("http://localhost/api/referrals/facilities?careLevel=skilled_nursing"));
    expect(recommendations.getRecommendedFacilityIds).not.toHaveBeenCalled();
  });

  it("loads only recommendations without hiding those outside the hospital's location", async () => {
    const page = await NetworkPage();
    expect(page.props.recommendationsOnly).toBe(true);
    expect(page.props.defaultLocation).toBe("");
    expect(data.searchFacilities).toHaveBeenCalledWith({ location: undefined, facilityIds: ["recommended"] });
  });

  it("redirects hospital directory visits to recommendations", async () => {
    await expect(DirectoryPage()).rejects.toThrow("REDIRECT:/dashboard/facility-network");
    expect(data.getFacilities).not.toHaveBeenCalled();
  });

  it.each([["profile", NetworkDetailPage], ["tour", TourPage]] as const)("blocks direct arbitrary %s page requests", async (_name, page) => {
    await expect(page({ params: Promise.resolve({ id: "arbitrary" }) })).rejects.toThrow("NOT_FOUND");
    expect(data.getFacility).not.toHaveBeenCalled();
    expect(data.getFacilityById).not.toHaveBeenCalled();
  });

  it("renders AI guidance and hides hospital directory search controls", () => {
    const html = renderToStaticMarkup(createElement(FacilityNetworkClient, {
      defaultLocation: "", role: "social-worker", recommendationsOnly: true,
    }));
    expect(html).toContain("No facility recommendations yet");
    expect(html).toContain('href="/chat"');
    expect(html).not.toContain("Search by city");
    expect(html).not.toContain("All Facilities");
    expect(html).not.toContain("Search Network");
  });

  it("retains unrestricted network search controls", () => {
    const html = renderToStaticMarkup(createElement(FacilityNetworkClient, {
      defaultLocation: "", role: "superadmin", recommendationsOnly: false,
    }));
    expect(html).toContain("Search by city");
    expect(html).toContain("All Facilities");
    expect(html).toContain("Search Network");
  });
});
