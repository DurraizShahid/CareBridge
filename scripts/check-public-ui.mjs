// Run with the local server: node scripts/check-public-ui.mjs http://localhost:3000
// Reuses the installed design skill's Chrome driver; adds no dependency.
import assert from "node:assert/strict";
import { homedir } from "node:os";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { mkdirSync } from "node:fs";

const { Browser, sleep } = await import(pathToFileURL(join(homedir(), ".claude/skills/design-taste-frontend/scripts/lib/cdp.mjs")));
const url = process.argv[2] || "http://localhost:3000";
const captures = ".tmp/public-ui-check";
mkdirSync(captures, { recursive: true });
const browser = await Browser.launch();
const page = await browser.newPage({ reducedMotion: true });
const requests = [];
let stage = "responsive captures";
browser.on(page.sessionId, "Runtime.exceptionThrown", event => console.error("Runtime exception during", stage, event.exceptionDetails?.exception?.description));

// Keep all onboarding verification isolated from real accounts and the database.
await page.send("Fetch.enable", { patterns: [{ urlPattern: "*/api/me" }, { urlPattern: "*/api/onboarding/create-org" }, { urlPattern: "*/api/invite-codes/validate*" }, { urlPattern: "*/api/join-requests" }] });
browser.on(page.sessionId, "Fetch.requestPaused", async ({ requestId, request }) => {
  requests.push({ url: request.url, body: request.postData });
  const body = request.url.endsWith("/api/me") ? {} : request.url.includes("invite-codes") ? { valid: true, organization: { id: "test-org" }, inviteCode: { id: "test-code" } } : request.url.endsWith("join-requests") ? { id: "test-request" } : { error: "Test response: choose another short name." };
  await page.send("Fetch.fulfillRequest", { requestId, responseCode: request.url.endsWith("create-org") ? 409 : 200, responseHeaders: [{ name: "content-type", value: "application/json" }], body: Buffer.from(JSON.stringify(body)).toString("base64") });
});

async function click(selector) {
  const box = await page.eval(s => { const el = document.querySelector(s); if (!el) return null; el.scrollIntoView({ block: "center" }); const r = el.getBoundingClientRect(); return { x: r.x + r.width / 2, y: r.y + r.height / 2 }; }, selector);
  assert.ok(box, `Missing control: ${selector}`);
  await page.send("Input.dispatchMouseEvent", { type: "mousePressed", ...box, button: "left", clickCount: 1 });
  await page.send("Input.dispatchMouseEvent", { type: "mouseReleased", ...box, button: "left", clickCount: 1 });
  await sleep(100);
}
async function fill(selector, value) {
  await click(selector);
  await page.send("Input.insertText", { text: value });
}
async function check(condition, message) { assert.ok(await page.eval(condition), message); }

