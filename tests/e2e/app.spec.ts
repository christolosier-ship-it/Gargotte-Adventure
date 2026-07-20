import { expect, test } from '@playwright/test';

test('affiche le socle jouable du Sprint 0', async ({ page }) => {
  await page.goto('./');

  await expect(page.getByRole('heading', { name: 'Gargotte Adventure' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Le Château de Bastognac' })).toBeVisible();
  await expect(page.getByRole('img', { name: /plateau de Bastognac/i })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Nouvelle expédition' })).toBeEnabled();
});

test('crée et restaure une sauvegarde locale', async ({ page }) => {
  await page.goto('./');
  await page.getByRole('button', { name: 'Nouvelle expédition' }).click();

  await expect(page.getByText('Expédition en cours')).toBeVisible();
  await expect(page.getByText('Enregistrée sur cet appareil')).toBeVisible();

  await page.reload();
  await expect(page.getByRole('button', { name: /Continuer l'expédition 1/ })).toBeEnabled();
});
