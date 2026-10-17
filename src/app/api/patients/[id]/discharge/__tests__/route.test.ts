import { describe, it, expect, vi, beforeEach } from "vitest";

const { requireOrgPermissionMock, dischargePatientMock } = vi.hoisted(() => ({
  requireOrgPermissionMock: vi.fn(),
  dischargePatientMock: vi.fn(),
}));

vi.mock("@/lib/server-auth", async () => {
  const actual = await vi.importActual<any>("@/lib/server-auth");
  return {
    ...actual,
    requireOrgPermission: requireOrgPermissionMock,
  };
});

vi.mock("@/lib/data-access", async () => {
  const actual = await vi.importActual<any>("@/lib/data-access");
  return {
    ...actual,
    dischargePatient: dischargePatientMock,
  };
});

import { POST } from "../route";
import { HttpAuthError } from "@/lib/server-auth";
import { DataAccessError } from "@/lib/data-access";

describe("POST /api/patients/[id]/discharge", () => {
  const params = Promise.resolve({ id: "patient-123" });

  beforeEach(() => {
    vi.clearAllMocks();
    requireOrgPermissionMock.mockResolvedValue({
      userId: "user-1",
      org: { organizationId: "org-1", role: "social-worker" },
    });
  });

  it("successfully discharges patient and returns status: discharged", async () => {
    dischargePatientMock.mockResolvedValue({
      patientId: "patient-123",
      placementId: "placement-456",
      facilityId: "facility-789",
    });

    const res = await POST(
      new Request("http://localhost/api/patients/patient-123/discharge", {
        method: "POST",
      }),
      { params },
    );
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data).toEqual({
      patientId: "patient-123",
      placementId: "placement-456",
      facilityId: "facility-789",
      status: "discharged",
    });
    expect(dischargePatientMock).toHaveBeenCalledWith(
      "patient-123",
      "org-1",
      "social-worker",
      "user-1",
    );
  });

  it("returns 403 on permission error", async () => {
    requireOrgPermissionMock.mockRejectedValue(new HttpAuthError(403, "Forbidden"));
    const res = await POST(
      new Request("http://localhost/api/patients/patient-123/discharge", {
        method: "POST",
      }),
      { params },
    );
    expect(res.status).toBe(403);
    const data = await res.json();
    expect(data.error).toBe("Forbidden");
  });

  it("returns 409 when patient has no confirmed placement", async () => {
    dischargePatientMock.mockRejectedValue(
      new DataAccessError(409, "Patient has no confirmed placement to discharge into"),
    );
    const res = await POST(
      new Request("http://localhost/api/patients/patient-123/discharge", {
        method: "POST",
      }),
      { params },
    );
    expect(res.status).toBe(409);
    const data = await res.json();
    expect(data.error).toBe("Patient has no confirmed placement to discharge into");
  });
});
