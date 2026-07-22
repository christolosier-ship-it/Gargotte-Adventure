export const BUILD_LABEL = "Sprint 2";

export function createId(prefix = "evt"): string {
  return `${prefix}-${crypto.randomUUID()}`;
}
