"use client";

import GameLayout from "@components/layout/GameLayout";
import { NoSSR } from "@components/NoSSR";
import { LocalGame, OnlineGame } from "@lib/bgio-engine/example";
import { GameRoom, gameStyles } from "@lib/game-engine/examples";

export default () => {
  return (
    <GameLayout>
      <NoSSR>
        {/* <style >{gameStyles}</style> */}
        <style>{`.bgio-client { height: 100%; }`}</style>
        {/* <OnlineGame playerID="2" /> */}
        <LocalGame playerID="2" />
      </NoSSR>
    </GameLayout>
  );
};
