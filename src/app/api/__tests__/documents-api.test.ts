import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    document: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      count: vi.fn(),
      aggregate: vi.fn(),
      groupBy: vi.fn(),
    },
    documentAccessLog: {
      create: vi.fn(),
      count: vi.fn(),
      findMany: vi.fn(),
    },
  },
}));

import { prisma } from "@/lib/prisma";
import {
  getDocuments,
  getDocument,
  createDocument,
  deleteDocument,
  logDocumentAccess,
  getDocumentStats,
  DataAccessError,
} from "@/lib/data-access";

const mockDocRecord: any = {
  id: "doc-1",
  organizationId: "org-1",
  uploadedById: "user-1",
  title: "HIPAA Policy 2025",
  description: "Annual HIPAA policy update",
  category: "policies" as any,
  tags: ["hipaa", "compliance", "2025"],
  fileName: "hipaa-policy-2025.pdf",
  fileType: "pdf",
  fileSize: 204800,
  storageKey: "uploads/hipaa-policy-2025.pdf",
  storageBucket: "carebridge-docs",
  storageEndpoint: "https://s3.amazonaws.com",
  encryptionKey: null,
  encryptionIv: null,
  checksum: "sha256-abc123",
  mimeType: "application/pdf",
  version: 1,
  isArchived: false,
  isOnLegalHold: false,
  retentionDate: null,
  notes: null,
  expiresAt: null,
  deletedAt: null,
  uploadedBy: { firstName: "Jane", lastName: "Smith", email: "jane@hospital.com" },
  createdAt: new Date("2025-06-01T10:00:00Z"),
  updatedAt: new Date("2025-06-01T10:00:00Z"),
};

