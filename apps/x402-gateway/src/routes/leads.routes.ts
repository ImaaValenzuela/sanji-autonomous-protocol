import { appendActivity, takeNextPendingLead } from "@sanji/database";
import { Router } from "express";
import { asyncHandler } from "../lib/async-handler.js";
import { registerSanjiSkills } from "../lib/clawpump.js";
import { assessTerritory } from "../lib/territory.js";
import { requireX402Payment } from "../middleware/x402.middleware.js";

export const leadsRouter = Router();

const SCOUT_PATHS = ["/leads/global", "/leads/caba"] as const;

for (const path of SCOUT_PATHS) {
  leadsRouter.get(
    path,
    (req, res, next) => {
      const decision = assessTerritory(req.query as Record<string, unknown>);
      if (!decision.ok) {
        res.status(400).json({
          error: decision.error,
          acceptedRegions: decision.acceptedRegions,
        });
        return;
      }
      res.locals.scoutFilter = decision.filter;
      requireX402Payment(req, res, next).catch(next);
    },
    asyncHandler(async (req, res) => {
      const filter = (res.locals.scoutFilter ?? {}) as {
        region?: "NA" | "EU" | "LATAM";
        city?: string;
        country?: string;
        language?: "en" | "es" | "pt" | "fr" | "it";
      };
      const signature = req.paymentSignature ?? `demo_${Date.now()}`;
      const lead = await takeNextPendingLead({
        paymentSignature: signature,
        ...filter,
      });

      if (!lead) {
        res.status(404).json({
          error: "No hot lead matched. Scout requires NA, EU, or LATAM, 150+ reviews, rating >= 4.3, and score >= 80.",
          filter,
        });
        return;
      }

      await appendActivity({
        kind: "x402",
        slug: lead.slug,
        signature,
        message: `x402 unlocked ${lead.name} (${lead.city}, ${lead.country}, score ${lead.hot_lead_score}). Signature ${signature}.`,
      });

      res.json({
        lead,
        paymentSignature: signature,
        simulated: Boolean(req.paymentSimulated),
        route: path,
      });
    }),
  );
}

leadsRouter.post(
  "/skills/register",
  asyncHandler(async (_req, res) => {
    const registered = await registerSanjiSkills();
    res.json(registered);
  }),
);
