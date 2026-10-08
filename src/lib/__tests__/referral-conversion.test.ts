import { beforeEach, describe, expect, it, vi } from "vitest";

const { db, org, assertCapacity, recalc, operationOrder } = vi.hoisted(() => {
 const operationOrder: string[] = [];
 const db = {
  $transaction: vi.fn(),
  $queryRawUnsafe: vi.fn(),
  referral: { findFirst: vi.fn(), update: vi.fn() },
  patient: { findFirst: vi.fn() },
  user: { findFirst: vi.fn() },
  placement: { findFirst: vi.fn(), create: vi.fn() },
  bedReservation: { deleteMany: vi.fn() },
 };
 const org = vi.fn(), assertCapacity = vi.fn(), recalc = vi.fn();
 return { db, org, assertCapacity, recalc, operationOrder };
});
vi.mock("server-only", () => ({}));
vi.mock("@/lib/prisma", () => ({ prisma: db }));
vi.mock("@/lib/referrals", () => ({
 referralContext: org,
 ReferralError: class ReferralError extends Error {
  constructor(public statusCode: number, message: string) { super(message); }
 },
}));
vi.mock("@/lib/data-access", () => ({
 assertFacilityCapacityAvailable: assertCapacity,
 recalculateFacilityOccupancy: recalc,
}));
import { convertPaidReferral } from "../referral-conversion";

const accepted = {
 id: "ref-1", status: "accepted", convertedPlacementId: null,
 sendingOrgId: "hospital-1", facilityId: "facility-1",
 patientMrn: "MRN-1", patientDateOfBirth: new Date("1960-01-02"),
 careLevel: "skilled_nursing", depositIssue: null,
 bedReservation: { id: "bed-1", referralId: "ref-1", paymentId: "pay-1", facilityId: "facility-1" },
 contract: { status: "signed", payments: [
  { id: "pay-1", referralId: "ref-1", status: "demo_paid" },
 ] },
};
const patient = {
 id: "patient-1", dateOfBirth: new Date("1960-01-02"),
 socialWorkerId: "social-1", careLevelRequired: "skilled_nursing",
};
describe("paid referral to placement: atomic reservation transfer", () => {
 beforeEach(() => {
  operationOrder.length = 0;
  vi.resetAllMocks();
  org.mockResolvedValue({ type: "facility", organizationId: "facility-org", userId: "staff" });
  db.$transaction.mockImplementation(async (fn: (tx: typeof db) => Promise<unknown>) => fn(db));
  db.$queryRawUnsafe.mockImplementation(async (statement: string) => {
   operationOrder.push(statement.includes('"Referral"') ? "lock-referral" : "lock-facility");
   return [{ id: "id" }];
  });
  db.referral.findFirst.mockResolvedValue(accepted);
  db.patient.findFirst.mockResolvedValue(patient);
  db.user.findFirst.mockResolvedValue({ id: "social-1" });
  db.placement.findFirst.mockResolvedValue(null);
  db.bedReservation.deleteMany.mockImplementation(async () => {
   operationOrder.push("release"); return { count: 1 };
  });
  assertCapacity.mockImplementation(async () => {
   operationOrder.push("assert-capacity");
  });
  recalc.mockImplementation(async () => {
   operationOrder.push("recalc");
  });
  db.placement.create.mockImplementation(async () => {
   operationOrder.push("create-placement"); return { id: "new-placement" };
  });
  db.referral.update.mockImplementation(async () => {
   operationOrder.push("convert-referral"); return {};
  });
 });
 it("transfers the paid reservation exactly once inside one DB transaction", async () => {
  const output = await convertPaidReferral("ref-1");
  expect(output).toMatchObject({ referralId: "ref-1", status: "converted", alreadyConverted: false });
  expect(output.placementId).toBeTruthy();
  expect(db.$transaction).toHaveBeenCalledTimes(1);
  expect(db.bedReservation.deleteMany).toHaveBeenCalledTimes(1);
  expect(db.placement.create).toHaveBeenCalledTimes(1);
  expect(db.referral.update).toHaveBeenCalledTimes(1);
  expect(operationOrder).toEqual([
   "lock-referral", "lock-facility", "release", "recalc",
   "assert-capacity", "create-placement", "convert-referral", "recalc",
  ]);
  expect(assertCapacity).toHaveBeenCalledWith(db, "facility-1", null, "approved");
  expect(db.placement.create).toHaveBeenCalledWith(expect.objectContaining({
   data: expect.objectContaining({
    patientId: "patient-1", facilityId: "facility-1",
    status: "approved", organizationId: "hospital-1",
   }),
  }));
 });
 it("retry uses the original placement without releasing the reservation twice", async () => {
  db.referral.findFirst.mockResolvedValue({ ...accepted, status: "converted",
   convertedPlacementId: "existing-placement", bedReservation: null });
  const output = await convertPaidReferral("ref-1");
  expect(output).toEqual({ referralId: "ref-1", placementId: "existing-placement",
   status: "converted", alreadyConverted: true });
  expect(db.bedReservation.deleteMany).not.toHaveBeenCalled();
  expect(db.placement.create).not.toHaveBeenCalled();
 });
 it("never fabricates missing hospital patient data", async () => {
  db.patient.findFirst.mockResolvedValue(null);
  await expect(convertPaidReferral("ref-1")).rejects.toMatchObject({statusCode:409});
  expect(db.bedReservation.deleteMany).not.toHaveBeenCalled();
  expect(db.placement.create).not.toHaveBeenCalled();
 });
 it("cannot convert until contract and deposit are confirmed", async () => {
  db.referral.findFirst.mockResolvedValue({ ...accepted,
   contract: { status: "sent", payments: [{id: "pay-1", status: "pending"}] } });
  await expect(convertPaidReferral("ref-1")).rejects.toMatchObject({statusCode:409});
  expect(db.bedReservation.deleteMany).not.toHaveBeenCalled();
 });
 it("hospital cannot perform facility conversion", async () => {
  org.mockResolvedValue({ type: "hospital", organizationId: "hospital-1", userId: "u" });
  await expect(convertPaidReferral("ref-1")).rejects.toMatchObject({statusCode:403});
  expect(db.$transaction).not.toHaveBeenCalled();
 });
 it("a failed release aborts before placement creation", async () => {
  db.bedReservation.deleteMany.mockResolvedValue({ count: 0 });
  await expect(convertPaidReferral("ref-1")).rejects.toMatchObject({statusCode:409});
  expect(db.placement.create).not.toHaveBeenCalled();
  expect(db.referral.update).not.toHaveBeenCalled();
 });
 it("rejects a second active placement for the patient/facility", async () => {
  db.placement.findFirst.mockResolvedValue({ id: "other-active-placement" });
  await expect(convertPaidReferral("ref-1")).rejects.toMatchObject({statusCode:409});
  expect(db.bedReservation.deleteMany).not.toHaveBeenCalled();
 });
 it("accepts a real paid status in addition to demo_paid", async () => {
  db.referral.findFirst.mockResolvedValue({ ...accepted,
   contract: { status: "signed", payments: [{ id: "pay-1", referralId: "ref-1", status: "paid" }] } });
  const output = await convertPaidReferral("ref-1");
  expect(output.status).toBe("converted");
 });
});