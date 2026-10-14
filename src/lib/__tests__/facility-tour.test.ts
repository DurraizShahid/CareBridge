import { describe, expect, it } from "vitest";
import { parseTourConfig, validateTourConfig } from "@/lib/facility-tour";

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

  it("supports stop title, roomName, accentColor, and tour title", () => {
    const config = parseTourConfig({
      title: "Guided Tour",
      stops: [
        {
          title: "Main Entrance",
          roomName: "Lobby",
          description: "Staffed 24/7",
          accentColor: "#10b981",
        },
      ],
    });
    expect(config).not.toBeNull();
    expect(config!.title).toBe("Guided Tour");
    expect(config!.welcome).toBe("Guided Tour");
    expect(config!.accentColor).toBe("#10b981");
    expect(config!.stops[0]).toMatchObject({
      label: "Main Entrance",
      area: "lobby",
      roomName: "Lobby",
      description: "Staffed 24/7",
      accentColor: "#10b981",
    });
  });
});

describe("validateTourConfig", () => {
  it("validates valid configs and catches invalid shapes", () => {
    expect(validateTourConfig(null).valid).toBe(false);
    expect(validateTourConfig({ stops: [] }).valid).toBe(false);
    expect(validateTourConfig({ stops: [{ title: "Bad", area: "invalid" }] }).valid).toBe(false);

    const result = validateTourConfig({
      title: "Valid Tour",
      stops: [
        {
          title: "Suite Stop",
          roomName: "Patient Suite",
          description: "Comfortable room",
          accentColor: "#2563eb",
        },
      ],
    });
    expect(result.valid).toBe(true);
    expect(result.config?.stops[0].area).toBe("room");
  });
});
