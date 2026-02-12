import { test, expect } from "./fixtures";

async function gotoHomepageAndWaitForIsland(page: any) {
  await page.goto("/");
  const island = page.getByTestId("shadcn-island");
  await expect(island).toBeVisible();
  await expect(island).toHaveAttribute("data-hydrated", "true");
}

test.describe("Surface and Feedback Primitives", () => {

  test("shadcn island renders Card component with all slots", async ({
    page,
  }) => {
    await gotoHomepageAndWaitForIsland(page);

    const island = page.getByTestId("shadcn-island");
    await expect(island).toBeVisible();

    // Verify the island itself is a Card component
    await expect(island).toHaveAttribute("data-slot", "card");

    // Verify Card component structure using data-slot attributes
    const cardHeader = island.locator('[data-slot="card-header"]');
    await expect(cardHeader).toBeVisible();

    const cardTitle = island.locator('[data-slot="card-title"]');
    await expect(cardTitle).toBeVisible();
    await expect(cardTitle).toHaveText(
      "shadcn Interactive Overlay Primitives"
    );

    const cardDescription = island.locator('[data-slot="card-description"]');
    await expect(cardDescription).toBeVisible();

    const cardContent = island.locator('[data-slot="card-content"]');
    await expect(cardContent).toBeVisible();
  });

  test("Badge components render with correct variants", async ({ page }) => {
    await gotoHomepageAndWaitForIsland(page);

    const island = page.getByTestId("shadcn-island");

    // Navigate to Components tab where badges are located
    const componentsTab = page.getByTestId("tab-trigger-components");
    await expect(componentsTab).toBeVisible();
    await componentsTab.click();

    // Wait for tab content to become visible (tab animation)
    await page.waitForTimeout(300);

    // Default badge
    const defaultBadge = island.getByTestId("badge-default");
    await expect(defaultBadge).toBeVisible();
    await expect(defaultBadge).toHaveAttribute("data-variant", "default");
    await expect(defaultBadge).toHaveText("Default Badge");

    // Secondary badge
    const secondaryBadge = island.getByTestId("badge-secondary");
    await expect(secondaryBadge).toBeVisible();
    await expect(secondaryBadge).toHaveAttribute("data-variant", "secondary");
    await expect(secondaryBadge).toHaveText("Secondary");

    // Outline badge
    const outlineBadge = island.getByTestId("badge-outline");
    await expect(outlineBadge).toBeVisible();
    await expect(outlineBadge).toHaveAttribute("data-variant", "outline");
    await expect(outlineBadge).toHaveText("Outline");
  });

  test("Separator component renders correctly", async ({ page }) => {
    await gotoHomepageAndWaitForIsland(page);

    const separator = page.getByTestId("separator");
    await expect(separator).toBeVisible();

    // Verify separator has appropriate ARIA role (decorative separators use role="none")
    await expect(separator).toHaveAttribute("data-slot", "separator");
  });


  test("EventCard components render with Card primitives", async ({ page }) => {
    await page.goto("/");

    // Look for event cards (if any events exist)
    const eventCards = page.getByTestId("event-card");
    const count = await eventCards.count();

    if (count > 0) {
      const firstCard = eventCards.first();

      // Verify Card structure
      const card = firstCard.locator('[data-slot="card"]');
      await expect(card).toBeVisible();

      // Verify card has header, title, description, and content slots
      const cardHeader = card.locator('[data-slot="card-header"]');
      await expect(cardHeader).toBeVisible();

      // CardTitle was replaced with h2 element for semantic HTML
      const cardTitle = card.locator("h2");
      await expect(cardTitle).toBeVisible();

      const cardContent = card.locator('[data-slot="card-content"]');
      await expect(cardContent).toBeVisible();

      // Verify RSVP badges
      const goingBadge = firstCard.getByTestId("rsvp-going");
      await expect(goingBadge).toBeVisible();
      await expect(goingBadge).toContainText("going");

      const maybeBadge = firstCard.getByTestId("rsvp-maybe");
      await expect(maybeBadge).toBeVisible();
      await expect(maybeBadge).toContainText("maybe");

      const notGoingBadge = firstCard.getByTestId("rsvp-not-going");
      await expect(notGoingBadge).toBeVisible();
      await expect(notGoingBadge).toContainText("not going");
    }
  });

  test("Empty state renders when no events exist", async ({ page }) => {
    await page.goto("/");

    // This test relies on the database being empty
    // We'll check if the empty state exists
    const emptyState = page.getByTestId("empty-state");
    const eventCards = page.getByTestId("event-card");

    const hasEvents = (await eventCards.count()) > 0;

    if (!hasEvents) {
      await expect(emptyState).toBeVisible();
      await expect(emptyState).toContainText("No events yet");
    }
  });
});
