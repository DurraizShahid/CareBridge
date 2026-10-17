import { describe, expect, it } from "vitest";
import { parseJsonArray, parseJsonObject } from "@/lib/data-access";

describe("parseJsonArray", () => {
  it("returns native array as-is", () => {
    const contacts = [{ name: "Demo Contact", role: "Admissions" }];
    expect(parseJsonArray(contacts)).toEqual(contacts);
  });

  it("parses single JSON-stringified array (like fac-006 seed data)", () => {
    const stringified = JSON.stringify([{ name: "Demo Admissions Desk", role: "Admissions" }]);
    expect(parseJsonArray(stringified)).toEqual([
      { name: "Demo Admissions Desk", role: "Admissions" },
    ]);
  });

  it("parses double JSON-stringified array", () => {
    const doubleStringified = JSON.stringify(
      JSON.stringify([{ name: "Demo Admissions Desk", role: "Admissions" }]),
    );
    expect(parseJsonArray(doubleStringified)).toEqual([
      { name: "Demo Admissions Desk", role: "Admissions" },
    ]);
  });

  it("returns empty array for invalid input, objects, numbers, and null/undefined", () => {
    expect(parseJsonArray(null)).toEqual([]);
    expect(parseJsonArray(undefined)).toEqual([]);
    expect(parseJsonArray("")).toEqual([]);
    expect(parseJsonArray("invalid json")).toEqual([]);
    expect(parseJsonArray({ foo: "bar" })).toEqual([]);
    expect(parseJsonArray(123)).toEqual([]);
  });
});

describe("parseJsonObject", () => {
  it("returns native object as-is", () => {
    const address = { street: "116 Example Court", city: "Beaverton", state: "OR" };
    expect(parseJsonObject(address)).toEqual(address);
  });

  it("parses single JSON-stringified object (like fac-006 seed data)", () => {
    const stringified = JSON.stringify({ street: "116 Example Court", city: "Beaverton", state: "OR" });
    expect(parseJsonObject(stringified)).toEqual({
      street: "116 Example Court",
      city: "Beaverton",
      state: "OR",
    });
  });

  it("parses double JSON-stringified object", () => {
    const doubleStringified = JSON.stringify(
      JSON.stringify({ street: "116 Example Court", city: "Beaverton", state: "OR" }),
    );
    expect(parseJsonObject(doubleStringified)).toEqual({
      street: "116 Example Court",
      city: "Beaverton",
      state: "OR",
    });
  });

  it("returns empty object for arrays, invalid json, null/undefined", () => {
    expect(parseJsonObject(null)).toEqual({});
    expect(parseJsonObject(undefined)).toEqual({});
    expect(parseJsonObject("")).toEqual({});
    expect(parseJsonObject("invalid json")).toEqual({});
    expect(parseJsonObject(["not", "an", "object"])).toEqual({});
  });
});
