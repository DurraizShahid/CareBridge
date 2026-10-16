import { beforeEach, describe, expect, it, vi } from "vitest";

const { db } = vi.hoisted(() => {
 const db = {
  $transaction: vi.fn(),
  $queryRaw: vi.fn(),
  patient: { findFirst: vi.fn(), findUnique: vi.fn(), update: vi.fn() },
  placement: { findFirst: vi.fn(), update: vi.fn(), count: vi.fn() },
  facility: { findUnique: vi.fn(), update: vi.fn(), findMany: vi.fn() },
  bedReservation: { count: vi.fn() },
  activityEvent: { create: vi.fn() },
 };
 return { db };
});
vi.mock("server-only", () => ({}));
vi.mock("@/lib/prisma", () => ({ prisma: db }));
import { dischargePatient, recommendFacilities } from "../data-access";

describe("dischargePatient", () => {
 beforeEach(() => {
  vi.resetAllMocks();
  db.$transaction.mockImplementation(async (fn: (tx: typeof db) => Promise<unknown>) => fn(db));
  db.patient.findFirst.mockResolvedValue({ id: "p1", firstName: "Ada", lastName: "Lane", status: "placed", organizationId: "h1" });
  db.patient.findUnique.mockResolvedValue({ status: "placed" });
  db.placement.findFirst.mockResolvedValue({ id: "pl1", facilityId: "f1", status: "approved", completedDate: null });
  db.facility.findUnique.mockResolvedValue({ capacity: 10, name: "Oak House" });
  db.placement.count.mockResolvedValue(3);
  db.bedReservation.count.mockResolvedValue(1);
 });

 it("closes the placement, discharges, frees the bed and audits in one transaction", async () => {
  const result = await dischargePatient("p1", "h1", "social-worker", "u1");
  expect(result).toEqual({ patientId: "p1", placementId: "pl1", facilityId: "f1" });
  expect(db.$transaction).toHaveBeenCalledTimes(1);
  expect(db.patient.findFirst).toHaveBeenCalledWith(expect.objectContaining({ where: { id: "p1", organizationId: "h1" } }));
  expect(db.placement.update).toHaveBeenCalledWith({ where: { id: "pl1" }, data: expect.objectContaining({ status: "completed" }) });
  expect(db.patient.update).toHaveBeenCalledWith({ where: { id: "p1" }, data: { status: "discharged" } });
  expect(db.facility.update).toHaveBeenCalledWith({ where: { id: "f1" }, data: { currentOccupancy: 4, hasAvailability: true } });
  expect(db.activityEvent.create).toHaveBeenCalledWith({ data: expect.objectContaining({ type: "discharge", patientId: "p1", userId: "u1", organizationId: "h1" }) });
 });

 it("rejects patients outside the org, already discharged, or without a placement", async () => {
  db.patient.findFirst.mockResolvedValueOnce(null);
  await expect(dischargePatient("p1", "h1", "social-worker", "u1")).rejects.toMatchObject({ status: 404 });

  db.patient.findUnique.mockResolvedValueOnce({ status: "discharged" });
  await expect(dischargePatient("p1", "h1", "social-worker", "u1")).rejects.toMatchObject({ status: 409 });

  db.placement.findFirst.mockResolvedValueOnce(null);
  await expect(dischargePatient("p1", "h1", "social-worker", "u1")).rejects.toMatchObject({ status: 409 });
  expect(db.patient.update).not.toHaveBeenCalled();
  expect(db.activityEvent.create).not.toHaveBeenCalled();
 });
});

describe("recommendFacilities", () => {
 const base = {
  description: null, phone: "", email: "", website: null, contacts: [], licensure: "", accreditations: [],
  insuranceAccepted: [], specialties: [], reviewsCount: 0, hasAvailability: true, waitlistDays: null,
  organizationId: "fo", media: [], tourConfig: null, createdAt: new Date(), updatedAt: new Date(),
  type: "skilled_nursing_facility", careLevelsOffered: ["skilled_nursing"], acceptsMedicaid: false,
 };
 it("ranks by matching score and drops facilities that cannot take the patient", async () => {
  db.facility.findMany.mockResolvedValue([
   { ...base, id: "a", name: "A", capacity: 10, currentOccupancy: 9, rating: 4, acceptsMedicare: true, address: { city: "Austin", state: "TX" } },
   { ...base, id: "b", name: "B", capacity: 40, currentOccupancy: 10, rating: 4.5, acceptsMedicare: true, address: { city: "Dallas", state: "TX" } },
   { ...base, id: "c", name: "C", capacity: 40, currentOccupancy: 0, rating: 5, acceptsMedicare: false, address: { city: "Austin", state: "TX" } },
  ]);
  const ranked = await recommendFacilities({ careLevel: "skilled-nursing", insurance: "Medicare", city: "Austin" });
  expect(ranked.map((f) => f.id)).toEqual(["b", "a"]);
 });
});
