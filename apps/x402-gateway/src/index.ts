import "./preload.js";
import { createApp } from "./app.js";
import { readEnv } from "./lib/env.js";

const port = Number(readEnv("X402_GATEWAY_PORT", "4000"));
const app = createApp();

app.listen(port, () => {
  console.log(`[x402] Sanji gateway listening on http://localhost:${port}`);
});
