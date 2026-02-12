import { test, expect } from "./fixtures";

test.describe("Overlay Primitives (Dialog, DropdownMenu, Tabs)", () => {
  test.describe("ShadcnIslandDemo - Tabs Component", () => {
    test("should render tabs with correct initial state", async ({ page }) => {
      await page.goto("/");

      const tabsDemo = page.getByTestId("tabs-demo");
      await expect(tabsDemo).toBeVisible();

      // Verify all tab triggers are visible
      await expect(
        page.getByTestId("tab-trigger-overview")
      ).toBeVisible();
      await expect(
        page.getByTestId("tab-trigger-components")
      ).toBeVisible();
      await expect(
        page.getByTestId("tab-trigger-interactions")
      ).toBeVisible();

      // Verify initial tab content is visible
      await expect(
        page.getByTestId("tab-content-overview")
      ).toBeVisible();
    });

    test("should switch tabs when clicked", async ({ page }) => {
      await page.goto("/");

      // Click on Components tab
      await page.getByTestId("tab-trigger-components").click();
      await expect(
        page.getByTestId("tab-content-components")
      ).toBeVisible();
      await expect(
        page.getByTestId("tab-content-overview")
      ).not.toBeVisible();

      // Verify badges are visible in components tab
      await expect(page.getByTestId("badge-default")).toBeVisible();
      await expect(page.getByTestId("badge-secondary")).toBeVisible();

      // Click on Interactions tab
      await page.getByTestId("tab-trigger-interactions").click();
      await expect(
        page.getByTestId("tab-content-interactions")
      ).toBeVisible();
      await expect(
        page.getByTestId("tab-content-components")
      ).not.toBeVisible();
    });

    test("should support keyboard navigation for tabs", async ({ page }) => {
      await page.goto("/");

      // Focus on first tab
      await page.getByTestId("tab-trigger-overview").focus();

      // Press right arrow to move to next tab
      await page.keyboard.press("ArrowRight");
      await expect(page.getByTestId("tab-trigger-components")).toBeFocused();

      // Press right arrow again
      await page.keyboard.press("ArrowRight");
      await expect(
        page.getByTestId("tab-trigger-interactions")
      ).toBeFocused();

      // Press left arrow to go back
      await page.keyboard.press("ArrowLeft");
      await expect(page.getByTestId("tab-trigger-components")).toBeFocused();
    });
  });

  test.describe("ShadcnIslandDemo - Dialog Component", () => {
    test("should open dialog when trigger is clicked", async ({ page }) => {
      await page.goto("/");

      // Switch to Interactions tab first
      await page.getByTestId("tab-trigger-interactions").click();

      // Click dialog trigger
      await page.getByTestId("dialog-trigger").click();

      // Verify dialog is open and visible
      const dialogContent = page.getByTestId("dialog-content");
      await expect(dialogContent).toBeVisible();

      // Verify dialog content
      await expect(page.getByTestId("dialog-title")).toHaveText(
        "Example Dialog"
      );
      await expect(page.getByTestId("dialog-description")).toContainText(
        "This is a modal dialog"
      );

      // Verify dialog buttons are visible
      await expect(page.getByTestId("dialog-cancel")).toBeVisible();
      await expect(page.getByTestId("dialog-confirm")).toBeVisible();
    });

    test("should close dialog when cancel button is clicked", async ({
      page,
    }) => {
      await page.goto("/");

      // Switch to Interactions tab and open dialog
      await page.getByTestId("tab-trigger-interactions").click();
      await page.getByTestId("dialog-trigger").click();

      // Verify dialog is open
      await expect(page.getByTestId("dialog-content")).toBeVisible();

      // Click cancel button
      await page.getByTestId("dialog-cancel").click();

      // Verify dialog is closed
      await expect(page.getByTestId("dialog-content")).not.toBeVisible();
    });

    test("should close dialog when confirm button is clicked", async ({
      page,
    }) => {
      await page.goto("/");

      // Switch to Interactions tab and open dialog
      await page.getByTestId("tab-trigger-interactions").click();
      await page.getByTestId("dialog-trigger").click();

      // Verify dialog is open
      await expect(page.getByTestId("dialog-content")).toBeVisible();

      // Click confirm button
      await page.getByTestId("dialog-confirm").click();

      // Verify dialog is closed
      await expect(page.getByTestId("dialog-content")).not.toBeVisible();
    });

    test("should close dialog when Escape key is pressed", async ({ page }) => {
      await page.goto("/");

      // Switch to Interactions tab and open dialog
      await page.getByTestId("tab-trigger-interactions").click();
      await page.getByTestId("dialog-trigger").click();

      // Verify dialog is open
      await expect(page.getByTestId("dialog-content")).toBeVisible();

      // Press Escape key
      await page.keyboard.press("Escape");

      // Verify dialog is closed
      await expect(page.getByTestId("dialog-content")).not.toBeVisible();
    });
  });

  test.describe("ShadcnIslandDemo - DropdownMenu Component", () => {
    test("should open dropdown menu when trigger is clicked", async ({
      page,
    }) => {
      await page.goto("/");

      // Switch to Interactions tab first
      await page.getByTestId("tab-trigger-interactions").click();

      // Click dropdown trigger
      await page.getByTestId("dropdown-trigger").click();

      // Verify dropdown is open and visible
      const dropdownContent = page.getByTestId("dropdown-content");
      await expect(dropdownContent).toBeVisible();

      // Verify menu items are visible
      await expect(page.getByTestId("dropdown-item-view")).toBeVisible();
      await expect(page.getByTestId("dropdown-item-edit")).toBeVisible();
      await expect(page.getByTestId("dropdown-item-delete")).toBeVisible();
    });

    test("should close dropdown menu when item is clicked", async ({
      page,
    }) => {
      await page.goto("/");

      // Switch to Interactions tab and open dropdown
      await page.getByTestId("tab-trigger-interactions").click();
      await page.getByTestId("dropdown-trigger").click();

      // Verify dropdown is open
      await expect(page.getByTestId("dropdown-content")).toBeVisible();

      // Click a menu item
      await page.getByTestId("dropdown-item-view").click();

      // Verify dropdown is closed
      await expect(page.getByTestId("dropdown-content")).not.toBeVisible();
    });

    test("should close dropdown menu when Escape key is pressed", async ({
      page,
    }) => {
      await page.goto("/");

      // Switch to Interactions tab and open dropdown
      await page.getByTestId("tab-trigger-interactions").click();
      await page.getByTestId("dropdown-trigger").click();

      // Verify dropdown is open
      await expect(page.getByTestId("dropdown-content")).toBeVisible();

      // Press Escape key
      await page.keyboard.press("Escape");

      // Verify dropdown is closed
      await expect(page.getByTestId("dropdown-content")).not.toBeVisible();
    });

    test("should support keyboard navigation in dropdown menu", async ({
      page,
    }) => {
      await page.goto("/");

      // Switch to Interactions tab and open dropdown
      await page.getByTestId("tab-trigger-interactions").click();
      await page.getByTestId("dropdown-trigger").click();

      // Verify dropdown is open
      await expect(page.getByTestId("dropdown-content")).toBeVisible();

      // Press down arrow to navigate through items
      await page.keyboard.press("ArrowDown");
      await expect(page.getByTestId("dropdown-item-view")).toBeFocused();

      await page.keyboard.press("ArrowDown");
      await expect(page.getByTestId("dropdown-item-edit")).toBeFocused();

      // Press up arrow to go back
      await page.keyboard.press("ArrowUp");
      await expect(page.getByTestId("dropdown-item-view")).toBeFocused();
    });
  });

});
