import axios from "axios";
import { isPlaceholder, readEnv } from "./env.js";

const SDK_SPECIFIER = "@clawpump/sdk";

export interface SwapRequest {
  inputMint: string;
  outputMint: string;
  amountLamports: number;
  userPublicKey: string;
}

export interface SwapResult {
  swapTransaction: string;
  provider: "sdk" | "rest";
}

export interface BountyRequest {
  slug: string;
  restaurantName: string;
  neighborhood: string;
  rewardUsdc: number;
  tierLabel: string;
  previewUrl: string;
}

export interface BountyResult {
  bountyId: string;
  provider: "sdk" | "rest" | "local";
  detail: string;
}

export interface SkillRegistration {
  name: string;
  description: string;
  priceLamports?: number;
  endpoint: string;
}

export interface SkillResult {
  name: string;
  provider: "sdk" | "rest" | "local";
  ok: boolean;
  detail: string;
}

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object") return null;
  return value as Record<string, unknown>;
}

function authHeaders(): Record<string, string> {
  const apiKey = readEnv("CLAWPUMP_API_KEY");
  if (isPlaceholder(apiKey)) return {};
  return {
    authorization: `Bearer ${apiKey}`,
    "x-api-key": apiKey,
  };
}

function extractString(payload: unknown, keys: string[]): string | null {
  const record = asRecord(payload);
  if (!record) return null;
  for (const key of keys) {
    const value = record[key];
    if (typeof value === "string" && value.trim()) return value.trim();
  }
  const nested = asRecord(record.data) ?? asRecord(record.result);
  if (!nested) return null;
  for (const key of keys) {
    const value = nested[key];
    if (typeof value === "string" && value.trim()) return value.trim();
  }
  return null;
}

async function loadSdk(): Promise<Record<string, unknown> | null> {
  try {
    const imported = (await import(SDK_SPECIFIER)) as Record<string, unknown>;
    return imported;
  } catch {
    return null;
  }
}

async function sdkClient(module: Record<string, unknown>): Promise<Record<string, unknown> | null> {
  const apiKey = readEnv("CLAWPUMP_API_KEY");
  const options = { apiKey: isPlaceholder(apiKey) ? undefined : apiKey, network: "solana-mainnet" };
  const factories = [module.createClient, module.createClawPump, module.ClawPump];
  for (const factory of factories) {
    if (typeof factory !== "function") continue;
    try {
      const created = await factory(options);
      const record = asRecord(created);
      if (record) return record;
    } catch {
      continue;
    }
  }
  const ClientCtor = module.ClawPumpClient ?? module.default;
  if (typeof ClientCtor === "function") {
    try {
      const created = await new (ClientCtor as new (args: unknown) => unknown)(options);
      return asRecord(created);
    } catch {
      return asRecord(ClientCtor);
    }
  }
  return module;
}

async function callSdk(
  method: string,
  args: unknown,
): Promise<{ payload: unknown } | null> {
  const module = await loadSdk();
  if (!module) return null;
  const target = (await sdkClient(module)) ?? module;
  const direct = target[method] ?? module[method];
  if (typeof direct !== "function") return null;
  const payload = await direct.call(target, args);
  return { payload };
}

export async function executeSwap(input: SwapRequest): Promise<SwapResult> {
  const args = { ...input, slippageBps: 100, side: "buyback" };
  try {
    const sdk = await callSdk("executeSwap", args);
    const swapTransaction = sdk ? extractString(sdk.payload, ["swapTransaction", "transaction", "tx"]) : null;
    if (swapTransaction) return { swapTransaction, provider: "sdk" };
  } catch (error) {
    const message = error instanceof Error ? error.message : "SDK swap failed";
    console.warn(`[clawpump] SDK executeSwap skipped: ${message}`);
  }

  const url = readEnv("CLAWPUMP_SWAP_URL", "https://clawpump.tech/api/swap/execute");
  try {
    const response = await axios.post(url, args, {
      timeout: 12_000,
      headers: { "content-type": "application/json", ...authHeaders() },
    });
    const swapTransaction = extractString(response.data, ["swapTransaction", "transaction", "tx"]);
    if (!swapTransaction) {
      throw new Error("ClawPump swap response did not include a transaction.");
    }
    return { swapTransaction, provider: "rest" };
  } catch (error) {
    const message = axios.isAxiosError(error)
      ? `ClawPump swap HTTP ${error.response?.status ?? "error"}: ${error.message}`
      : error instanceof Error
        ? error.message
        : "ClawPump swap failed";
    throw new Error(message);
  }
}