const mockDocRecord2: any = {
  id: "doc-2",
  organizationId: "org-1",
  uploadedById: "user-1",
  title: "Consent Form A",
  description: null,
  category: "consent_forms",
  tags: [],
  fileName: "consent-a.pdf",
  fileType: "pdf",
  fileSize: 51200,
  storageKey: "uploads/consent-a.pdf",
  storageBucket: "carebridge-docs",
  storageEndpoint: "https://s3.amazonaws.com",
  encryptionKey: null,
  encryptionIv: null,
  checksum: null,
  mimeType: "application/pdf",
  version: 1,
  isArchived: false,
  isOnLegalHold: false,
  retentionDate: null,
  notes: null,
  expiresAt: null,
  deletedAt: null,
  uploadedBy: { firstName: "Jane", lastName: "Smith", email: "jane@hospital.com" },
  createdAt: new Date("2025-06-02T10:00:00Z"),
  updatedAt: new Date("2025-06-02T10:00:00Z"),
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe("getDocuments", () => {
  it("returns paginated results", async () => {
    vi.mocked(prisma.document.findMany).mockResolvedValue([mockDocRecord, mockDocRecord2]);
    vi.mocked(prisma.document.count).mockResolvedValue(2);

    const result = await getDocuments("org-1", "administrator");

    expect(result.data).toHaveLength(2);
    expect(result.pagination).toEqual({
      page: 1,
      pageSize: 20,
      totalItems: 2,
      totalPages: 1,
    });
  });

  it("respects organization scoping for non-superadmin", async () => {
    vi.mocked(prisma.document.findMany).mockResolvedValue([mockDocRecord]);
    vi.mocked(prisma.document.count).mockResolvedValue(1);

    await getDocuments("org-1", "administrator");

    const where = vi.mocked(prisma.document.findMany).mock.calls[0][0]?.where;
    expect(where).toHaveProperty("organizationId", "org-1");
    expect(where).toHaveProperty("deletedAt", null);
  });

  it("bypasses org scoping for superadmin", async () => {
    vi.mocked(prisma.document.findMany).mockResolvedValue([mockDocRecord]);
    vi.mocked(prisma.document.count).mockResolvedValue(1);

    await getDocuments("org-other", "superadmin");

    const where = vi.mocked(prisma.document.findMany).mock.calls[0][0]?.where;
    expect(where).not.toHaveProperty("organizationId");
    expect(where).toHaveProperty("deletedAt", null);
  });

  it("filters soft-deleted documents by default", async () => {
    vi.mocked(prisma.document.findMany).mockResolvedValue([]);
    vi.mocked(prisma.document.count).mockResolvedValue(0);

    await getDocuments("org-1", "administrator");

    const where = vi.mocked(prisma.document.findMany).mock.calls[0][0]?.where;
    expect(where).toHaveProperty("deletedAt", null);
  });

  it("applies search params correctly", async () => {
    vi.mocked(prisma.document.findMany).mockResolvedValue([mockDocRecord]);
    vi.mocked(prisma.document.count).mockResolvedValue(1);

    await getDocuments("org-1", "administrator", {
      query: "HIPAA",
      category: "policies",
      tags: ["hipaa"],
      page: 1,
      pageSize: 10,
      sortBy: "title",
      sortOrder: "asc",
    });

    const findManyArgs = vi.mocked(prisma.document.findMany).mock.calls[0][0]!;
    expect(findManyArgs!.where).toHaveProperty("OR");
    expect(findManyArgs!.where).toHaveProperty("category", "policies");
    expect(findManyArgs!.where).toHaveProperty("tags");
    expect(findManyArgs!.orderBy).toEqual({ title: "asc" });
    expect(findManyArgs!.skip).toBe(0);
    expect(findManyArgs!.take).toBe(10);
  });
});

describe("getDocument", () => {
  it("returns a single document", async () => {
    vi.mocked(prisma.document.findFirst).mockResolvedValue(mockDocRecord);

    const doc = await getDocument("doc-1", "org-1", "administrator");

    expect(doc).not.toBeNull();
    expect(doc?.id).toBe("doc-1");
    expect(doc?.title).toBe("HIPAA Policy 2025");
    expect(doc?.category).toBe("policies");
  });

  it("returns null for document in wrong organization", async () => {
    vi.mocked(prisma.document.findFirst).mockResolvedValue(null);

    const doc = await getDocument("doc-1", "org-other", "administrator");

    expect(doc).toBeNull();
  });

  it("bypasses org scoping for superadmin", async () => {
    vi.mocked(prisma.document.findFirst).mockResolvedValue(mockDocRecord);

    await getDocument("doc-1", "org-any", "superadmin");

    const where = vi.mocked(prisma.document.findFirst).mock.calls[0][0]?.where;
    expect(where).not.toHaveProperty("organizationId");
    expect(where).toHaveProperty("id", "doc-1");
  });

  it("returns null for soft-deleted document", async () => {
    vi.mocked(prisma.document.findFirst).mockResolvedValue(null);

    const doc = await getDocument("deleted-doc", "org-1", "administrator");

    expect(doc).toBeNull();
  });
});

describe("createDocument", () => {
  const createPayload = {
    organizationId: "org-1",
    uploadedById: "user-1",
    title: "New Document",
    description: "A test document",
    category: "compliance-documents",
    tags: ["compliance"],
    fileName: "new-doc.pdf",
    fileType: "pdf",
    fileSize: 102400,
    storageKey: "uploads/new-doc.pdf",
    storageBucket: "carebridge-docs",
    storageEndpoint: "https://s3.amazonaws.com",
    encryptionKey: "enc-key-1",
    encryptionIv: "enc-iv-1",
    checksum: "sha256-xyz",
    mimeType: "application/pdf",
    retentionDate: "2026-06-01T00:00:00Z",
    notes: "Urgent review needed",
    expiresAt: "2025-12-31T00:00:00Z",
  };

  it("creates a document with all fields and sets version to 1", async () => {
    vi.mocked(prisma.document.create).mockResolvedValue({
      ...mockDocRecord,
      id: "new-doc-1",
      title: "New Document",
      category: "compliance_documents",
      tags: ["compliance"],
      version: 1,
    });

    const doc = await createDocument(createPayload);

    expect(doc).not.toBeNull();
    expect(doc.title).toBe("New Document");
    expect(doc.version).toBe(1);
    expect(doc.category).toBe("compliance-documents");
    expect(doc.tags).toEqual(["compliance"]);

    const createArgs = vi.mocked(prisma.document.create).mock.calls[0][0];
    expect(createArgs.data.version).toBe(1);
    expect(createArgs.data.category).toBe("compliance_documents");
  });

  it("handles empty tag arrays", async () => {
    vi.mocked(prisma.document.create).mockResolvedValue({
      ...mockDocRecord,
      id: "new-doc-2",
      title: "No Tags Doc",
      tags: [],
      version: 1,
    });

    const doc = await createDocument({ ...createPayload, tags: [] });

    expect(doc.tags).toEqual([]);
    const createArgs = vi.mocked(prisma.document.create).mock.calls[0][0];
    expect(createArgs.data.tags).toEqual([]);
  });

  it("handles very long titles", async () => {
    const longTitle = "A".repeat(500);
    vi.mocked(prisma.document.create).mockResolvedValue({
      ...mockDocRecord,
      id: "new-doc-3",
      title: longTitle,
      version: 1,
    });

    const doc = await createDocument({ ...createPayload, title: longTitle });

    expect(doc.title).toHaveLength(500);
    const createArgs = vi.mocked(prisma.document.create).mock.calls[0][0];
    expect(createArgs.data.title).toHaveLength(500);
  });

  it("sets null for optional fields when omitted", async () => {
    vi.mocked(prisma.document.create).mockResolvedValue({
      ...mockDocRecord,
      id: "new-doc-4",
      title: "Minimal Doc",
      description: null,
      encryptionKey: null,
      encryptionIv: null,
      checksum: null,
      retentionDate: null,
      notes: null,
      expiresAt: null,
      version: 1,
    });

    const minimalPayload = {
      organizationId: "org-1",
      uploadedById: "user-1",
      title: "Minimal Doc",
      category: "other",
      tags: [],
      fileName: "minimal.pdf",
      fileType: "pdf",
      fileSize: 100,
      storageKey: "key",
      storageBucket: "bucket",
      storageEndpoint: "endpoint",
      mimeType: "application/pdf",
    };

    const doc = await createDocument(minimalPayload);

    expect(doc.title).toBe("Minimal Doc");
    expect(doc.version).toBe(1);
  });
});

describe("deleteDocument", () => {
  it("soft-deletes a document (sets deletedAt)", async () => {
    vi.mocked(prisma.document.findFirst).mockResolvedValue(mockDocRecord);
    vi.mocked(prisma.document.update).mockResolvedValue({
      ...mockDocRecord,
      deletedAt: new Date("2025-06-15T10:00:00Z"),
    });

    const result = await deleteDocument("doc-1", "org-1", "administrator");

    expect(result.success).toBe(true);

    const updateArgs = vi.mocked(prisma.document.update).mock.calls[0][0];
    expect(updateArgs.data).toHaveProperty("deletedAt");
    expect(updateArgs.data.deletedAt).toBeInstanceOf(Date);
  });

  it("throws DataAccessError if document is on legal hold", async () => {
    vi.mocked(prisma.document.findFirst).mockResolvedValue({
      ...mockDocRecord,
      isOnLegalHold: true,
    });

    await expect(
      deleteDocument("doc-legal", "org-1", "administrator"),
    ).rejects.toThrow(DataAccessError);

    await expect(
      deleteDocument("doc-legal", "org-1", "administrator"),
    ).rejects.toThrow("Document is on legal hold and cannot be deleted");

    expect(prisma.document.update).not.toHaveBeenCalled();
  });

  it("throws DataAccessError if document not found", async () => {
    vi.mocked(prisma.document.findFirst).mockResolvedValue(null);

    await expect(
      deleteDocument("nonexistent", "org-1", "administrator"),
    ).rejects.toThrow(DataAccessError);

    await expect(
      deleteDocument("nonexistent", "org-1", "administrator"),
    ).rejects.toThrow("Document not found");
  });

  it("logs deletion after soft-delete", async () => {
    vi.mocked(prisma.document.findFirst).mockResolvedValue(mockDocRecord);
    vi.mocked(prisma.document.update).mockResolvedValue({
      ...mockDocRecord,
      deletedAt: new Date("2025-06-15T10:00:00Z"),
    });
    vi.mocked(prisma.documentAccessLog.create).mockResolvedValue({} as any);

    await deleteDocument("doc-1", "org-1", "administrator");

    expect(prisma.documentAccessLog.create).toHaveBeenCalledTimes(1);
    const logArgs = vi.mocked(prisma.documentAccessLog.create).mock.calls[0][0];
    expect(logArgs.data.action).toBe("DELETE");
    expect(logArgs.data.documentId).toBe("doc-1");
  });
});

describe("logDocumentAccess", () => {
  it("creates an audit log entry", async () => {
    vi.mocked(prisma.documentAccessLog.create).mockResolvedValue({} as any);

    await logDocumentAccess({
      documentId: "doc-1",
      userId: "user-1",
      action: "VIEW",
      ipAddress: "192.168.1.1",
      userAgent: "Mozilla/5.0",
      success: true,
      details: "Viewed document",
    });

    expect(prisma.documentAccessLog.create).toHaveBeenCalledTimes(1);
    const logArgs = vi.mocked(prisma.documentAccessLog.create).mock.calls[0][0];
    expect(logArgs.data.documentId).toBe("doc-1");
    expect(logArgs.data.action).toBe("VIEW");
    expect(logArgs.data.ipAddress).toBe("192.168.1.1");
  });

  it("sets defaults for optional fields", async () => {
    vi.mocked(prisma.documentAccessLog.create).mockResolvedValue({} as any);

    await logDocumentAccess({
      documentId: "doc-1",
      userId: "user-1",
      action: "DOWNLOAD",
    });

    const logArgs = vi.mocked(prisma.documentAccessLog.create).mock.calls[0][0];
    expect(logArgs.data.success).toBe(true);
    expect(logArgs.data.details).toBeNull();
    expect(logArgs.data.ipAddress).toBeNull();
    expect(logArgs.data.userAgent).toBeNull();
  });
});

describe("getDocumentStats", () => {
  it("returns aggregated document statistics", async () => {
    vi.mocked(prisma.document.count).mockResolvedValueOnce(10);
    vi.mocked(prisma.document.aggregate).mockResolvedValue({
      _sum: { fileSize: 1048576 },
    } as any);
    vi.mocked(prisma.document.groupBy).mockResolvedValue([
      { category: "policies", _count: { id: 3 } },
      { category: "consent_forms", _count: { id: 7 } },
    ] as any);
    vi.mocked(prisma.document.count)
      .mockResolvedValueOnce(10)
      .mockResolvedValueOnce(1048576)
      .mockResolvedValueOnce(2)
      .mockResolvedValueOnce(1)
      .mockResolvedValueOnce(3);

    const stats = await getDocumentStats("org-1", "administrator");

    expect(stats.totalDocuments).toBe(10);
    expect(stats.totalSize).toBe(1048576);
    expect(stats.byCategory).toEqual({
      policies: 3,
      "consent-forms": 7,
    });
  });
});

describe("edge cases — pagination", () => {
  it("handles page 0 gracefully (produces negative skip)", async () => {
    vi.mocked(prisma.document.findMany).mockResolvedValue([]);
    vi.mocked(prisma.document.count).mockResolvedValue(0);

    await getDocuments("org-1", "administrator", { page: 0, pageSize: 20 });

    const findManyArgs0 = vi.mocked(prisma.document.findMany).mock.calls[0][0]!;
    expect(findManyArgs0!.skip).toBe(-20);
  });

  it("handles negative page gracefully", async () => {
    vi.mocked(prisma.document.findMany).mockResolvedValue([]);
    vi.mocked(prisma.document.count).mockResolvedValue(0);

    await getDocuments("org-1", "administrator", { page: -5, pageSize: 20 });

    const findManyArgsNeg = vi.mocked(prisma.document.findMany).mock.calls[0][0]!;
    expect(findManyArgsNeg!.skip).toBe(-120);
  });

  it("clamps pageSize to maximum of 100", async () => {
    vi.mocked(prisma.document.findMany).mockResolvedValue([]);
    vi.mocked(prisma.document.count).mockResolvedValue(0);

    await getDocuments("org-1", "administrator", { page: 1, pageSize: 500 });

    const findManyArgsClamp = vi.mocked(prisma.document.findMany).mock.calls[0][0]!;
    expect(findManyArgsClamp!.take).toBe(100);
  });

  it("defaults page to 1 and pageSize to 20", async () => {
    vi.mocked(prisma.document.findMany).mockResolvedValue([]);
    vi.mocked(prisma.document.count).mockResolvedValue(0);

    await getDocuments("org-1", "administrator");

    const findManyArgsDef = vi.mocked(prisma.document.findMany).mock.calls[0][0]!;
    expect(findManyArgsDef!.skip).toBe(0);
    expect(findManyArgsDef!.take).toBe(20);
  });
});

describe("edge cases — category enum consistency", () => {
  it("converts kebab-case category to snake_case for Prisma queries", async () => {
    vi.mocked(prisma.document.findMany).mockResolvedValue([mockDocRecord]);
    vi.mocked(prisma.document.count).mockResolvedValue(1);

    await getDocuments("org-1", "administrator", { category: "patient-records" });

    const where2 = vi.mocked(prisma.document.findMany).mock.calls[0][0]?.where;
    expect(where2!.category).toBe("patient_records");
  });

  it("converts snake_case from Prisma back to kebab-case in response", async () => {
    vi.mocked(prisma.document.findFirst).mockResolvedValue({
      ...mockDocRecord,
      category: "patient_records",
    });

    const doc = await getDocument("doc-1", "org-1", "administrator");

    expect(doc?.category).toBe("patient-records");
  });

  it("handles all known DocumentCategory values through the round-trip", async () => {
    const categories = [
      "patient-records",
      "medical-documentation",
      "consent-forms",
      "insurance-documents",
      "compliance-documents",
      "policies",
      "procedures",
      "audit-documents",
      "employee-training-records",
      "business-associate-agreements",
      "security-documentation",
      "privacy-documentation",
      "other",
    ];

    for (const cat of categories) {
      const snakeCat = cat.replace(/-/g, "_");
      vi.mocked(prisma.document.findFirst).mockResolvedValue({
        ...mockDocRecord,
        category: snakeCat as any,
      });

      const doc = await getDocument("doc-1", "org-1", "administrator");
      expect(doc?.category).toBe(cat);
    }
  });
});
