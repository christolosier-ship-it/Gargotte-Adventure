import { describe, expect, it } from "vitest";
import dungeon from "../../../content/bastognac/dungeon.json";
import { parseDungeon } from "./index";
describe("content schema",()=>{it("validates Sprint 1 room content",()=>{expect(parseDungeon(dungeon).sprint1Scenario.room).toEqual({width:8,height:4,obstacles:[{column:4,row:1},{column:4,row:2}]});});});
