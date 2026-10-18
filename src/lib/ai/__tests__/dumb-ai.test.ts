import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock server-only and dependencies before imports
vi.mock("server-only", () => ({}));

const { mockCalculateFacilityScore, mockSearchFacilities, mockListReferralCandidates } = vi.hoisted(() => ({
  mockCalculateFacilityScore: vi.fn(),
  mockSearchFacilities: vi.fn(),
  mockListReferralCandidates: vi.fn(),
}));

vi.mock("@/lib/data-access", () => ({
  calculateFacilityScore: mockCalculateFacilityScore,
  searchFacilities: mockSearchFacilities,
}));

vi.mock("@/lib/referrals", () => ({
  listReferralCandidates: mockListReferralCandidates,
}));

import {
  parsePatientInput,
  rankFacilities,
  generateResponse,
  buildConversationState,
  isDischargeInquiry,
  DISCHARGE_GUIDANCE_RESPONSE,
  type RankedFacility,
} from "../dumb-ai";
import type { Facility } from "@/types";

describe("dumb-ai rule-based recommendation engine", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("parsePatientInput", () => {
    it("extracts skilled nursing, Austin, Medicare, 78yo, hip fracture and ORIF", () => {
      const input = "78-year-old, hip fracture after ORIF, Medicare, needs skilled nursing near Austin";
      const result = parsePatientInput(input);

      expect(result.careLevel).toBe("skilled-nursing");
      expect(result.careLevelLabel).toBe("Skilled Nursing (SNF)");
      expect(result.location).toBe("Austin");
      expect(result.insurance).toBe("Medicare");
      expect(result.age).toBe(78);
      expect(result.conditions).toContain("Hip fracture");
      expect(result.conditions).toContain("ORIF surgery");
    });

    it("extracts rehab, Dallas, Private (Aetna), 64yo, stroke recovery and weakness", () => {
      const input = "Post-stroke rehab for a 64-year-old with left-side weakness, Aetna, Dallas";
      const result = parsePatientInput(input);

      expect(result.careLevel).toBe("rehabilitation");
      expect(result.location).toBe("Dallas");
      expect(result.insurance).toBe("Private");
      expect(result.age).toBe(64);
      expect(result.conditions).toContain("Stroke recovery");
      expect(result.conditions).toContain("Weakness");
    });

    it("extracts memory care, Houston, Medicaid, Alzheimer's", () => {
      const input = "Memory care for moderate Alzheimer's, Medicaid, family prefers Houston";
      const result = parsePatientInput(input);

      expect(result.careLevel).toBe("memory-care");
      expect(result.location).toBe("Houston");
      expect(result.insurance).toBe("Medicaid");
      expect(result.conditions).toContain("Alzheimer's disease");
    });

    it("extracts SNF and nursing home aliases", () => {
      expect(parsePatientInput("Patient needs SNF in San Antonio").careLevel).toBe("skilled-nursing");
      expect(parsePatientInput("Looking for a nursing home in Fort Worth").careLevel).toBe("skilled-nursing");
    });

    it("extracts physical therapy, OT, assisted living, hospice and VA", () => {
      const ptInput = parsePatientInput("Patient requires physical therapy and OT in Austin");
      expect(ptInput.careLevel).toBe("rehabilitation");

      const alfInput = parsePatientInput("Assisted living community needed in Sugar Land");
      expect(alfInput.careLevel).toBe("assisted-living");
      expect(alfInput.location).toBe("Sugar Land");

      const hospiceInput = parsePatientInput("Hospice care in San Antonio for veteran with VA coverage");
      expect(hospiceInput.careLevel).toBe("hospice");
      expect(hospiceInput.insurance).toBe("VA");
      expect(hospiceInput.location).toBe("San Antonio");
    });

    it("extracts diabetes and age formats (yo vs year old)", () => {
      const res1 = parsePatientInput("85yo with type 2 diabetes in Dallas");
      expect(res1.age).toBe(85);
      expect(res1.conditions).toContain("Type 2 diabetes");

      const res2 = parsePatientInput("62 yo diabetic needing rehab");
      expect(res2.age).toBe(62);
      expect(res2.conditions).toContain("Diabetes");
      expect(res2.careLevel).toBe("rehabilitation");
    });

    it("recognizes expanded Texas cities where facilities exist", () => {
      expect(parsePatientInput("Needs skilled nursing in Fort Worth").location).toBe("Fort Worth");
      expect(parsePatientInput("Looking for rehab in El Paso").location).toBe("El Paso");
      expect(parsePatientInput("Memory care near Arlington").location).toBe("Arlington");
      expect(parsePatientInput("Assisted living in Plano").location).toBe("Plano");
      expect(parsePatientInput("Hospice in Corpus Christi").location).toBe("Corpus Christi");
      expect(parsePatientInput("Patient in Lubbock needing SNF").location).toBe("Lubbock");
      expect(parsePatientInput("Rehab facility in Irving").location).toBe("Irving");
      expect(parsePatientInput("Care in Garland").location).toBe("Garland");
      expect(parsePatientInput("Options in Frisco").location).toBe("Frisco");
      expect(parsePatientInput("Looking for SNF in McKinney").location).toBe("McKinney");
      expect(parsePatientInput("Placement in Bedford").location).toBe("Bedford");
    });

    it("flags discharge inquiries such as 'discharge a patient' and 'how do I discharge'", () => {
      expect(parsePatientInput("discharge a patient").isDischargeInquiry).toBe(true);
      expect(parsePatientInput("how do I discharge").isDischargeInquiry).toBe(true);
      expect(parsePatientInput("what is the discharge process?").isDischargeInquiry).toBe(true);
      expect(parsePatientInput("Can you discharge a patient?").isDischargeInquiry).toBe(true);
    });
  });

  describe("buildConversationState", () => {
    it("accumulates state across multi-turn messages", () => {
      const messages = [
        { role: "user", content: "I have a 78-year-old patient with Medicare recovering from a hip fracture" },
        { role: "assistant", content: "What care level and city do they need?" },
        { role: "user", content: "Skilled nursing in Austin" },
      ];

      const state = buildConversationState(messages);
      expect(state.age).toBe(78);
      expect(state.insurance).toBe("Medicare");
      expect(state.conditions).toContain("Hip fracture");
      expect(state.careLevel).toBe("skilled-nursing");
      expect(state.location).toBe("Austin");
    });
  });

  describe("rankFacilities", () => {
    const mockFacilities: Facility[] = [
      {
        id: "fac-1",
        name: "Willow Harbor Rehabilitation",
        type: "skilled-nursing-facility",
        address: { street: "100 Main St", city: "Austin", state: "TX", zipCode: "78701" },
        phone: "512-555-0100",
        email: "admissions@willow.example",
        contacts: [],
        licensure: [],
        accreditations: [],
        capacity: 100,
        currentOccupancy: 86,
        insuranceAccepted: ["Medicare", "Medicaid"],
        careLevelsOffered: ["skilled-nursing", "rehabilitation"],
        specialties: ["Orthopedic rehab", "Post-surgical recovery"],
        rating: 4.8,
        reviewsCount: 45,
        hasAvailability: true,
        acceptsMedicare: true,
        acceptsMedicaid: true,
        organizationId: "org-1",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: "fac-2",
        name: "Cedar Bay Care",
        type: "skilled-nursing-facility",
        address: { street: "200 Oak Ave", city: "Austin", state: "TX", zipCode: "78702" },
        phone: "512-555-0200",
        email: "info@cedarbay.example",
        contacts: [],
        licensure: [],
        accreditations: [],
        capacity: 80,
        currentOccupancy: 78,
        insuranceAccepted: ["Medicare"],
        careLevelsOffered: ["skilled-nursing"],
        specialties: ["Wound care", "24-hour nursing"],
        rating: 4.2,
        reviewsCount: 30,
        hasAvailability: true,
        acceptsMedicare: true,
        acceptsMedicaid: false,
        organizationId: "org-2",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ];

    it("calls listReferralCandidates and calculateFacilityScore and sorts by score", async () => {
      mockListReferralCandidates.mockResolvedValue([
        { id: "fac-1", name: "Willow Harbor Rehabilitation", availableBeds: 14, specialties: [], score: 85 },
        { id: "fac-2", name: "Cedar Bay Care", availableBeds: 2, specialties: [], score: 65 },
      ]);
      mockSearchFacilities.mockResolvedValue(mockFacilities);
      mockCalculateFacilityScore.mockImplementation((f: { id: string }) => (f.id === "fac-1" ? 85 : 65));

      const ranked = await rankFacilities({
        careLevel: "skilled-nursing",
        location: "Austin",
        insurance: "Medicare",
      });

      expect(mockCalculateFacilityScore).toHaveBeenCalled();
      expect(mockListReferralCandidates).toHaveBeenCalled();
      expect(ranked).toHaveLength(2);
      expect(ranked[0].id).toBe("fac-1");
      expect(ranked[0].score).toBe(85);
      expect(ranked[0].openBeds).toBe(14);
      expect(ranked[0].hasTour).toBe(true);
      expect(ranked[0].matchReasons).toContain("Located in Austin");
      expect(ranked[1].id).toBe("fac-2");
      expect(ranked[1].score).toBe(65);
    });

    it("uses honest location phrasing 'Serving the {city} area' when outside matching city", async () => {
      mockListReferralCandidates.mockResolvedValue([
        { id: "fac-1", name: "Willow Harbor Rehabilitation", availableBeds: 14, specialties: [], score: 85 },
      ]);
      mockSearchFacilities.mockResolvedValue([mockFacilities[0]]);
      mockCalculateFacilityScore.mockImplementation(() => 85);

      const ranked = await rankFacilities({
        careLevel: "skilled-nursing",
        location: "Dallas",
      });

      expect(ranked[0].matchReasons).toContain("Serving the Austin area");
    });

    it("falls back gracefully if listReferralCandidates fails", async () => {
      mockListReferralCandidates.mockRejectedValue(new Error("Outside hospital auth context"));
      mockSearchFacilities.mockResolvedValue(mockFacilities);
      mockCalculateFacilityScore.mockImplementation((f: { id: string }) => (f.id === "fac-1" ? 90 : 70));

      const ranked = await rankFacilities({
        careLevel: "skilled-nursing",
        location: "Austin",
      });

      expect(ranked).toHaveLength(2);
      expect(ranked[0].id).toBe("fac-1");
      expect(ranked[0].score).toBe(90);
    });
  });

  describe("generateResponse", () => {
    it("asks for care level and lists options conversationally when care level is missing", () => {
      const parsed = parsePatientInput("I have a patient in Austin with Medicare");
      const response = generateResponse(parsed, []);

      expect(response).toContain("what level of care do they need?");
      expect(response).toContain("Skilled Nursing (SNF)");
      expect(response).toContain("Short-Stay Rehabilitation");
      expect(response).toContain("Memory Care");
      expect(response).toContain("Assisted Living");
      expect(response).toContain("Hospice");
    });

    it("asks for city when care level is present but location is missing", () => {
      const parsed = parsePatientInput("78-year-old patient needs skilled nursing with Medicare");
      const response = generateResponse(parsed, []);

      expect(response).toContain("Skilled Nursing");
      expect(response).toContain("Which city or metro area should we focus the search on?");
      expect(response).toContain("Austin");
      expect(response).toContain("Houston");
      expect(response).toContain("Dallas");
      expect(response).toContain("San Antonio");
    });

    it("presents top 3 facilities with score breakdown in plain language when enough info is present", () => {
      const parsed = parsePatientInput(
        "78-year-old, hip fracture after ORIF, Medicare, needs skilled nursing near Austin",
      );

      const mockRanked: RankedFacility[] = [
        {
          id: "fac-1",
          name: "Willow Harbor Rehabilitation",
          type: "rehabilitation-center",
          address: { street: "100 Medical Pkwy", city: "Austin", state: "TX", zipCode: "78701" },
          phone: "512-555-0100",
          email: "adm@willow.example",
          contacts: [],
          licensure: [],
          accreditations: [],
          capacity: 100,
          currentOccupancy: 86,
          insuranceAccepted: ["Medicare"],
          careLevelsOffered: ["skilled-nursing"],
          specialties: ["Orthopedic rehab"],
          rating: 4.6,
          reviewsCount: 30,
          hasAvailability: true,
          acceptsMedicare: true,
          acceptsMedicaid: false,
          organizationId: "org-1",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          score: 85,
          openBeds: 14,
          matchReasons: [
            "14 open beds with immediate intake",
            "accepts Medicare",
            "Located in Austin",
            "4.6 star rating",
          ],
          hasTour: true,
        },
        {
          id: "fac-2",
          name: "Cedar Bay Skilled Nursing",
          type: "skilled-nursing-facility",
          address: { street: "200 Cedar Ln", city: "Austin", state: "TX", zipCode: "78702" },
          phone: "512-555-0200",
          email: "adm@cedar.example",
          contacts: [],
          licensure: [],
          accreditations: [],
          capacity: 50,
          currentOccupancy: 48,
          insuranceAccepted: ["Medicare"],
          careLevelsOffered: ["skilled-nursing"],
          specialties: ["Wound care"],
          rating: 4.1,
          reviewsCount: 22,
          hasAvailability: true,
          acceptsMedicare: true,
          acceptsMedicaid: false,
          organizationId: "org-2",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          score: 72,
          openBeds: 2,
          matchReasons: [
            "2 open beds",
            "accepts Medicare",
            "Located in Austin",
            "4.1 star rating",
          ],
          hasTour: true,
        },
      ];

      const response = generateResponse(parsed, mockRanked);

      expect(response).toContain("Willow Harbor Rehabilitation");
      expect(response).toContain("14 open beds with immediate intake");
      expect(response).toContain("accepts Medicare");
      expect(response).toContain("Located in Austin");
      expect(response).toContain("4.6 star rating");
      expect(response).toContain("Cedar Bay Skilled Nursing");
      expect(response).toContain("3D tour link");
      expect(response).toContain("Pick a facility to see the tour, or tell me to refine");
    });

    it("returns discharge guidance when input is a discharge inquiry without claiming to execute it in chat", () => {
      const parsed = parsePatientInput("How do I discharge a patient?");
      const response = generateResponse(parsed, []);

      expect(response).toContain("Go to the Patient's Profile");
      expect(response).toContain("Discharge Patient");
      expect(response).toContain("Confirm the Discharge");
      expect(response).toContain("cannot be executed directly within chat");
      expect(response).toBe(DISCHARGE_GUIDANCE_RESPONSE);
    });
  });

  describe("isDischargeInquiry", () => {
    it("detects various discharge workflow inquiries", () => {
      expect(isDischargeInquiry("discharge a patient")).toBe(true);
      expect(isDischargeInquiry("how do I discharge")).toBe(true);
      expect(isDischargeInquiry("discharge process")).toBe(true);
      expect(isDischargeInquiry("how to discharge")).toBe(true);
      expect(isDischargeInquiry("steps to discharge")).toBe(true);
      expect(isDischargeInquiry("can I discharge a patient")).toBe(true);
    });

    it("does not falsely trigger on general clinical statements with discharge", () => {
      expect(isDischargeInquiry("estimated discharge date next month")).toBe(false);
      expect(isDischargeInquiry("patient ready for discharge, needs rehab in Austin")).toBe(false);
    });
  });
});
