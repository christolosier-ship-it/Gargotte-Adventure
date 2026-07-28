import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { spawnSync } from "node:child_process";
import { afterEach, describe, expect, it } from "vitest";

const temporaryRoots: string[] = [];
const validator = resolve("tools/validate_repository.py");

afterEach(() => {
  for (const root of temporaryRoots.splice(0))
    rmSync(root, { recursive: true, force: true });
});

function validatePresentationImport(source: string): string {
  const root = mkdtempSync(join(tmpdir(), "gargotte-boundary-"));
  temporaryRoots.push(root);
  const presentationRoot = join(root, "packages/presentation/src");
  mkdirSync(presentationRoot, { recursive: true });
  writeFileSync(join(presentationRoot, "index.ts"), `${source}\n`, "utf8");

  const result = spawnSync("python3", [validator], {
    cwd: resolve("."),
    env: { ...process.env, GARGOTTE_VALIDATION_ROOT: root },
    encoding: "utf8",
  });
  return `${result.stdout}${result.stderr}`;
}

describe("frontières du package presentation", () => {
  it("autorise la dépendance vers engine", () => {
    const output = validatePresentationImport(
      'import type { RoomState } from "@gargotte/engine";',
    );

    expect(output).not.toContain(
      "packages/presentation/src/index.ts importe @gargotte/engine",
    );
  });

  it("refuse une dépendance vers renderer", () => {
    const output = validatePresentationImport(
      'import type { TabletopRenderer } from "@gargotte/renderer";',
    );

    expect(output).toContain(
      "Frontière de package interdite : packages/presentation/src/index.ts importe @gargotte/renderer",
    );
  });
});