try {
  for (const width of process.argv.includes("--flows-only") ? [] : [1440, 768, 390]) {
    await page.setViewport({ width, height: width === 1440 ? 900 : 844 });
    for (const route of ["/", "/lead", "/sign-in", "/sign-up", "/onboarding"]) {
      await page.goto(url + route, { settleMs: 2200 });
      await check(() => !!document.querySelector(".care-public"), `Public surface missing: ${route}`);
      await check(() => document.documentElement.scrollWidth <= innerWidth + 1, `Horizontal overflow: ${route} at ${width}`);
      await check(() => [...document.querySelectorAll("input, select, textarea")].every(el => el.type === "hidden" || el.labels?.length || el.getAttribute("aria-label")), `Unlabeled control: ${route}`);
      await check(() => [...document.querySelectorAll(".care-public img")].filter(el => el.getBoundingClientRect().top < innerHeight).every(el => el.complete && el.naturalWidth > 0), `Broken first-screen image: ${route}`);
      await check(() => !!document.querySelector("h1"), `Missing page heading: ${route}`);
      if (route === "/sign-up") await check(() => document.querySelector('button[type="submit"]').textContent === "Sign up with email", "Incorrect sign-up label");
      if (width !== 768) {
        await page.eval(async () => {
          for (let y = 0; y < document.documentElement.scrollHeight; y += innerHeight) {
            window.scrollTo({ top: y, behavior: "instant" });
            await new Promise(r => setTimeout(r, 120));
          }
          window.scrollTo({ top: 0, behavior: "instant" });
          await Promise.all([...document.images].map(i => i.decode().catch(() => {})));
        });
        await page.screenshot({ path: `${captures}/${route === "/" ? "landing" : route.slice(1)}-${width}.png`, format: "png", fullPage: true });
      }
    }
  }

  stage = "password toggle";
  await page.goto(url + "/sign-up");
  await click('[aria-label="Show password"]');
  await check(() => document.querySelector("#signup-password").type === "text", "Password visibility control failed");
  await click('[aria-label="Hide password"]');
  await check(() => document.querySelector("#signup-password").type === "password", "Password hide control failed");
  await check(() => !document.querySelector("form").checkValidity(), "Empty auth form should fail native validation");

  stage = "lead submission";
  await page.goto(url + "/lead");
  await fill("#name", "Design Review");
  await fill("#email", "review@example.com");
  await fill("#organization", "Sample Hospital");
  await click('button[type="submit"]');
  await sleep(900);
  await check(() => document.querySelector('[role="status"]').textContent.includes("haven’t been saved") || document.querySelector('[role="status"]').textContent.includes("haven't been saved"), "Demo lead confirmation must explain that data was not saved");
  await page.screenshot({ path: `${captures}/lead-success.png`, format: "png", fullPage: true });

  stage = "onboarding";
  await page.goto(url + "/onboarding");
  await click(".care-org-choice");
  await fill("#org-name", "Sample Care Hospital");
  await check(() => document.querySelector("#org-slug").value === "sample-care-hospital", "Organization slug generation failed");
  await page.screenshot({ path: `${captures}/onboarding-setup.png`, format: "png", fullPage: true });
  await click('button[type="submit"]');
  await sleep(700);
  await check(() => document.querySelector('[role="alert"]').textContent.includes("Test response") && document.querySelector("#org-name").value === "Sample Care Hospital", "Onboarding error must preserve entered data");
  await page.screenshot({ path: `${captures}/onboarding-error.png`, format: "png", fullPage: true });
  await click('[role="tab"][data-slot="tabs-trigger"]:last-child');
  await fill("#invite-code", "care&test");
  await click('button[type="submit"]');
  await sleep(700);
  assert.ok(requests.some(r => r.url.includes("code=CARE%26TEST")), "Invite code must be encoded at the request boundary");
  assert.ok(requests.some(r => r.url.endsWith("join-requests") && JSON.parse(r.body).organizationId === "test-org"), "Join request lost validated organization");
  await check(() => document.querySelector("h1").textContent === "Your request is on its way.", "Join success must show approval state");
  await page.screenshot({ path: `${captures}/onboarding-join-success.png`, format: "png", fullPage: true });

  stage = "3D tour";
  await page.goto(url + "/");
  await click(".care-tour-poster");
  for (let i = 0; i < 30 && !(await page.eval(() => !!document.querySelector("canvas"))); i++) await sleep(500);
  await check(() => !!document.querySelector("canvas"), "3D tour did not load");
  await check(() => !!document.querySelector('[aria-label="3D tour of a sample care home"]'), "3D tour accessibility label missing");
  await page.screenshot({ path: `${captures}/tour-390.png`, format: "png", fullPage: true });
  await click(".care-tour-top button");
  await check(() => !!document.querySelector(".care-tour-poster"), "Tour close control failed");

  stage = "theme and reduced motion";
  await page.send("Emulation.setEmulatedMedia", { features: [{ name: "prefers-reduced-motion", value: "reduce" }] });
  await page.goto(url + "/");
  await check(() => getComputedStyle(document.querySelector(".care-hero-photo-frame")).animationName === "none", "Reduced motion must stop the photo entrance");
  // Simulate a stored dark dashboard preference without accessing real sessions.
  await page.eval(() => document.documentElement.classList.add("dark"));
  await check(() => getComputedStyle(document.querySelector(".care-public")).backgroundColor === "rgb(250, 251, 248)", "Dashboard dark theme leaked into public pages");
  assert.deepEqual(page.consoleErrors, [], "Unexpected runtime exception");
  console.log("PASS: responsive pages, labels, images, sign-up copy, password toggle, lead form, onboarding error/join flow, 3D tour, reduced motion, and theme isolation.");
} catch (error) {
  await page.screenshot({ path: `${captures}/failure.png`, format: "png", fullPage: true });
  console.error(await page.eval(() => document.querySelector(".care-wizard")?.innerText), requests);
  throw error;
} finally { await browser.close(); }
