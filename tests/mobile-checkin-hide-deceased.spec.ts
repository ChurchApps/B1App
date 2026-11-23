import { test, expect } from "@playwright/test";

// The member-site check-in list never shows deceased household members; inactive members stay (they may be returning).
test("check-in household list hides deceased members and keeps inactive ones", async ({ page }) => {
  const SERVICE = "SER00000001";
  const marked: { deceased?: string; inactive?: string; others: string[] } = { others: [] };

  await page.route("**/membership/people/household/**", async (route) => {
    const response = await route.fetch();
    const members: { id: string; membershipStatus?: string }[] = await response.json();
    const result = members.map((m, i) => {
      if (i === members.length - 1) { marked.deceased = m.id; return { ...m, membershipStatus: "Deceased" }; }
      if (i === members.length - 2) { marked.inactive = m.id; return { ...m, membershipStatus: "Inactive" }; }
      marked.others.push(m.id);
      return m;
    });
    await route.fulfill({ response, json: result });
  });

  await page.goto("/mobile/checkin");
  await page.getByTestId("select-service-" + SERVICE + "-button").click({ timeout: 30000 });
  await expect(page.getByTestId("checkin-submit-button")).toBeVisible({ timeout: 30000 });

  expect(marked.deceased && marked.inactive).toBeTruthy();
  await expect(page.getByTestId("select-member-" + marked.deceased)).toHaveCount(0);
  await expect(page.getByTestId("select-member-" + marked.inactive)).toBeVisible();
  for (const id of marked.others) await expect(page.getByTestId("select-member-" + id)).toBeVisible();
});
