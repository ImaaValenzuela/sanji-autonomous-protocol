import cors from "cors";
import express, { type NextFunction, type Request, type Response } from "express";
import { leadsRouter } from "./routes/leads.routes.js";
import { webhookRouter } from "./routes/webhook.routes.js";

export function createApp(): express.Express {
  const app = express();
  app.use(
    cors({
      origin: true,
      allowedHeaders: [
        "content-type",
        "x-payment-signature",
        "x-demo-simulation",
        "x-webhook-secret",
      ],
    }),
  );
  app.use(express.json({ limit: "1mb" }));

  app.get("/health", (_req, res) => {
    res.json({
      ok: true,
      service: "x402-gateway",
      protocol: "x402",
      network: "solana-mainnet",
    });
  });

  app.use("/api/x402", leadsRouter);
  app.use("/api/webhooks", webhookRouter);

  app.use((_req, res) => {
    res.status(404).json({ error: "Not found" });
  });

  app.use((error: unknown, _req: Request, res: Response, _next: NextFunction) => {
    const message = error instanceof Error ? error.message : "Internal error";
    console.error(`[x402] ${message}`);
    if (res.headersSent) return;
    res.status(500).json({ error: message });
  });

  return app;
}
