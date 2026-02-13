import type { PlayerID, State } from "boardgame.io";
import { Bot, Simulate } from "boardgame.io/ai";
import type { BotAction } from "boardgame.io/dist/types/src/ai/bot";

class MyCustomBot extends Bot {
  constructor(config: ConstructorParameters<typeof Bot>[0]) {
    super(config);
    // 初始化自定义配置
    this.addOpt({
      key: "strategyDepth",
      initial: 3,
      range: { min: 1, max: 10 },
    });
  }

  async play(
    state: State<{}>,
    playerID: PlayerID,
  ): Promise<{ action: BotAction; metadata?: any }> {
    // 核心决策逻辑实现
    return {
      action: {
        type: "MAKE_MOVE",
        payload: {
          //@ts-expect-error
          move: "move1",
        },
      },
      metadata: {},
    };
  }
}
