import { describe, expect, it } from 'vitest';
import { parseDungeon } from './index';

describe('schéma de contenu', () => {
  it('accepte la définition minimale de Bastognac', () => {
    const dungeon = parseDungeon({
      schemaVersion: 1,
      id: 'chateau-de-bastognac',
      name: 'Le Château de Bastognac',
      subtitle: 'Premier donjon de Gargotte Adventure',
      floorBudgets: [3, 5, 7, 9, 11],
      bossId: 'baron-pas-tres-terrifiant',
      status: 'foundation-placeholder'
    });

    expect(dungeon.floorBudgets).toEqual([3, 5, 7, 9, 11]);
  });

  it('refuse un identifiant instable', () => {
    expect(() =>
      parseDungeon({
        schemaVersion: 1,
        id: 'Bastognac !!',
        name: 'Bastognac',
        subtitle: 'Test',
        floorBudgets: [3, 5, 7, 9, 11],
        bossId: 'baron',
        status: 'foundation-placeholder'
      })
    ).toThrow();
  });
});
