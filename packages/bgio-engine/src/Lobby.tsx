import type { GameComponent } from "boardgame.io/dist/types/src/lobby/connection";
import { Lobby } from "boardgame.io/react";
import React from "react";
import { OnlineGame } from "./example";
import { WitchTrialGame } from "./game";

const importedGames: GameComponent[] = [
  { game: WitchTrialGame, board: OnlineGame },
];
export default function LobbyComponent() {
  const { protocol, hostname, port } = window.location;
  const server = `${protocol}//${hostname}:8000`;
  return (
    <div>
      <h1>Lobby</h1>
      <Lobby
        gameServer={server}
        lobbyServer={server}
        gameComponents={importedGames}
      />
    </div>
  );
}
