export const APP_VERSION = '0.0.0-sprint-0';
export const CONTENT_SCHEMA_VERSION = 1;

export function assertNever(value: never): never {
  throw new Error(`Valeur inattendue: ${String(value)}`);
}

export function createId(prefix = 'evt'): string {
  return `${prefix}-${crypto.randomUUID()}`;
}
