import { describe, it, expect, vi, beforeEach } from "vitest";

const { authMock, orgMock, prismaMock } = vi.hoisted(() => ({
  authMock: vi.fn(),
  orgMock: vi.fn(),
  prismaMock: {
    chat: {
      findFirst: vi.fn(),
      update: vi.fn(),
      updateMany: vi.fn(),
    },
    chatMessage: {
      create: vi.fn(),
      count: vi.fn(),
    },
    $transaction: vi.fn(),
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

describe("CB-013 & CB-014: chat role forging, content validation & atomic creation", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    authMock.mockResolvedValue({ userId: "user-123" });
    orgMock.mockResolvedValue({ organizationId: "org-456", userId: "user-123", role: "social-worker" });
    prismaMock.$transaction.mockImplementation(async (fn: any) =>
      typeof fn === "function" ? fn(prismaMock) : Promise.all(fn)
    );
    prismaMock.chat.findFirst.mockResolvedValue({ id: "chat-1", title: "Existing Chat", userId: "user-123", organizationId: "org-456" });
    prismaMock.chatMessage.create.mockImplementation(async ({ data }: any) => ({ id: "msg-1", ...data }));
    prismaMock.chat.update.mockResolvedValue({});
    prismaMock.chat.updateMany.mockResolvedValue({ count: 1 });
    prismaMock.chatMessage.count.mockResolvedValue(2);
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

  it("CB-014: wraps all message writes in a single Prisma transaction", async () => {
    const req = new Request("http://localhost/api/chats/chat-1/messages", {
      method: "POST",
      body: JSON.stringify({ content: "Transactional message" }),
    });
    const res = await POST(req, { params: Promise.resolve({ id: "chat-1" }) });
    expect(res.status).toBe(201);
    expect(prismaMock.$transaction).toHaveBeenCalledTimes(1);
    expect(prismaMock.chatMessage.create).toHaveBeenCalledWith({
      data: {
        chatId: "chat-1",
        role: "user",
        content: "Transactional message",
      },
    });
    expect(prismaMock.chat.update).toHaveBeenCalledWith({
      where: { id: "chat-1" },
      data: { updatedAt: expect.any(Date) },
    });
  });

  it("CB-014: auto-generates title on first user message when title is 'New Chat'", async () => {
    prismaMock.chat.findFirst.mockResolvedValue({
      id: "chat-1",
      title: "New Chat",
      userId: "user-123",
      organizationId: "org-456",
    });
    prismaMock.chatMessage.count.mockResolvedValue(1);

    const req = new Request("http://localhost/api/chats/chat-1/messages", {
      method: "POST",
      body: JSON.stringify({ content: "What care options are available?" }),
    });
    const res = await POST(req, { params: Promise.resolve({ id: "chat-1" }) });
    expect(res.status).toBe(201);

    expect(prismaMock.chat.updateMany).toHaveBeenCalledWith({
      where: { id: "chat-1", title: "New Chat" },
      data: {
        title: "What care options are available?",
        updatedAt: expect.any(Date),
      },
    });
    // Since updateMany succeeded (count > 0), second update is skipped
    expect(prismaMock.chat.update).not.toHaveBeenCalled();
  });

  it("CB-014: title generation is concurrency safe if concurrent first message already claimed title", async () => {
    prismaMock.chat.findFirst.mockResolvedValue({
      id: "chat-1",
      title: "New Chat",
      userId: "user-123",
      organizationId: "org-456",
    });
    prismaMock.chatMessage.count.mockResolvedValue(1);
    // Simulate concurrent request having already updated title to something else
    prismaMock.chat.updateMany.mockResolvedValue({ count: 0 });

    const req = new Request("http://localhost/api/chats/chat-1/messages", {
      method: "POST",
      body: JSON.stringify({ content: "Simultaneous second first message" }),
    });
    const res = await POST(req, { params: Promise.resolve({ id: "chat-1" }) });
    expect(res.status).toBe(201);

    // updateMany was attempted atomically
    expect(prismaMock.chat.updateMany).toHaveBeenCalledWith({
      where: { id: "chat-1", title: "New Chat" },
      data: {
        title: "Simultaneous second first message",
        updatedAt: expect.any(Date),
      },
    });
    // Falls back to updating updatedAt without overwriting the title
    expect(prismaMock.chat.update).toHaveBeenCalledWith({
      where: { id: "chat-1" },
      data: { updatedAt: expect.any(Date) },
    });
  });

  it("CB-014: returns 500 when transaction fails", async () => {
    prismaMock.$transaction.mockRejectedValue(new Error("Database transaction aborted"));
    const req = new Request("http://localhost/api/chats/chat-1/messages", {
      method: "POST",
      body: JSON.stringify({ content: "Message during DB failure" }),
    });
    const res = await POST(req, { params: Promise.resolve({ id: "chat-1" }) });
    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.error).toBe("Internal server error");
  });
});
