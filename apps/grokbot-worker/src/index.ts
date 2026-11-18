import "./preload.js";
import { appendActivity, type RestaurantLead } from "@sanji/database";
import axios from "axios";
import { craftWhatsAppPitch } from "./grok-sdr.js";
import { log } from "./log.js";
import { SanjiMcpClient } from "./mcp-client.js";

interface ChallengeBody {
  amountLamports?: number;
  recipient?: string;
  memo?: string;
  skill?: string;
  message?: string;
  error?: string;
}

interface UnlockBody {
  lead?: RestaurantLead;
}

function gatewayUrl(): string {
  return (process.env.X402_GATEWAY_URL?.trim() || "http://localhost:4000").replace(/\/$/, "");
}

function previewBase(): string {
  return (process.env.PREVIEW_ENGINE_URL?.trim() || "http://localhost:3000").replace(/\/$/, "");
}

function lamportsLabel(value: number): string {
  return value.toLocaleString("en-US");
}

async function runCycle(client: SanjiMcpClient): Promise<void> {
  log.mcp("Connecting to ClawPump OS...");
  const tools = await client.connect();
  if (tools.length > 0) {
    log.detail(`ClawPump tools: ${tools.join(", ")}`);
  }

  const endpoint = `${gatewayUrl()}/api/x402/leads/global`;
  log.scout("Requesting global hot lead from /api/x402/leads/global...");

  let challenge;
  try {
    challenge = await axios.get<ChallengeBody>(endpoint, {
      timeout: 10_000,
      validateStatus: () => true,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "gateway unreachable";
    throw new Error(`Gateway is not up at ${gatewayUrl()} (${message}). Start it with pnpm dev.`);
  }

  if (challenge.status === 400) {
    throw new Error(challenge.data.error ?? "Gateway rejected the territory.");
  }

  if (challenge.status !== 402) {
    throw new Error(`Expected HTTP 402 from the paywall, received ${challenge.status}.`);
  }

  const amount = Number(challenge.data.amountLamports ?? 500_000);
  const recipient = challenge.data.recipient ?? process.env.SANJI_TREASURY_PUBLIC_KEY ?? "";
  const memo = challenge.data.memo ?? `SANJI_GLOBAL_LEAD_${Date.now()}`;
  log.x402(
    `Received HTTP 402 Payment Required (${lamportsLabel(amount)} lamports). Executing x402_pay from Sanji Agent Wallet...`,
  );

  const payment = await client.payWithX402({
    recipient,
    amountLamports: amount,
    memo,
    skill: challenge.data.skill ?? "sanji_global_lead_enricher",
  });

  if (payment.simulated) {
    log.solana(
      `Demo settlement ${payment.signature}. No funded agent key, so the paywall opens with x-demo-simulation. Unlocking lead data...`,
    );
  } else {
    log.solana(`Payment confirmed on-chain (${payment.signature}). Unlocking lead data...`);
  }

  const headers: Record<string, string> = {
    "x-payment-signature": payment.signature,
  };
  if (payment.simulated) headers["x-demo-simulation"] = "true";

  const unlocked = await axios.get<UnlockBody>(endpoint, { headers, timeout: 10_000 });
  const lead = unlocked.data.lead;
  if (!lead) throw new Error("Gateway unlocked a response without a restaurant lead.");

  const previewPath = `/preview/${lead.slug}`;
  log.preview(`Verifying live GSAP landing page at ${previewPath}...`);
  const previewUrl = `${previewBase()}${previewPath}`;
  try {
    const page = await axios.get(previewUrl, { timeout: 8_000, validateStatus: () => true });
    log.detail(
      page.status === 200
        ? `Live ${page.status} ${previewUrl}`
        : `Preview returned HTTP ${page.status} at ${previewUrl}`,
    );
  } catch {
    log.detail(`Preview engine is not reachable at ${previewUrl}. Start it with pnpm dev.`);
  }

  log.grok(
    `Generating ${lead.language} pitch for ${lead.owner_name} in ${lead.city}, ${lead.country}...`,
  );
  const pitch = await craftWhatsAppPitch(lead);
  console.log("");
  console.log(pitch.message);
  console.log("");
  log.detail(`Channel: WhatsApp ${lead.owner_phone} · ${pitch.voice} · ${pitch.source}`);
  log.detail(pitch.whatsappUrl);

  await appendActivity({
    kind: "outreach",
    slug: lead.slug,
    signature: payment.signature,
    message: `Pitch ${pitch.source} dispatched to ${lead.owner_name} at ${lead.owner_phone}.`,
  });
}

async function main(): Promise<void> {
  const loop = process.argv.includes("--loop");
  const client = new SanjiMcpClient();
  try {
    do {
      await runCycle(client);
      if (!loop) break;
      log.detail("Next scout in 20s. Ctrl+C to stop.");
      await new Promise((resolve) => setTimeout(resolve, 20_000));
    } while (loop);
  } finally {
    await client.close();
  }
}

main()
  .then(() => {
    process.exit(0);
  })
  .catch((error: unknown) => {
    const message = error instanceof Error ? error.message : "Worker failed";
    console.error(`\x1b[31m[SANJI]\x1b[0m ${message}`);
    process.exit(1);
  });
