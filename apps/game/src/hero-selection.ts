export function readSelectedHeroIds(
  heroPicker: HTMLElement,
  validHeroIds: ReadonlySet<string>,
  defaultHeroId: string,
): string[] {
  const selected = [
    ...heroPicker.querySelectorAll<HTMLInputElement>("input:checked"),
  ]
    .map((input) => input.value)
    .filter((id) => validHeroIds.has(id))
    .slice(0, 4);
  if (selected.length > 0) return selected;

  const fallback = heroPicker.querySelector<HTMLInputElement>(
    `input[value="${defaultHeroId}"]`,
  );
  if (fallback) fallback.checked = true;
  return [defaultHeroId];
}
