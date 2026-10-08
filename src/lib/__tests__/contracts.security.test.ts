import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { createHash } from "node:crypto";

const { prismaMock, orgMock } = vi.hoisted(() => ({
  prismaMock: {
    contract: { findFirst: vi.fn(), updateMany: vi.fn(), findUnique: vi.fn(), update: vi.fn() },
    contractSignature: { create: vi.fn() },
    $queryRawUnsafe: vi.fn(),
    $transaction: vi.fn(),
  },
  orgMock: vi.fn(),
}));
vi.mock("server-only", () => ({}));
vi.mock("@/lib/prisma", () => ({ prisma: prismaMock }));
vi.mock("@/lib/referrals", () => ({
  referralContext: orgMock,
  ReferralError: class ReferralError extends Error {
    constructor(public statusCode: number, message: string) { super(message); }
  },
}));

import { renderContract, documentSha256 } from "../esign/document";
import { StandardEsignProvider } from "../esign/provider";
import { signContract, sendContract, getContract } from "../contracts";

const snapshot = {
  referralId: "ref-abc", hospitalName: "Hospital One", facilityName: "Facility Two",
  facilityId: "fac-def", careLevel: "skilled_nursing",
  requiredServices: ["Therapy"], depositAmountCents: 45000,
  currency: "usd", facilityTerms: "Payment due after both representatives sign.",
};
const documentText = renderContract(snapshot);
const documentHash = documentSha256(documentText);

