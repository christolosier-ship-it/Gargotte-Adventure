export type TacticalErrorCode =
  | "out-of-bounds"
  | "blocked"
  | "occupied"
  | "no-path"
  | "not-heroes-turn"
  | "not-enemy-turn"
  | "invalid-phase"
  | "hero-not-found"
  | "enemy-not-found"
  | "not-active-hero"
  | "hero-completed"
  | "no-actions"
  | "target-invalid"
  | "out-of-range"
  | "line-of-sight-blocked";
export interface TacticalError {
  code: TacticalErrorCode;
  message: string;
}
export type TacticalResult<T> =
  { ok: true; value: T } | { ok: false; error: TacticalError };
export const ok = <T>(value: T): TacticalResult<T> => ({ ok: true, value });
export const err = (
  code: TacticalErrorCode,
  message: string,
): TacticalResult<never> => ({ ok: false, error: { code, message } });
