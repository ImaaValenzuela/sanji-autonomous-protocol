import type { LeadLanguage, Region, RestaurantLead, ScoutFilter } from "./types.js";

export const SERVED_REGIONS: readonly Region[] = ["NA", "EU", "LATAM"];
export const MIN_REVIEW_COUNT = 150;
export const MIN_GOOGLE_RATING = 4.3;
export const MIN_HOT_LEAD_SCORE = 80;

export function isRegion(value: string): value is Region {
  return value === "NA" || value === "EU" || value === "LATAM";
}

export function isLeadLanguage(value: string): value is LeadLanguage {
  return value === "en" || value === "es" || value === "pt" || value === "fr" || value === "it";
}

export function qualifiesAsHotLead(
  lead: Pick<RestaurantLead, "region" | "review_count" | "google_rating" | "hot_lead_score">,
): boolean {
  return (
    isRegion(lead.region) &&
    lead.review_count >= MIN_REVIEW_COUNT &&
    lead.google_rating >= MIN_GOOGLE_RATING &&
    lead.hot_lead_score >= MIN_HOT_LEAD_SCORE &&
    lead.hot_lead_score <= 100
  );
}

export function matchesScout(lead: RestaurantLead, filter: ScoutFilter = {}): boolean {
  if (lead.status !== "PENDING_OUTREACH") return false;
  if (!qualifiesAsHotLead(lead)) return false;
  if (filter.region && lead.region !== filter.region) return false;
  if (filter.city && lead.city.toLowerCase() !== filter.city.toLowerCase()) return false;
  if (filter.country && lead.country.toLowerCase() !== filter.country.toLowerCase()) return false;
  if (filter.language && lead.language !== filter.language) return false;
  return true;
}