function mockContract(signatures: { party: "hospital"|"facility" }[] = []) {
  return {
    id: "contract-1", referralId: "ref-abc", status: "sent",
    documentText, documentHash, signatures,
    referral: { id: "ref-abc", sendingOrgId: "hospital-org", facilityId: "fac-def",
      status: "accepted", facility: { organizationId: "facility-org", name: "Facility Two" },
      sendingOrganization: { name: "Hospital One" }, careLevel: "skilled_nursing",
      requiredServices: ["Therapy"] },
  };
}
describe("contract rendering and e-sign state machine", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    process.env.ESIGN_IP_HASH_SECRET = "test-only-secret-with-at-least-thirty-two-characters";
    orgMock.mockResolvedValue({ type: "hospital", organizationId: "hospital-org", userId: "clerk-1" });
    prismaMock.$transaction.mockImplementation(async (fn: (tx: typeof prismaMock)=>Promise<unknown>) => fn(prismaMock));
    prismaMock.$queryRawUnsafe.mockResolvedValue([{ id: "contract-1" }]);
    prismaMock.contract.findFirst.mockResolvedValue(mockContract());
    prismaMock.contract.findUnique.mockResolvedValue(mockContract());
    prismaMock.contractSignature.create.mockResolvedValue({});
    prismaMock.contract.update.mockResolvedValue({});
  });
  afterEach(() => { delete process.env.ESIGN_IP_HASH_SECRET; });

  it("SHA-256 matches the exact frozen document and excludes patient PHI", () => {
    expect(documentHash).toBe(createHash("sha256").update(documentText).digest("hex"));
    expect(documentHash).toHaveLength(64);
    expect(documentText).toContain("ref-abc");
    expect(documentText).not.toContain("patientName");
    expect(documentText).not.toContain("patientMrn");
  });
  it("rejects changed document bytes or an invalid signer full name", async () => {
    const provider = new StandardEsignProvider();
    const request = { typedName: "Alex Smith", party: "hospital" as const,
      signerUserId: "u", signerOrgId: "hospital-org", ipAddress: "127.0.0.1", consented: true,
      documentText, expectedDocumentHash: documentHash };
    await expect(provider.sign({ ...request, documentText: documentText + "changed" }))
      .rejects.toThrow("integrity");
    await expect(provider.sign({ ...request, typedName: "Alex" })).rejects.toThrow("full legal");
    const evidence = await provider.sign(request);
    expect(evidence.documentHash).toBe(documentHash);
    expect(evidence.ipHash).toMatch(/^[0-9a-f]{64}$/);
    expect(evidence.ipHash).not.toContain("127.0.0.1");
  });
  it("cannot sign twice for the same party", async () => {
    prismaMock.contract.findUnique.mockResolvedValue(mockContract([{party:"hospital"}]));
    await expect(signContract("contract-1", "Alex Smith", "127.0.0.1",true))
      .rejects.toMatchObject({ statusCode: 409 });
    expect(prismaMock.contractSignature.create).not.toHaveBeenCalled();
  });
  it("first signature leaves contract SENT, not SIGNED", async () => {
    const result = await signContract("contract-1", "Alex Smith", "127.0.0.1",true);
    expect(result.status).toBe("sent");
    expect(prismaMock.contract.update).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ status: "sent", hospitalSignedBy: "clerk-1" }),
    }));
  });
  it("the other party's signature completes the contract", async () => {
    orgMock.mockResolvedValue({ type: "facility", organizationId: "facility-org", userId: "facility-user" });
    prismaMock.contract.findUnique.mockResolvedValue(mockContract([{party:"hospital"}]));
    const result = await signContract("contract-1", "Taylor Jones", "192.0.2.1",true);
    expect(result.status).toBe("signed");
    expect(prismaMock.contract.update).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ status: "signed", facilitySignedBy: "facility-user" }),
    }));
    expect(prismaMock.contractSignature.create).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ party: "facility", documentHash }),
    }));
  });
  it("facility cannot send or change the contract terms", async () => {
    orgMock.mockResolvedValue({ type: "facility", organizationId: "facility-org", userId: "facility-user" });
    await expect(sendContract("contract-1", {depositAmountCents:1,facilityTerms:"Unauthorized update terms"}))
      .rejects.toMatchObject({statusCode:403});
    expect(prismaMock.contract.updateMany).not.toHaveBeenCalled();
  });
  it("cannot sign a draft or a fully signed contract", async () => {
    prismaMock.contract.findFirst.mockResolvedValue({...mockContract(),status:"draft"});
    await expect(signContract("contract-1","Alex Smith","127.0.0.1",true)).rejects.toMatchObject({statusCode:409});
    prismaMock.contract.findFirst.mockResolvedValue({...mockContract(),status:"signed"});
    await expect(signContract("contract-1","Alex Smith","127.0.0.1",true)).rejects.toMatchObject({statusCode:409});
  });
  it("blocks changed bytes after provider evidence is produced", async () => {
    prismaMock.contract.findUnique.mockResolvedValue({...mockContract(),documentText:documentText+" ALTERED"});
    await expect(signContract("contract-1","Alex Smith","127.0.0.1",true))
      .rejects.toMatchObject({statusCode:409});
    expect(prismaMock.contractSignature.create).not.toHaveBeenCalled();
  });
  it("refuses to serve a tampered contract document", async () => {
    prismaMock.contract.findFirst.mockResolvedValue({ ...mockContract(), documentText: documentText + " tampered" });
    await expect(getContract("contract-1")).rejects.toMatchObject({ statusCode: 409 });
  });
  it("rejects freeform terms that repeat patient identifiers", async () => {
    prismaMock.contract.findFirst.mockResolvedValue({
      ...mockContract(), status: "draft",
      referral: {...mockContract().referral, patientName: "Jane Testpatient", patientMrn: "MRN-100"},
    });
    await expect(sendContract("contract-1", {
      depositAmountCents: 5000, facilityTerms: "Terms regarding Jane Testpatient and care.",
    })).rejects.toMatchObject({ statusCode: 400 });
    expect(prismaMock.contract.updateMany).not.toHaveBeenCalled();
  });
  it("requires server-side electronic-signature consent", async () => {
    await expect(signContract("contract-1","Alex Smith","127.0.0.1",false))
      .rejects.toMatchObject({statusCode:400});
    expect(prismaMock.contractSignature.create).not.toHaveBeenCalled();
  });
  it("rejects signatures without an IP hashing secret", async () => {
    delete process.env.ESIGN_IP_HASH_SECRET;
    await expect(signContract("contract-1","Alex Smith","127.0.0.1",true))
      .rejects.toMatchObject({statusCode:409});
  });
});