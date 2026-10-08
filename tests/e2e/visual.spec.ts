import { expect, test } from "@playwright/test";
// Visual regression on the product surfaces with the canvas swapped for the poster (WebGL output is not bit-stable across GPUs).
for (const chapter of ["bedrock", "fault", "rock", "sediment", "soil", "street"]) {
  test(`visual: ${chapter}`, async ({ page }) => {
    await page.goto(`/?gfx=off&skip=1&chapter=${chapter}&t=8`); await page.addStyleTag({ content: "*{animation:none!important;transition:none!important}" });
    await expect(page.getByTestId("hud")).toBeVisible(); await page.waitForTimeout(300);
    await expect(page).toHaveScreenshot(`${chapter}.png`, { maxDiffPixelRatio: 0.05 });
  });
}
