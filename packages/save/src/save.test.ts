import "fake-indexeddb/auto";
import { describe, expect, it } from "vitest";
import { createInitialGameState } from "@gargotte/engine";
import { clearGameState, loadGameState, saveGameState } from "./index";
describe("save",()=>{it("serializes, restores and clears v2 saves",async()=>{const s=createInitialGameState(7); await saveGameState(s); await expect(loadGameState()).resolves.toEqual(s); await clearGameState(); await expect(loadGameState()).resolves.toBeNull();});});
