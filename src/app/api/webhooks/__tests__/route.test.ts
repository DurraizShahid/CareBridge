import { describe, it, expect, vi, beforeEach } from "vitest";

const { verifyWebhookMock, prismaMock } = vi.hoisted(() => ({
  verifyWebhookMock: vi.fn(),
  prismaMock: {
    user: {
      findUnique: vi.fn(),
      upsert: vi.fn(),
      delete: vi.fn(),
    },
    organization: {
      upsert: vi.fn(),
      delete: vi.fn(),
    },
    $transaction: vi.fn(),
  },
}));

vi.mock("@clerk/nextjs/webhooks", () => ({
  verifyWebhook: verifyWebhookMock,
}));

vi.mock("@/lib/prisma", () => ({
  prisma: prismaMock,
}));

import { POST } from "../route";
import { NextRequest } from "next/server";

describe("CB-015 & CB-016: Clerk webhook hardening", () => {
  let logSpy: any;

  beforeEach(() => {
    vi.resetAllMocks();
    logSpy = vi.spyOn(console, "log").mockImplementation(() => {});
  });

  it("CB-015: user.created removes email from log statements", async () => {
    verifyWebhookMock.mockResolvedValue({
      type: "user.created",
      data: {
        id: "user_test123",
        email_addresses: [{ email_address: "sensitive_patient@example.com" }],
        first_name: "Test",
        last_name: "User",
      },
    });
    prismaMock.user.findUnique.mockResolvedValue(null);
    prismaMock.user.upsert.mockResolvedValue({});

    const req = new NextRequest("http://localhost/api/webhooks", { method: "POST" });
    const res = await POST(req);
    expect(res.status).toBe(200);

    expect(logSpy).toHaveBeenCalled();
    const [logPayload, logMessage] = logSpy.mock.calls[0];

    // Payload must include eventId and userId
    expect(logPayload.eventId).toBeDefined();
    expect(logPayload.userId).toBe("user_test123");
    expect(logMessage).toBe("user.created: user_test123");

    // Email must NOT be in the log payload or message
    expect(logPayload.email).toBeUndefined();
    expect(JSON.stringify(logPayload)).not.toContain("sensitive_patient@example.com");
    expect(logMessage).not.toContain("sensitive_patient@example.com");
  });

  it("CB-015: user.updated removes email from log statements", async () => {
    verifyWebhookMock.mockResolvedValue({
      type: "user.updated",
      data: {
        id: "user_test456",
        email_addresses: [{ email_address: "updated_email@example.com" }],
      },
    });
    prismaMock.user.findUnique.mockResolvedValue({ id: "user_test456", role: "customer", organizationId: null });
    prismaMock.user.upsert.mockResolvedValue({});

    const req = new NextRequest("http://localhost/api/webhooks", { method: "POST" });
    const res = await POST(req);
    expect(res.status).toBe(200);

    expect(logSpy).toHaveBeenCalled();
    const [logPayload, logMessage] = logSpy.mock.calls[0];

    expect(logPayload.eventId).toBeDefined();
    expect(logPayload.userId).toBe("user_test456");
    expect(logMessage).toBe("user.updated: user_test456");

    expect(logPayload.email).toBeUndefined();
    expect(JSON.stringify(logPayload)).not.toContain("updated_email@example.com");
    expect(logMessage).not.toContain("updated_email@example.com");
  });

  it("CB-016: user.deleted is idempotent when user does not exist in DB", async () => {
    verifyWebhookMock.mockResolvedValue({
      type: "user.deleted",
      data: { id: "user_nonexistent" },
    });
    prismaMock.user.findUnique.mockResolvedValue(null);

    const req = new NextRequest("http://localhost/api/webhooks", { method: "POST" });
    const res = await POST(req);

    expect(res.status).toBe(200);
    expect(prismaMock.user.findUnique).toHaveBeenCalledWith({ where: { id: "user_nonexistent" } });
    expect(prismaMock.user.delete).not.toHaveBeenCalled();
    expect(logSpy).toHaveBeenCalledWith(
      expect.objectContaining({ event: "webhook_user_deleted", userId: "user_nonexistent" }),
      "user.deleted: user_nonexistent"
    );
  });

  it("CB-016: user.deleted deletes existing user", async () => {
    verifyWebhookMock.mockResolvedValue({
      type: "user.deleted",
      data: { id: "user_existing" },
    });
    prismaMock.user.findUnique.mockResolvedValue({ id: "user_existing" });
    prismaMock.user.delete.mockResolvedValue({});

    const req = new NextRequest("http://localhost/api/webhooks", { method: "POST" });
    const res = await POST(req);

    expect(res.status).toBe(200);
    expect(prismaMock.user.findUnique).toHaveBeenCalledWith({ where: { id: "user_existing" } });
    expect(prismaMock.user.delete).toHaveBeenCalledWith({ where: { id: "user_existing" } });
  });

  it("CB-016: user.deleted treats P2025 (not found during concurrent delete) as success", async () => {
    verifyWebhookMock.mockResolvedValue({
      type: "user.deleted",
      data: { id: "user_racing" },
    });
    prismaMock.user.findUnique.mockResolvedValue({ id: "user_racing" });
    const p2025Error = Object.assign(new Error("Record not found"), { code: "P2025" });
    prismaMock.user.delete.mockRejectedValue(p2025Error);

    const req = new NextRequest("http://localhost/api/webhooks", { method: "POST" });
    const res = await POST(req);

    expect(res.status).toBe(200);
  });
});
