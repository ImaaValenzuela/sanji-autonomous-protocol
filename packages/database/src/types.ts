export type LeadStatus =
  | "PENDING_OUTREACH"
  | "CONTACTED"
  | "PAID_EXPRESS"
  | "PAID_CORE"
  | "DEPLOYED";

export type Region = "NA" | "EU" | "LATAM";

export type LeadLanguage = "en" | "es" | "pt" | "fr" | "it";

export type PriceTier = "$$" | "$$$" | "$$$$";

export interface MenuHighlight {
  name: string;
  description: string;
  price_ars: string;
}

export interface RestaurantLead {
  id: string;
  slug: string;
  name: string;
  city: string;
  country: string;
  region: Region;
  language: LeadLanguage;
  price_tier: PriceTier;
  owner_name: string;
  owner_phone: string;
  ig_handle: string;
  specialty: string;
  google_rating: number;
  review_count: number;
  hot_lead_score: number;
  pain_point: string;
  hero_image_url: string;
  menu_highlights: MenuHighlight[];
  status: LeadStatus;
  last_tx_signature?: string;
}

export type ActivityKind = "x402" | "buyback" | "bounty" | "outreach" | "preview";

export interface ActivityEvent {
  id: string;
  at: string;
  kind: ActivityKind;
  message: string;
  slug?: string;
  signature?: string;
}

export interface CommandSnapshot {
  leads: RestaurantLead[];
  activity: ActivityEvent[];
  source: "supabase" | "demo";
}

export type PaidStatus = Extract<LeadStatus, "PAID_EXPRESS" | "PAID_CORE">;

export interface ScoutFilter {
  region?: Region;
  city?: string;
  country?: string;
  language?: LeadLanguage;
}
