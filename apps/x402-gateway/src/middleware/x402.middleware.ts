import type { NextFunction, Request, Response } from "express";
import { verifyTreasuryPayment, treasuryAddress } from "../lib/solana.js";
import { X402_LAMPORTS } from "../lib/env.js";

export interface X402Challenge {
  protocol: "x402";
  version: "1.0";
  network: "solana-mainnet";
  recipient: string;
  amountLamports: number;
  memo: string;
  skill: "sanji_caba_lead_enricher";
  message: string;
  reason?: string;
}

declare global {
  namespace Express {
    interface Request {
      paymentSignature?: string;
      paymentSimulated?: boolean;
    }
  }
}

export function buildX402Challenge(reason?: string): X402Challenge {
  const challenge: X402Challenge = {
    protocol: "x402",
    version: "1.0",
    network: "solana-mainnet",
    recipient: treasuryAddress(),
    amountLamports: X402_LAMPORTS,
    memo: `SANJI_CABA_LEAD_${Date.now()}`,
    skill: "sanji_caba_lead_enricher",
    message:
      "Payment Required: Use ClawPump x402_pay tool (0.0005 SOL) to unlock enriched CABA restaurant owner lead.",
  };
  if (reason) challenge.reason = reason;
  return challenge;
}

export async function requireX402Payment(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  if (req.header("x-demo-simulation") === "true") {
    req.paymentSignature = req.header("x-payment-signature")?.trim() || `demo_${Date.now()}`;
    req.paymentSimulated = true;
    next();
    return;
  }

  const signature = req.header("x-payment-signature")?.trim();
  if (!signature) {
    res.status(402).json(buildX402Challenge());
    return;
  }

  const verified = await verifyTreasuryPayment(signature);
  if (!verified.ok) {
    res.status(402).json(buildX402Challenge(verified.reason));
    return;
  }

  req.paymentSignature = signature;
  req.paymentSimulated = false;
  next();
}
