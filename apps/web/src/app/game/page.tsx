"use client";

import GameLayout from "@components/layout/GameLayout";
import { NoSSR } from "@components/NoSSR";
import { useAuthUser } from "@hooks/use-user";
import { LocalGame, OnlineGame } from "@whole-ends-kneel/bgio-engine";
// import { GameRoom, gameStyles } from "@whole-ends-kneel/bgio-engine/examples";

export default () => {
  const user = useAuthUser();
  return (
    <GameLayout>
      <NoSSR>
        {/* <style >{gameStyles}</style> */}
        <style>{`.bgio-client { height: 100%; }`}</style>
        <OnlineGame
          playerID="0"
          matchID="default"
          credentials={user?.access_token!}
        />
        {/* <LocalGame playerID="2" credentials="" /> */}
      </NoSSR>
    </GameLayout>
  );
};
