import { describe, it, expect, beforeEach } from "vitest";
import {
  getCachedData,
  setCachedData,
  clearDataCache,
} from "../data-access";

describe("dataCache", () => {
  beforeEach(() => {
    clearDataCache();
  });

  it("returns null for missing keys", () => {
    expect(getCachedData("nonexistent")).toBeNull();
  });

  it("stores and retrieves values", () => {
    setCachedData("test-key", { hello: "world" });
    const result = getCachedData<{ hello: string }>("test-key");
    expect(result).toEqual({ hello: "world" });
  });

  it("handles falsy values (0, false, empty string)", () => {
    setCachedData("zero", 0);
    setCachedData("false", false);
    setCachedData("empty", "");
    expect(getCachedData<number>("zero")).toBe(0);
    expect(getCachedData<boolean>("false")).toBe(false);
    expect(getCachedData<string>("empty")).toBe("");
  });

  it("handles null and undefined values", () => {
    setCachedData("null", null);
    setCachedData("undefined", undefined);
    expect(getCachedData<null>("null")).toBeNull();
    expect(getCachedData<undefined>("undefined")).toBeUndefined();
  });

  it("returns null for expired entries", () => {
    setCachedData("expired", "value");
    const result = getCachedData("expired", -1);
    expect(result).toBeNull();
  });

  it("handles array values", () => {
    const arr = [1, 2, 3, 4, 5];
    setCachedData("arr", arr);
    expect(getCachedData<number[]>("arr")).toEqual(arr);
  });

  it("handles nested objects", () => {
    const obj = { a: { b: { c: "deep" } } };
    setCachedData("nested", obj);
    expect(getCachedData<typeof obj>("nested")).toEqual(obj);
  });
});
