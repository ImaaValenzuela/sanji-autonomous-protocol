const PLACEHOLDERS = [
  "replace_me",
  "base58_solana_private_key_here",
  "solana_public_key_here",
  "solana_spl_token_mint_here",
  "your-project.supabase.co",
  "eyJ...",
  "xai-replace_me",
  "cp_live_replace_me",
];

export function isPlaceholder(value: string | undefined): boolean {
  if (!value) return true;
  const trimmed = value.trim();
  if (!trimmed) return true;
  return PLACEHOLDERS.some((marker) => trimmed.includes(marker));
}

export function readEnv(name: string, fallback = ""): string {
  return process.env[name]?.trim() || fallback;
}

export const SOL_MINT = "So11111111111111111111111111111111111111112";
export const X402_LAMPORTS = 500_000;

export const TIERS = {
  SANJI_EXPRESS_290: {
    amountUsd: 290,
    buybackSol: 0.35,
    bountyUsdc: 40,
    status: "PAID_EXPRESS",
    label: "Sanji Express",
  },
  SANJI_CORE_1200: {
    amountUsd: 1200,
    buybackSol: 1.4,
    bountyUsdc: 120,
    status: "PAID_CORE",
    label: "Sanji Autonomous Core",
  },
} as const;

export type PricingTier = keyof typeof TIERS;

export function isPricingTier(value: unknown): value is PricingTier {
  return value === "SANJI_EXPRESS_290" || value === "SANJI_CORE_1200";
}

export function buybackLamports(sol: number): number {
  return Math.round(sol * 1_000_000_000);
}
