import { describe, it, expect } from "vitest";
import {
  roleHasPermission,
  getRolePermissions,
  getAllRoles,
} from "../permissions";
import { DataAccessError } from "../data-access";

describe("roleHasPermission — document permissions", () => {
  it("allows superadmin all document actions", () => {
    expect(roleHasPermission("superadmin", "documents:read")).toBe(true);
    expect(roleHasPermission("superadmin", "documents:create")).toBe(true);
    expect(roleHasPermission("superadmin", "documents:update")).toBe(true);
    expect(roleHasPermission("superadmin", "documents:delete")).toBe(true);
    expect(roleHasPermission("superadmin", "documents:audit")).toBe(true);
  });

  it("allows administrator all document actions", () => {
    expect(roleHasPermission("administrator", "documents:read")).toBe(true);
    expect(roleHasPermission("administrator", "documents:create")).toBe(true);
    expect(roleHasPermission("administrator", "documents:update")).toBe(true);
    expect(roleHasPermission("administrator", "documents:delete")).toBe(true);
    expect(roleHasPermission("administrator", "documents:audit")).toBe(true);
  });

  it("allows social-worker read and create only", () => {
    expect(roleHasPermission("social-worker", "documents:read")).toBe(true);
    expect(roleHasPermission("social-worker", "documents:create")).toBe(true);
    expect(roleHasPermission("social-worker", "documents:update")).toBe(false);
    expect(roleHasPermission("social-worker", "documents:delete")).toBe(false);
    expect(roleHasPermission("social-worker", "documents:audit")).toBe(false);
  });

  it("allows discharge-planner read and create only", () => {
    expect(roleHasPermission("discharge-planner", "documents:read")).toBe(true);
    expect(roleHasPermission("discharge-planner", "documents:create")).toBe(true);
    expect(roleHasPermission("discharge-planner", "documents:update")).toBe(false);
    expect(roleHasPermission("discharge-planner", "documents:delete")).toBe(false);
    expect(roleHasPermission("discharge-planner", "documents:audit")).toBe(false);
  });

  it("allows facility-coordinator read, create, update but not delete or audit", () => {
    expect(roleHasPermission("facility-coordinator", "documents:read")).toBe(true);
    expect(roleHasPermission("facility-coordinator", "documents:create")).toBe(true);
    expect(roleHasPermission("facility-coordinator", "documents:update")).toBe(true);
    expect(roleHasPermission("facility-coordinator", "documents:delete")).toBe(false);
    expect(roleHasPermission("facility-coordinator", "documents:audit")).toBe(false);
  });

  it("customer has no document permissions", () => {
    expect(roleHasPermission("customer", "documents:read")).toBe(false);
    expect(roleHasPermission("customer", "documents:create")).toBe(false);
    expect(roleHasPermission("customer", "documents:update")).toBe(false);
    expect(roleHasPermission("customer", "documents:delete")).toBe(false);
    expect(roleHasPermission("customer", "documents:audit")).toBe(false);
  });

  it("only superadmin and administrator have documents:delete", () => {
    const rolesWithDelete = getAllRoles().filter((r) =>
      roleHasPermission(r, "documents:delete"),
    );
    expect(rolesWithDelete).toEqual(["superadmin", "administrator"]);
  });

  it("handles unknown document permission safely", () => {
    expect(roleHasPermission("superadmin", "documents:purge" as any)).toBe(false);
    expect(roleHasPermission("customer", "documents:purge" as any)).toBe(false);
  });
});

describe("roleHasPermission — wildcard matching", () => {
  it("wildcard documents:* matches all document actions for superadmin", () => {
    const perms = getRolePermissions("superadmin");
    expect(perms).toContain("documents:read");
    expect(perms).toContain("documents:delete");
  });

  it("no role has an explicit documents:* wildcard entry", () => {
    for (const role of getAllRoles()) {
      const perms = getRolePermissions(role);
      expect(perms.includes("documents:*" as any)).toBe(false);
    }
  });

  it("wildcard check does not grant permissions for non-owned resources", () => {
    expect(roleHasPermission("customer", "documents:audit")).toBe(false);
    expect(roleHasPermission("customer", "documents:delete")).toBe(false);
  });
});

describe("DataAccessError", () => {
  it("creates error with correct status and message", () => {
    const err = new DataAccessError(404, "Document not found");
    expect(err).toBeInstanceOf(Error);
    expect(err).toBeInstanceOf(DataAccessError);
    expect(err.status).toBe(404);
    expect(err.message).toBe("Document not found");
    expect(err.name).toBe("DataAccessError");
  });

  it("creates error with 409 status for conflict", () => {
    const err = new DataAccessError(409, "Document is on legal hold");
    expect(err.status).toBe(409);
  });

  it("creates error with 403 status for forbidden", () => {
    const err = new DataAccessError(403, "Access denied");
    expect(err.status).toBe(403);
  });

  it("instanceof check works across different error instances", () => {
    const err1 = new DataAccessError(400, "Bad request");
    const err2 = new DataAccessError(500, "Server error");
    expect(err1 instanceof DataAccessError).toBe(true);
    expect(err2 instanceof DataAccessError).toBe(true);
    expect(err1 instanceof Error).toBe(true);
  });
});

describe("permission integrity — document permissions", () => {
  it("customer has no document permissions in its role definition", () => {
    const perms = getRolePermissions("customer");
    const docPerms = perms.filter((p) => p.startsWith("documents:"));
    expect(docPerms).toEqual([]);
  });
});
