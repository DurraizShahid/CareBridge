import { describe, expect, it } from "vitest";
import { parseTourConfig } from "@/lib/facility-tour";

describe("parseTourConfig", () => {
  it("returns null for missing or stop-less configs", () => {
    expect(parseTourConfig(null)).toBeNull();
    expect(parseTourConfig([])).toBeNull();
    expect(parseTourConfig({ stops: [] })).toBeNull();
    expect(parseTourConfig({ stops: [{ id: "a", label: "A", area: "attic" }] })).toBeNull();
  });

  it("keeps valid stops, drops duplicates, and defaults unsafe colors", () => {
    const config = parseTourConfig({
      accentColor: "red; background:url(x)",
      floorColor: "#AABBCC",
      stops: [
        { id: "lobby", label: " Lobby ", area: "lobby", highlights: ["Valet", 3, ""] },
        { id: "lobby", label: "Dupe", area: "lobby" },
        { id: "room", label: "Room", area: "room", description: "Quiet" },
      ],
    });
    expect(config).not.toBeNull();
    expect(config!.accentColor).toBe("#2f80c8");
    expect(config!.floorColor).toBe("#AABBCC");
    expect(config!.stops.map((s) => s.id)).toEqual(["lobby", "room"]);
    expect(config!.stops[0]).toMatchObject({ label: "Lobby", highlights: ["Valet"], description: "" });
  });
});
