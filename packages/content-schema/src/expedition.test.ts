import { describe, expect, it } from "vitest";
import { parseExpeditionDefinition } from "./expedition";

const definition = {
  schemaVersion: 1,
  id: "micro-donjon-bastognac",
  name: "Le chemin de ronde de Bastognac",
  introduction: "Trois salles, une seule sortie et beaucoup trop de tonneaux.",
  roomIds: ["bastognac-salle-1", "bastognac-salle-2", "bastognac-salle-3"],
  entryRoomId: "bastognac-salle-1",
  rooms: [
    {
      id: "bastognac-salle-1",
      name: "Le vestibule des maladroits",
      objective: "Neutraliser les gardes.",
      roomContentId: "bastognac-salle-1",
      entryId: "entree-ouest",
      exitId: "sortie-est",
      nextRoomId: "bastognac-salle-2",
      introduction: "Une première porte grince.",
    },
    {
      id: "bastognac-salle-2",
      name: "La galerie des tonneaux",
      objective: "Nettoyer la galerie.",
      roomContentId: "bastognac-salle-2",
      entryId: "entree-ouest",
      exitId: "sortie-est",
      nextRoomId: "bastognac-salle-3",
      introduction: "Les meubles ont l’air nerveux.",
    },
    {
      id: "bastognac-salle-3",
      name: "La salle du dernier verrou",
      objective: "Vaincre les derniers défenseurs.",
      roomContentId: "bastognac-salle-3",
      entryId: "entree-ouest",
      exitId: null,
      nextRoomId: null,
      introduction: "Le verrou final attend.",
    },
  ],
  connections: [
    {
      id: "passage-1-2",
      fromRoomId: "bastognac-salle-1",
      exitId: "sortie-est",
      toRoomId: "bastognac-salle-2",
      targetEntryId: "entree-ouest",
      label: "Passer dans la galerie",
    },
    {
      id: "passage-2-3",
      fromRoomId: "bastognac-salle-2",
      exitId: "sortie-est",
      toRoomId: "bastognac-salle-3",
      targetEntryId: "entree-ouest",
      label: "Franchir le dernier verrou",
    },
  ],
  victoryText: "Les trois salles sont nettoyées.",
  defeatText: "L’expédition retourne à la Chope Qui Colle.",
} as const;

describe("définition d’expédition", () => {
  it("valide une chaîne manuelle de trois salles", () => {
    expect(parseExpeditionDefinition(definition).roomIds).toEqual(
      definition.roomIds,
    );
  });

  it("rejette un ordre dupliqué", () => {
    expect(() =>
      parseExpeditionDefinition({
        ...definition,
        roomIds: [
          "bastognac-salle-1",
          "bastognac-salle-1",
          "bastognac-salle-3",
        ],
      }),
    ).toThrow(/uniques/);
  });

  it("rejette une connexion qui contourne une salle", () => {
    expect(() =>
      parseExpeditionDefinition({
        ...definition,
        connections: [
          {
            ...definition.connections[0],
            toRoomId: "bastognac-salle-3",
          },
          definition.connections[1],
        ],
      }),
    ).toThrow(/connexion attendue/);
  });

  it("rejette une sortie sur la dernière salle", () => {
    expect(() =>
      parseExpeditionDefinition({
        ...definition,
        rooms: definition.rooms.map((room, index) =>
          index === 2 ? { ...room, exitId: "sortie-fantome" } : room,
        ),
      }),
    ).toThrow(/dernière salle/);
  });
});
