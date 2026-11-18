import { randomUUID } from "node:crypto";
import { appendActivity, getLeadBySlug, markLeadPaid } from "@sanji/database";
import { Router } from "express";
import { asyncHandler } from "../lib/async-handler.js";
import { createCommunityBounty, executeSwap } from "../lib/clawpump.js";
import { buybackLamports, isPlaceholder, isPricingTier, readEnv, SOL_MINT, TIERS } from "../lib/env.js";
import { loadAgentKeypair, signAndBroadcastVersioned } from "../lib/solana.js";

export const webhookRouter = Router();

function webhookAuthorized(headerSecret: string | undefined, demo: boolean): boolean {
  if (process.env.SANJI_DISABLE_DEMO === "true") {
    demo = false;
  }
  if (demo) return true;
  const expected = readEnv("WEBHOOK_SECRET");
  if (isPlaceholder(expected)) return true;
  return Boolean(headerSecret && headerSecret === expected);
}

webhookRouter.post(
  "/payment-confirmed",
  asyncHandler(async (req, res) => {
    const authorized = webhookAuthorized(
      req.header("x-webhook-secret")?.trim(),
      req.header("x-demo-simulation") === "true",
    );
    if (!authorized) {
      res.status(401).json({ error: "Webhook secret rejected." });
      return;
    }

    const slug = typeof req.body?.slug === "string" ? req.body.slug.trim() : "";
    const tierName = req.body?.tier;
    const amountUsd = req.body?.amountUsd;
    if (!slug || !isPricingTier(tierName) || typeof amountUsd !== "number") {
      res.status(400).json({
        error: "Expected { slug, tier: 'SANJI_EXPRESS_290' | 'SANJI_CORE_1200', amountUsd }.",
      });
      return;
    }

    const tier = TIERS[tierName];
    if (amountUsd !== tier.amountUsd) {
      res.status(400).json({
        error: `amountUsd for ${tierName} must be ${tier.amountUsd}.`,
      });
      return;
    }

    const lead = await getLeadBySlug(slug);
    if (!lead) {
      res.status(404).json({ error: `No restaurant found for slug ${slug}.` });
      return;
    }

    const lamports = buybackLamports(tier.buybackSol);
    const mint = readEnv("SANJI_TOKEN_MINT");
    const agent = loadAgentKeypair();
    let buybackTxSignature = `simulated_${randomUUID()}`;
    let solscanUrl = "";
    let mode: "live" | "simulated" = "simulated";
    let detail =
      "Buyback path is armed. Set SANJI_AGENT_PRIVATE_KEY and SANJI_TOKEN_MINT to broadcast the SOL to SANJI swap.";

    if (agent && !isPlaceholder(mint)) {
      try {
        const swap = await executeSwap({
          inputMint: SOL_MINT,
          outputMint: mint,
          amountLamports: lamports,
          userPublicKey: agent.publicKey.toBase58(),
        });
        buybackTxSignature = await signAndBroadcastVersioned(swap.swapTransaction);
        solscanUrl = `https://solscan.io/tx/${buybackTxSignature}`;
        mode = "live";
        detail = `Broadcast ${tier.buybackSol} SOL buyback (20% of the ${tier.label} sale) via ClawPump ${swap.provider}.`;
        console.log(`[SOLANA] ${detail} ${solscanUrl}`);
      } catch (error) {
        detail = error instanceof Error ? error.message : "Buyback broadcast failed.";
        buybackTxSignature = `unbroadcast_${randomUUID()}`;
        console.error(`[SOLANA] Buyback not broadcast: ${detail}`);
      }
    } else {
      console.log(`[SOLANA] Simulated ${tier.buybackSol} SOL buyback for ${lead.slug}. ${detail}`);
    }

    const previewBase = readEnv("PREVIEW_ENGINE_URL", "http://localhost:3000");
    const bounty = await createCommunityBounty({
      slug: lead.slug,
      restaurantName: lead.name,
      neighborhood: lead.neighborhood,
      rewardUsdc: tier.bountyUsdc,
      tierLabel: tier.label,
      previewUrl: `${previewBase}/preview/${lead.slug}`,
    });
    console.log(`[BOUNTY] ${bounty.bountyId} · ${tier.bountyUsdc} USDC · ${bounty.detail}`);

    const updated = await markLeadPaid({
      slug: lead.slug,
      status: tier.status,
      ...(mode === "live" ? { paymentSignature: buybackTxSignature } : {}),
    });
    if (!updated) {
      res.status(404).json({ error: `Could not update ${slug}.` });
      return;
    }

    await appendActivity({
      kind: "buyback",
      slug: lead.slug,
      signature: buybackTxSignature,
      message: `${mode === "live" ? "Live" : "Simulated"} buyback ${tier.buybackSol} SOL for ${lead.name}. ${detail}`,
    });
    await appendActivity({
      kind: "bounty",
      slug: lead.slug,
      signature: bounty.bountyId,
      message: `Community bounty ${bounty.bountyId}: $${tier.bountyUsdc} USDC to connect the domain and finish the menu JSON within 24h.`,
    });

    res.json({
      buybackTxSignature,
      solscanUrl,
      bountyId: bounty.bountyId,
      updatedStatus: updated.status,
      mode,
      tier: tierName,
      slug: updated.slug,
      buybackSol: tier.buybackSol,
      bountyUsdc: tier.bountyUsdc,
      detail,
      bountyDetail: bounty.detail,
    });
  }),
);
