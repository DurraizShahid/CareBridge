import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { PlacementsByMonthCard } from "../_sections/placements-by-month-card";

describe("PlacementsByMonthCard", () => {
  it("explains missing data instead of rendering a blank chart", () => {
    const html = renderToStaticMarkup(createElement(PlacementsByMonthCard));
    expect(html).toContain("No placement data yet");
    expect(html).not.toContain("recharts-responsive-container");
  });

  it("keeps zero-volume months in the chart", () => {
    const html = renderToStaticMarkup(createElement(PlacementsByMonthCard, {
      data: [{ month: "Jan", created: 0, completed: 0 }],
    }));
    expect(html).not.toContain("No placement data yet");
    expect(html).toContain("recharts-responsive-container");
  });
});
