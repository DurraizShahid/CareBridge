import { describe, it, expect, vi, beforeEach } from "vitest";

const { useRouterMock } = vi.hoisted(() => ({
  useRouterMock: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: useRouterMock,
}));

vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

vi.mock("react", async () => {
  const actual = await vi.importActual<any>("react");
  return {
    ...actual,
    useState: (initial: any) => [initial, vi.fn()],
  };
});

import { DischargeButton } from "../discharge-button";

describe("DischargeButton", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useRouterMock.mockReturnValue({
      refresh: vi.fn(),
      push: vi.fn(),
    });
  });

  it("renders the Discharge Patient dialog component with button trigger and confirmation content", () => {
    const result = DischargeButton({
      patientId: "patient-123",
      patientName: "John Doe",
    });
    expect(result).toBeDefined();

    const children = (result as any).props.children;
    expect(children).toBeDefined();
    expect(Array.isArray(children)).toBe(true);
    expect(children).toHaveLength(2);

    const [trigger, content] = children;
    expect(trigger.props.render).toBeDefined();
    expect(content.props.children).toBeDefined();
  });
});
