import { appendActivity, takeNextPendingLead } from "@sanji/database";
import { Router } from "express";
import { asyncHandler } from "../lib/async-handler.js";
import { registerSanjiSkills } from "../lib/clawpump.js";
import { requireX402Payment } from "../middleware/x402.middleware.js";

export const leadsRouter = Router();

leadsRouter.get(
  "/leads/caba",
  (req, res, next) => {
    requireX402Payment(req, res, next).catch(next);
  },
  asyncHandler(async (req, res) => {
    const neighborhood =
      typeof req.query.neighborhood === "string" ? req.query.neighborhood : undefined;
    const signature = req.paymentSignature ?? `demo_${Date.now()}`;
    const lead = await takeNextPendingLead({
      paymentSignature: signature,
      ...(neighborhood ? { neighborhood } : {}),
    });

    if (!lead) {
      res.status(404).json({
        error: "No PENDING_OUTREACH restaurant matched that filter.",
        neighborhood: neighborhood ?? null,
      });
      return;
    }

    await appendActivity({
      kind: "x402",
      slug: lead.slug,
      signature,
      message: `x402 unlocked ${lead.name} (${lead.neighborhood}). Signature ${signature}.`,
    });

    res.json({
      lead,
      paymentSignature: signature,
      simulated: Boolean(req.paymentSimulated),
    });
  }),
);

leadsRouter.post(
  "/skills/register",
  asyncHandler(async (_req, res) => {
    const registered = await registerSanjiSkills();
    res.json(registered);
  }),
);
