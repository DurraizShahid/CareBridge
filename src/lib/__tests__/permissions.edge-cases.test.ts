import { describe, it, expect } from "vitest";
import {
  normalizeRole,
  getFallbackRole,
  resolveRole,
  roleHasPermission,
  canRoleAccessRoute,
  getRolePermissions,
  getAllRoles,
} from "../permissions";

describe("normalizeRole", () => {
  it("handles null/undefined", () => {
    expect(normalizeRole(null)).toBeNull();
    expect(normalizeRole(undefined)).toBeNull();
  });

  it("handles non-string types", () => {
    expect(normalizeRole(123)).toBeNull();
    expect(normalizeRole([])).toBeNull();
    expect(normalizeRole({})).toBeNull();
    expect(normalizeRole(true)).toBeNull();
  });

  it("handles empty/whitespace strings", () => {
    expect(normalizeRole("")).toBeNull();
    expect(normalizeRole("   ")).toBeNull();
  });

  it("handles case-insensitive matching", () => {
    expect(normalizeRole("SUPERADMIN")).toBe("superadmin");
    expect(normalizeRole("SuperAdmin")).toBe("superadmin");
    expect(normalizeRole("Social_Worker")).toBe("social-worker");
  });

  it("returns null for unknown roles", () => {
    expect(normalizeRole("king")).toBeNull();
    expect(normalizeRole("unknown_role")).toBeNull();
  });

  it("handles roles with leading/trailing spaces", () => {
    expect(normalizeRole("  superadmin  ")).toBe("superadmin");
  });
});

describe("getFallbackRole", () => {
  it("never returns superadmin", () => {
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = "development";
    expect(getFallbackRole()).not.toBe("superadmin");
    process.env.NODE_ENV = "production";
    expect(getFallbackRole()).not.toBe("superadmin");
    process.env.NODE_ENV = "test";
    expect(getFallbackRole()).not.toBe("superadmin");
    process.env.NODE_ENV = originalEnv;
  });

  it("always returns customer", () => {
    expect(getFallbackRole()).toBe("customer");
  });
});

describe("resolveRole", () => {
  it("resolves first valid role from candidates", () => {
    expect(resolveRole(null, undefined, "superadmin")).toBe("superadmin");
  });

  it("falls back to customer when no candidates match", () => {
    expect(resolveRole()).toBe("customer");
    expect(resolveRole(null, undefined)).toBe("customer");
    expect(resolveRole("unknown")).toBe("customer");
  });

  it("handles mixed valid/invalid candidates", () => {
    expect(resolveRole(null, "social_worker", "unknown")).toBe("social-worker");
  });
});

describe("roleHasPermission", () => {
  it("handles unknown permission string safely", () => {
    expect(roleHasPermission("superadmin", "nonexistent:permission" as any)).toBe(false);
  });

  it("superadmin has patient permissions", () => {
    expect(roleHasPermission("superadmin", "patients:read")).toBe(true);
    expect(roleHasPermission("superadmin", "patients:delete")).toBe(true);
  });

  it("social-worker has patient permissions but not delete", () => {
    expect(roleHasPermission("social-worker", "patients:read")).toBe(true);
    expect(roleHasPermission("social-worker", "patients:create")).toBe(true);
    expect(roleHasPermission("social-worker", "patients:delete")).toBe(false);
  });
});

describe("canRoleAccessRoute", () => {
  it("handles unknown routes permissively", () => {
    const result = canRoleAccessRoute("social-worker", "/unknown/route");
    expect(result.allowed).toBe(true);
  });

  it("denies access to restricted routes for low-privilege roles", () => {
    const result = canRoleAccessRoute("customer", "/dashboard/admin");
    expect(result.allowed).toBe(false);
  });

  it("superadmin can access all registered routes", () => {
    expect(canRoleAccessRoute("superadmin", "/dashboard/admin").allowed).toBe(true);
    expect(canRoleAccessRoute("superadmin", "/dashboard/users").allowed).toBe(true);
    expect(canRoleAccessRoute("superadmin", "/dashboard/hospitals").allowed).toBe(true);
  });
});

describe("getRolePermissions integrity", () => {
  it("all roles return a permission array", () => {
    for (const role of getAllRoles()) {
      const perms = getRolePermissions(role);
      expect(Array.isArray(perms)).toBe(true);
    }
  });

  it("no permission string has leading/trailing spaces", () => {
    for (const role of getAllRoles()) {
      for (const perm of getRolePermissions(role)) {
        expect(perm.trim()).toBe(perm);
      }
    }
  });
});
