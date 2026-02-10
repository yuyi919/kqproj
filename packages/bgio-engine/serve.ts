import { Server } from "boardgame.io/server";
import { WitchTrialGame } from "./src/game";

Server({
  games: [{ ...WitchTrialGame, seed: 0 }],
  origins: ["http://localhost:3000"],
  apiOrigins: ["http://localhost:3000"],
  async authenticateCredentials(credentials: string, playerMetadata) {
    console.log("playerMetadata", playerMetadata);
    return true;
  },
  async generateCredentials(ctx) {
    ctx.log("generateCredentials");
    return "";
  },
  //   db: {
  //     client: "pg",
  //     host: "localhost",
  //     port: 5432,
  //     user: "postgres",
  //     password: "postgres",
  //     database: "bgio",
  //   },
}).run({ port: 8000 }, () => {
  console.log("Server running on port 8000");
});
