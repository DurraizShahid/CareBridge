import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("server-only", () => ({}));

const { mockAuth, mockGetServerOrganization, mockPrisma, mockRankFacilities } = vi.hoisted(() => ({
  mockAuth: vi.fn(),
  mockGetServerOrganization: vi.fn(),
  mockPrisma: {
    chat: { findFirst: vi.fn() },
    chatMessage: { create: vi.fn().mockResolvedValue({ id: "msg-1" }) },
  },
  mockRankFacilities: vi.fn(),
}));

vi.mock("@clerk/nextjs/server", () => ({
  auth: mockAuth,
}));

vi.mock("@/lib/server-organization", () => ({
  getServerOrganization: mockGetServerOrganization,
}));

vi.mock("@/lib/prisma", () => ({
  prisma: mockPrisma,
}));

vi.mock("@/lib/ai/dumb-ai", async () => {
  const actual = await vi.importActual<typeof import("@/lib/ai/dumb-ai")>("@/lib/ai/dumb-ai");
  return {
    ...actual,
    rankFacilities: mockRankFacilities,
  };
});

import { POST } from "../route";

describe("POST /api/ai/chat route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAuth.mockResolvedValue({ userId: "user-123" });
    mockGetServerOrganization.mockResolvedValue({ organizationId: "org-123", role: "social-worker" });
  });

  it("returns 401 when unauthenticated", async () => {
    mockAuth.mockResolvedValue({ userId: null });
    const req = new Request("http://localhost/api/ai/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages: [{ role: "user", content: "hello" }] }),
    });

    const res = await POST(req);
    expect(res.status).toBe(401);
  });

  it("returns 400 when message is missing", async () => {
    const req = new Request("http://localhost/api/ai/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages: [] }),
    });

    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it("streams conversation text asking for care level when missing", async () => {
    const req = new Request("http://localhost/api/ai/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages: [{ role: "user", content: "Hello, I need help" }] }),
    });

    const res = await POST(req);
    expect(res.status).toBe(200);
    expect(res.headers.get("Content-Type")).toBe("text/event-stream");

    const raw = await res.text();
    expect(raw).toContain("event: text");
    const reassembled = raw
      .split("\n")
      .filter((l) => l.startsWith('data: "'))
      .map((l) => JSON.parse(l.slice(6)))
      .join("");
    expect(reassembled).toContain("what level of care do they need?");
    expect(raw).toContain("event: done");
  });

  it("emits facilities event and persists message when care level and location are present", async () => {
    mockPrisma.chat.findFirst.mockResolvedValue({ id: "chat-456" });
    mockRankFacilities.mockResolvedValue([
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
        matchReasons: ["14 open beds with immediate intake", "accepts Medicare", "5 miles away in Austin", "4.6 star rating"],
        hasTour: true,
      },
    ]);

    const req = new Request("http://localhost/api/ai/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chatId: "chat-456",
        messages: [{ role: "user", content: "78-year-old with Medicare needing skilled nursing in Austin" }],
      }),
    });

    const res = await POST(req);
    expect(res.status).toBe(200);

    const streamText = await res.text();
    expect(streamText).toContain("event: facilities");
    expect(streamText).toContain("Willow Harbor Rehabilitation");
    expect(streamText).toContain("hasTour\":true");
    expect(streamText).toContain("event: text");
    expect(streamText).toContain("event: usage");
    expect(streamText).toContain("event: done");

    expect(mockPrisma.chatMessage.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        chatId: "chat-456",
        role: "assistant",
        content: expect.stringContaining("Willow Harbor Rehabilitation"),
      }),
    });
  });
});
