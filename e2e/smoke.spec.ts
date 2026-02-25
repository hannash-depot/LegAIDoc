import { expect, test, type Page } from "@playwright/test";

async function fillWizardStep(page: Page) {
  const inputs = page.locator('input:not([type="hidden"]):not([disabled])');
  const inputCount = await inputs.count();

  for (let i = 0; i < inputCount; i += 1) {
    const input = inputs.nth(i);
    const type = (await input.getAttribute("type")) ?? "text";

    if (type === "radio" || type === "checkbox") {
      continue;
    }

    const current = await input.inputValue();
    if (current.trim().length > 0) {
      continue;
    }

    if (type === "email") {
      await input.fill("smoke-user@example.com");
      continue;
    }

    if (type === "number") {
      await input.fill("100");
      continue;
    }

    if (type === "date") {
      await input.fill("2026-12-31");
      continue;
    }

    await input.fill("123456789");
  }

  const textareas = page.locator("textarea:not([disabled])");
  const textareaCount = await textareas.count();
  for (let i = 0; i < textareaCount; i += 1) {
    const textarea = textareas.nth(i);
    const current = await textarea.inputValue();
    if (current.trim().length === 0) {
      await textarea.fill("Smoke test contract content.");
    }
  }

  const selects = page.locator("select:not([disabled])");
  const selectCount = await selects.count();
  for (let i = 0; i < selectCount; i += 1) {
    const select = selects.nth(i);
    const current = await select.inputValue();
    if (current) {
      continue;
    }

    const options = await select.locator("option").all();
    if (options.length > 1) {
      const optionValue = await options[1].getAttribute("value");
      if (optionValue) {
        await select.selectOption(optionValue);
      }
    }
  }

  const radioInputs = page.locator('input[type="radio"]');
  const radioCount = await radioInputs.count();
  const handledGroups = new Set<string>();

  for (let i = 0; i < radioCount; i += 1) {
    const radio = radioInputs.nth(i);
    const groupName = (await radio.getAttribute("name")) ?? `group-${i}`;
    if (handledGroups.has(groupName)) {
      continue;
    }
    handledGroups.add(groupName);
    await radio.check({ force: true });
  }

  const checkboxes = page.locator('input[type="checkbox"]');
  const checkboxCount = await checkboxes.count();
  for (let i = 0; i < checkboxCount; i += 1) {
    const checkbox = checkboxes.nth(i);
    if (!(await checkbox.isChecked())) {
      await checkbox.check({ force: true });
    }
  }
}

test("launch smoke flow: register and create a document", async ({ page }) => {
  const uniqueEmail = `smoke-${Date.now()}@example.com`;
  const password = "SmokeTest123!";

  await page.goto("/en/register");
  await expect(
    page.getByRole("heading", { name: /create a new account/i })
  ).toBeVisible();

  await page.getByLabel(/full name/i).fill("Smoke Test User");
  await page.getByLabel(/^email$/i).fill(uniqueEmail);
  await page.getByLabel(/^password$/i).fill(password);
  await page.getByLabel(/confirm password/i).fill(password);
  await page.locator('input[type="checkbox"]').check();
  await page.getByRole("button", { name: /sign up/i }).click();

  await expect(page).toHaveURL(/\/en\/dashboard/, { timeout: 30_000 });
  await expect(page.getByRole("heading", { name: /my documents/i })).toBeVisible();

  await page.goto("/en/templates");
  await expect(
    page.getByRole("heading", { name: /contract templates/i })
  ).toBeVisible();

  const templateLink = page.locator('a[href*="/wizard/"]').first();
  await expect(templateLink).toBeVisible();
  await templateLink.click();

  await expect(page).toHaveURL(/\/en\/wizard\/[^/]+\/0\?doc=/, {
    timeout: 30_000,
  });

  for (let step = 0; step < 15; step += 1) {
    await fillWizardStep(page);

    const finalizeButton = page.getByRole("button", { name: /finalize/i });
    if (await finalizeButton.isVisible()) {
      await finalizeButton.click();
      break;
    }

    await page.getByRole("button", { name: /^next$/i }).click();
    await page.waitForTimeout(300);
  }

  await expect(page).toHaveURL(/\/en\/documents\/[^/?#]+$/, {
    timeout: 30_000,
  });
  await expect(
    page.getByRole("button", { name: /download pdf/i })
  ).toBeVisible();
});
