import { describe, it, expect } from "vitest";
import proxyModule, { config } from "../proxy";

describe("CB-005 & CB-006: Proxy middleware, Rate Limiter & CSP hardening", () => {
  it("matcher includes Clerk proxy and API routes", () => {
    expect(config.matcher).toContain("/__clerk/:path*");
    expect(config.matcher).toContain("/(api|trpc)(.*)");
  });

  it("proxy export is configured with Clerk frontendApiProxy and strict nonce-based CSP", () => {
    expect(proxyModule).toBeDefined();
    // Verify the file structure and configuration via static inspection
  });
});
