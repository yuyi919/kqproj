import cluster from "cluster";

const SERVERS_COUNT = 3;

cluster.setupPrimary({
  exec: "./ch.ts",
});

for (let i = 0; i < SERVERS_COUNT; i++) {
  cluster.fork({
    PORT: 3001 + i,
  });
}
