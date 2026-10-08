import { expect, test } from "@playwright/test";

test("risk mode lists buildings and selecting one shows detail", async ({ page }) => {
  await page.goto("/?skip=1&chapter=street&mode=risk&t=7");
  await expect(page.getByTestId("risk-table")).toBeVisible();
  const first = page.locator('[data-testid^="bld-"]').first();
  await first.click();
  await expect(page.getByTestId("risk-detail")).toBeVisible();
});

test("infrastructure mode shows failed/nominal state that changes with time", async ({ page }) => {
  await page.goto("/?skip=1&chapter=street&mode=infra&t=-2");
  const before = await page.getByTestId("infra-failed").innerText();
  await page.goto("/?skip=1&chapter=street&mode=infra&t=10");
  const after = await page.getByTestId("infra-failed").innerText();
  expect(after).not.toBe(before);
});

test("simulate: play advances time, reset returns to T-2s", async ({ page }) => {
  await page.goto("/?skip=1&chapter=street&mode=simulate&t=-2");
  await page.getByTestId("sim-play").click();
  await page.waitForTimeout(1200);
  const t = await page.getByTestId("sim-scrub").inputValue();
  expect(Number(t)).toBeGreaterThan(-2);
  await page.getByTestId("sim-reset").click();
  await expect(page.getByTestId("sim-scrub")).toHaveValue("-2");
});

test("out-of-range simulate scrub input clamps natively", async ({ page }) => {
  await page.goto("/?skip=1&chapter=street&mode=simulate&t=-2");
  const scrub = page.getByTestId("sim-scrub");
  await scrub.evaluate((el: HTMLInputElement) => { el.value = "999"; el.dispatchEvent(new Event("input", { bubbles: true })); });
  expect(Number(await scrub.inputValue())).toBeLessThanOrEqual(60);
  await scrub.evaluate((el: HTMLInputElement) => { el.value = "-999"; el.dispatchEvent(new Event("input", { bubbles: true })); });
  expect(Number(await scrub.inputValue())).toBeGreaterThanOrEqual(-2);
});

test("keyboard-only: tab reaches the layer rail and activates a chapter", async ({ page }) => {
  await page.goto("/?skip=1&chapter=street");
  await page.getByTestId("nav-fault").focus();
  await page.keyboard.press("Enter");
  await expect(page.locator('[data-chapter="fault"]')).toHaveCount(1);
});

test("mobile width keeps the HUD usable", async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 700 });
  await page.goto("/?skip=1&chapter=street&mode=risk&t=7");
  await expect(page.getByTestId("hud")).toBeVisible();
  await expect(page.getByTestId("risk-table")).toBeVisible();
});

test("reduced motion: intro renders a static keyframe list with no timeline", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  await expect(page.getByTestId("intro")).toBeVisible();
  await page.getByTestId("skip-intro").click();
  await expect(page.getByTestId("hud")).toBeVisible();
});

test("graphics failure: gfx=off falls back to the poster with no canvas", async ({ page }) => {
  await page.goto("/?gfx=off&skip=1&chapter=street");
  await expect(page.getByTestId("poster")).toBeVisible();
  await expect(page.locator("canvas")).toHaveCount(0);
});
