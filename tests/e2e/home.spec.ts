import { expect, test } from "@playwright/test";

test("loads the agenda dashboard", async ({ page }) => {
  await page.goto("/");

  await expect(page.getByRole("heading", { name: /Agenda/i })).toBeVisible();
  await expect(page.getByText("Programação")).toBeVisible();
  await expect(page.getByRole("button", { name: "Ver classificação completa" })).toBeVisible();
  await expect(page.getByText("Histórico recente")).toHaveCount(0);
});

test("switches between F1 and F2", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "F2" }).first().click();

  await expect(page.getByText("F2: páginas oficiais FIA Formula 2")).toBeVisible();
  await expect(page.getByText(/Corrida Sprint|Corrida 2/).first()).toBeVisible();
});

test("opens session classification and returns to schedule", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: /Treino Livre 1/ }).click();

  await expect(page.getByText("Classificação da sessão")).toBeVisible();
  await expect(page.getByText("País")).toBeVisible();
  await expect(page.getByRole("button", { name: "Voltar" })).toBeVisible();

  await page.getByRole("button", { name: "Voltar" }).click();
  await expect(page.getByText("Programação")).toBeVisible();
});

test("opens full calendar and full standings panels", async ({ page }) => {
  await page.goto("/");

  await page.getByRole("button", { name: "Ver calendário completo" }).click();
  await expect(page.getByRole("heading", { name: "Calendário completo" })).toBeVisible();
  await page.getByRole("button", { name: "Voltar" }).click();

  await page.getByRole("button", { name: "Ver classificação completa" }).click();
  await expect(page.getByRole("heading", { name: /Classificação completa/ })).toBeVisible();
});