export async function createCommunityBounty(input: BountyRequest): Promise<BountyResult> {
  const body = {
    title: `Connect domain and finalize menu JSON for ${input.restaurantName}`,
    description:
      `Connect the custom domain for ${input.restaurantName} in ${input.neighborhood} and finalize the menu JSON ` +
      `within 24 hours. Slug: ${input.slug}. Tier: ${input.tierLabel}. Preview: ${input.previewUrl}.`,
    rewardUsdc: input.rewardUsdc,
    asset: "USDC",
    deadlineHours: 24,
    tags: ["sanji", "caba", input.slug],
    agentId: readEnv("SANJI_AGENT_ID", "agent_sanji_caba_01"),
    slug: input.slug,
  };

  try {
    const sdk = await callSdk("createBounty", body);
    const bountyId = sdk ? extractString(sdk.payload, ["bountyId", "id"]) : null;
    if (bountyId) {
      return { bountyId, provider: "sdk", detail: "Bounty created through @clawpump/sdk." };
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : "SDK bounty failed";
    console.warn(`[clawpump] SDK createBounty skipped: ${message}`);
  }

  const url = readEnv("CLAWPUMP_BOUNTY_URL", "https://clawpump.tech/api/bounties/create");
  try {
    const response = await axios.post(url, body, {
      timeout: 12_000,
      headers: { "content-type": "application/json", ...authHeaders() },
    });
    const bountyId = extractString(response.data, ["bountyId", "id"]);
    if (!bountyId) throw new Error("ClawPump bounty response did not include an id.");
    return { bountyId, provider: "rest", detail: "Bounty posted to ClawPump." };
  } catch (error) {
    const message = axios.isAxiosError(error)
      ? `ClawPump bounty HTTP ${error.response?.status ?? "error"}: ${error.message}`
      : error instanceof Error
        ? error.message
        : "ClawPump bounty failed";
    const bountyId = `local_${input.slug}_${Date.now()}`;
    console.warn(`[clawpump] ${message}. Recorded local bounty ${bountyId}.`);
    return {
      bountyId,
      provider: "local",
      detail: `${message}. Local bounty recorded so the receipt stays complete.`,
    };
  }
}

export async function registerSanjiSkills(): Promise<{ skills: SkillResult[] }> {
  const gateway = readEnv("X402_GATEWAY_URL", "http://localhost:4000");
  const preview = readEnv("PREVIEW_ENGINE_URL", "http://localhost:3000");
  const skills: SkillRegistration[] = [
    {
      name: "sanji_caba_lead_enricher",
      description: "Unlocks the next enriched CABA restaurant owner lead after an x402 SOL payment.",
      priceLamports: 500_000,
      endpoint: `${gateway}/api/x402/leads/caba`,
    },
    {
      name: "sanji_instant_landing",
      description: "Publishes the GSAP restaurant landing and WhatsApp booking page for a CABA lead.",
      endpoint: `${preview}/preview`,
    },
  ];

  const results: SkillResult[] = [];
  for (const skill of skills) {
    results.push(await registerOne(skill));
  }
  return { skills: results };
}

async function registerOne(skill: SkillRegistration): Promise<SkillResult> {
  try {
    const sdk = await callSdk("registerSkill", skill);
    if (sdk) {
      return { name: skill.name, provider: "sdk", ok: true, detail: "Registered through @clawpump/sdk." };
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : "SDK skill registration failed";
    console.warn(`[clawpump] SDK registerSkill skipped: ${message}`);
  }

  const url = readEnv("CLAWPUMP_SKILLS_URL", "https://clawpump.tech/api/skills/register");
  try {
    await axios.post(url, skill, {
      timeout: 12_000,
      headers: { "content-type": "application/json", ...authHeaders() },
    });
    return { name: skill.name, provider: "rest", ok: true, detail: "Registered on ClawPump." };
  } catch (error) {
    const message = axios.isAxiosError(error)
      ? `ClawPump skills HTTP ${error.response?.status ?? "error"}: ${error.message}`
      : error instanceof Error
        ? error.message
        : "Skill registration failed";
    console.warn(`[clawpump] ${skill.name}: ${message}`);
    return {
      name: skill.name,
      provider: "local",
      ok: false,
      detail: `${message} Local definition remains available at ${skill.endpoint}.`,
    };
  }
}
