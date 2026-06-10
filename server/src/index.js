import http from "http";
import { env } from "./config/env.js";
import { createApp } from "./http/app.js";
import { createSocketServer } from "./socket/index.js";

const app = createApp();
const server = http.createServer(app);

createSocketServer(server);

server.listen(env.port, () => {
  console.log(`Pourcision multiplayer backend listening on :${env.port}`);
});
