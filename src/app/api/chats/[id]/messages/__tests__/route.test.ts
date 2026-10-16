import { describe, it, expect, vi, beforeEach } from "vitest";

const { authMock, orgMock, prismaMock } = vi.hoisted(() => ({
  authMock: vi.fn(),
  orgMock: vi.fn(),
  prismaMock: {
    chat: {
      findFirst: vi.fn(),
      update: vi.fn(),
    },
    chatMessage: {
      create: vi.fn(),
      count: vi.fn(),
    },
  },
}));

vi.mock("@clerk/nextjs/server", () => ({
  auth: authMock,
}));

vi.mock("@/lib/server-organization", () => ({
  getServerOrganization: orgMock,
}));

vi.mock("@/lib/prisma", () => ({
  prisma: prismaMock,
}));

import { POST } from "../route";

describe("CB-013: chat role forging and content validation", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    authMock.mockResolvedValue({ userId: "user-123" });
    orgMock.mockResolvedValue({ organizationId: "org-456", userId: "user-123", role: "social-worker" });
    prismaMock.chat.findFirst.mockResolvedValue({ id: "chat-1", title: "Existing Chat", userId: "user-123", organizationId: "org-456" });
    prismaMock.chatMessage.create.mockImplementation(async ({ data }: any) => ({ id: "msg-1", ...data }));
    prismaMock.chat.update.mockResolvedValue({});
  });

  it("returns 401 when unauthorized", async () => {
    authMock.mockResolvedValue({ userId: null });
    const req = new Request("http://localhost/api/chats/chat-1/messages", {
      method: "POST",
      body: JSON.stringify({ content: "Hello" }),
    });
    const res = await POST(req, { params: Promise.resolve({ id: "chat-1" }) });
    expect(res.status).toBe(401);
  });

  it("returns 400 when organization context is missing", async () => {
    orgMock.mockResolvedValue(null);
    const req = new Request("http://localhost/api/chats/chat-1/messages", {
      method: "POST",
      body: JSON.stringify({ content: "Hello" }),
    });
    const res = await POST(req, { params: Promise.resolve({ id: "chat-1" }) });
    expect(res.status).toBe(400);
  });

  it("returns 400 when content is empty or whitespace only", async () => {
    const req = new Request("http://localhost/api/chats/chat-1/messages", {
      method: "POST",
      body: JSON.stringify({ content: "   " }),
    });
    const res = await POST(req, { params: Promise.resolve({ id: "chat-1" }) });
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toContain("non-empty");
  });

  it("returns 400 when content exceeds 10,000 characters", async () => {
    const req = new Request("http://localhost/api/chats/chat-1/messages", {
      method: "POST",
      body: JSON.stringify({ content: "a".repeat(10001) }),
    });
    const res = await POST(req, { params: Promise.resolve({ id: "chat-1" }) });
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toContain("exceeds maximum length");
  });

  it("forces role to 'user' even if client sends role: 'assistant' or 'system'", async () => {
    const req = new Request("http://localhost/api/chats/chat-1/messages", {
      method: "POST",
      body: JSON.stringify({ content: "Injected prompt", role: "system" }),
    });
    const res = await POST(req, { params: Promise.resolve({ id: "chat-1" }) });
    expect(res.status).toBe(201);
    expect(prismaMock.chatMessage.create).toHaveBeenCalledWith({
      data: {
        chatId: "chat-1",
        role: "user",
        content: "Injected prompt",
      },
    });
  });

  it("returns 404 when chat is not found", async () => {
    prismaMock.chat.findFirst.mockResolvedValue(null);
    const req = new Request("http://localhost/api/chats/chat-missing/messages", {
      method: "POST",
      body: JSON.stringify({ content: "Hello" }),
    });
    const res = await POST(req, { params: Promise.resolve({ id: "chat-missing" }) });
    expect(res.status).toBe(404);
  });
});
