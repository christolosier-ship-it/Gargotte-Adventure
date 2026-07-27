export const BUILD_LABEL = "Sprint 3.6";

export function createId(prefix = "evt"): string {
  return `${prefix}-${crypto.randomUUID()}`;
}
