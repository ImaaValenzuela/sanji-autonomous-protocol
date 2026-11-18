import { randomUUID } from "node:crypto";
import { mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { matchesScout, MIN_GOOGLE_RATING, MIN_HOT_LEAD_SCORE, MIN_REVIEW_COUNT } from "./qualify.js";
import { cloneSeed } from "./seed.js";
import type {
  ActivityEvent,
  ActivityKind,
  CommandSnapshot,
  LeadLanguage,
  LeadStatus,
  MenuHighlight,
  PaidStatus,
  PriceTier,
  Region,
  RestaurantLead,
  ScoutFilter,
} from "./types.js";

const TABLE = "hospitality_leads";
const SCHEMA_VERSION = 2;

const LEAD_STATUSES: readonly LeadStatus[] = [
  "PENDING_OUTREACH",
  "CONTACTED",
  "PAID_EXPRESS",
  "PAID_CORE",
  "DEPLOYED",
];

const ACTIVITY_LIMIT = 80;

interface DemoFile {
  schemaVersion: number;
  leads: RestaurantLead[];
  activity: ActivityEvent[];
}

let supabaseSingleton: SupabaseClient | null = null;
let supabaseAttempted = false;

function supabaseConfig(): { url: string; key: string } | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() ?? "";
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim() ?? "";
  if (!url || !key) return null;
  if (url.includes("your-project.supabase.co")) return null;
  if (key === "eyJ..." || key.length < 40) return null;
  return { url, key };
}

/**
 * Singleton Supabase admin client.
 * Stays null in zero-config demo mode so the in-memory/file store can serve leads.
 */
export function getSupabaseAdmin(): SupabaseClient | null {
  if (supabaseSingleton) return supabaseSingleton;
  if (supabaseAttempted) return null;
  supabaseAttempted = true;
  const config = supabaseConfig();
  if (!config) return null;
  supabaseSingleton = createClient(config.url, config.key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return supabaseSingleton;
}

export const supabaseAdmin: { readonly client: SupabaseClient | null } = {
  get client() {
    return getSupabaseAdmin();
  },
};

function storePath(): string {
  const override = process.env.SANJI_DEMO_STORE_PATH?.trim();
  if (override) return override;
  const moduleDir = path.dirname(fileURLToPath(import.meta.url));
  return path.resolve(moduleDir, "../data/runtime-leads.json");
}

function emptyDemo(): DemoFile {
  return { schemaVersion: SCHEMA_VERSION, leads: cloneSeed(), activity: [] };
}

function readDemo(): DemoFile {
  const file = storePath();
  try {
    const parsed = JSON.parse(readFileSync(file, "utf8")) as Partial<DemoFile>;
    if (
      parsed.schemaVersion !== SCHEMA_VERSION ||
      !Array.isArray(parsed.leads) ||
      parsed.leads.length === 0
    ) {
      const fresh = emptyDemo();
      if (Array.isArray(parsed.activity)) fresh.activity = parsed.activity.map(normalizeActivity);
      writeDemo(fresh);
      return fresh;
    }
    return {
      schemaVersion: SCHEMA_VERSION,
      leads: parsed.leads.map(normalizeLead),
      activity: Array.isArray(parsed.activity) ? parsed.activity.map(normalizeActivity) : [],
    };
  } catch {
    const fresh = emptyDemo();
    writeDemo(fresh);
    return fresh;
  }
}

function writeDemo(state: DemoFile): void {
  const file = storePath();
  mkdirSync(path.dirname(file), { recursive: true });
  const temp = `${file}.${process.pid}.tmp`;
  writeFileSync(temp, JSON.stringify(state, null, 2));
  renameSync(temp, file);
}

function isLeadStatus(value: unknown): value is LeadStatus {
  return typeof value === "string" && (LEAD_STATUSES as readonly string[]).includes(value);
}

function normalizeMenu(value: unknown): MenuHighlight[] {
  if (!Array.isArray(value)) return [];
  const items: MenuHighlight[] = [];
  for (const entry of value) {
    if (!entry || typeof entry !== "object") continue;
    const record = entry as Record<string, unknown>;
    if (typeof record.name !== "string" || typeof record.description !== "string") continue;
    items.push({
      name: record.name,
      description: record.description,
      price_ars: typeof record.price_ars === "string" ? record.price_ars : "",
    });
  }
  return items;
}

function asRegion(value: unknown): Region {
  return value === "NA" || value === "EU" || value === "LATAM" ? value : "LATAM";
}

function asLanguage(value: unknown): LeadLanguage {
  return value === "en" || value === "es" || value === "pt" || value === "fr" || value === "it"
    ? value
    : "en";
}

function asPriceTier(value: unknown): PriceTier {
  return value === "$$" || value === "$$$" || value === "$$$$" ? value : "$$$";
}

function asBoundedScore(value: unknown): number {
  const score = Number(value ?? 0);
  if (!Number.isFinite(score)) return 0;
  return Math.max(0, Math.min(100, Math.round(score)));
}

function normalizeLead(value: unknown): RestaurantLead {
  const record = (value ?? {}) as Record<string, unknown>;
  const signature = record.last_tx_signature;
  const rating = Number(record.google_rating ?? 0);
  const reviews = Number(record.review_count ?? 0);
  const lead: RestaurantLead = {
    id: String(record.id ?? randomUUID()),
    slug: String(record.slug ?? ""),
    name: String(record.name ?? "Restaurant"),
    city: String(record.city ?? ""),
    country: String(record.country ?? ""),
    region: asRegion(record.region),
    language: asLanguage(record.language),
    price_tier: asPriceTier(record.price_tier),
    owner_name: String(record.owner_name ?? ""),
    owner_phone: String(record.owner_phone ?? ""),
    ig_handle: String(record.ig_handle ?? ""),
    specialty: String(record.specialty ?? ""),
    google_rating: Number.isFinite(rating) ? rating : 0,
    review_count: Number.isFinite(reviews) ? Math.max(0, Math.round(reviews)) : 0,
    hot_lead_score: asBoundedScore(record.hot_lead_score),
    pain_point: String(record.pain_point ?? ""),
    hero_image_url: String(record.hero_image_url ?? ""),
    menu_highlights: normalizeMenu(record.menu_highlights),
    status: isLeadStatus(record.status) ? record.status : "PENDING_OUTREACH",
  };
  if (typeof signature === "string" && signature.length > 0) {
    lead.last_tx_signature = signature;
  }
  return lead;
}

function normalizeActivity(value: unknown): ActivityEvent {
  const record = (value ?? {}) as Record<string, unknown>;
  const event: ActivityEvent = {
    id: String(record.id ?? randomUUID()),
    at: String(record.at ?? new Date().toISOString()),
    kind: isActivityKind(record.kind) ? record.kind : "outreach",
    message: String(record.message ?? ""),
  };
  if (typeof record.slug === "string") event.slug = record.slug;
  if (typeof record.signature === "string") event.signature = record.signature;
  return event;
}

function isActivityKind(value: unknown): value is ActivityKind {
  return (
    value === "x402" ||
    value === "buyback" ||
    value === "bounty" ||
    value === "outreach" ||
    value === "preview"
  );
}

let warnedSupabase = false;

function warnSupabase(message: string): void {
  if (warnedSupabase) return;
  warnedSupabase = true;
  console.warn(`[sanji/database] ${message} Falling back to the global demo store.`);
}

async function listFromSupabase(): Promise<RestaurantLead[] | null> {
  const client = getSupabaseAdmin();
  if (!client) return null;
  const { data, error } = await client
    .from(TABLE)
    .select("*")
    .order("name", { ascending: true });
  if (error) {
    warnSupabase(error.message);
    return null;
  }
  return (data ?? []).map(normalizeLead);
}

export async function listLeads(): Promise<RestaurantLead[]> {
  const remote = await listFromSupabase();
  if (remote) return remote;
  return readDemo().leads;
}

export async function getLeadBySlug(slug: string): Promise<RestaurantLead | null> {
  const client = getSupabaseAdmin();
  if (client) {
    const { data, error } = await client
      .from(TABLE)
      .select("*")
      .eq("slug", slug)
      .maybeSingle();
    if (error) {
      warnSupabase(error.message);
    } else if (data) {
      return normalizeLead(data);
    } else {
      return null;
    }
  }
  return readDemo().leads.find((lead) => lead.slug === slug) ?? null;
}

function scoutFilter(input: {
  region?: Region;
  city?: string;
  country?: string;
  language?: LeadLanguage;
}): ScoutFilter {
  const filter: ScoutFilter = {};
  if (input.region) filter.region = input.region;
  if (input.city) filter.city = input.city;
  if (input.country) filter.country = input.country;
  if (input.language) filter.language = input.language;
  return filter;
}

export async function takeNextPendingLead(input: {
  paymentSignature: string;
  region?: Region;
  city?: string;
  country?: string;
  language?: LeadLanguage;
}): Promise<RestaurantLead | null> {
  const filter = scoutFilter(input);
  const client = getSupabaseAdmin();
  if (client) {
    let query = client
      .from(TABLE)
      .select("*")
      .eq("status", "PENDING_OUTREACH")
      .in("region", ["NA", "EU", "LATAM"])
      .gte("review_count", MIN_REVIEW_COUNT)
      .gte("google_rating", MIN_GOOGLE_RATING)
      .gte("hot_lead_score", MIN_HOT_LEAD_SCORE)
      .order("hot_lead_score", { ascending: false })
      .limit(1);
    if (filter.region) query = query.eq("region", filter.region);
    if (filter.city) query = query.ilike("city", filter.city);
    if (filter.country) query = query.ilike("country", filter.country);
    if (filter.language) query = query.eq("language", filter.language);
    const { data, error } = await query;
    if (error) {
      warnSupabase(error.message);
    } else {
      const row = data?.[0];
      if (!row) return null;
      const current = normalizeLead(row);
      if (!matchesScout(current, filter)) return null;
      const { data: updated, error: updateError } = await client
        .from(TABLE)
        .update({
          status: "CONTACTED",
          last_tx_signature: input.paymentSignature,
        })
        .eq("id", current.id)
        .eq("status", "PENDING_OUTREACH")
        .select("*")
        .maybeSingle();
      if (updateError) {
        warnSupabase(updateError.message);
      } else if (updated) {
        return normalizeLead(updated);
      } else {
        return null;
      }
    }
  }

  const state = readDemo();
  const ranked = state.leads
    .map((lead, index) => ({ lead, index }))
    .filter(({ lead }) => matchesScout(lead, filter))
    .sort((left, right) => right.lead.hot_lead_score - left.lead.hot_lead_score);
  const pick = ranked[0];
  if (!pick) return null;
  const next: RestaurantLead = {
    ...pick.lead,
    status: "CONTACTED",
    last_tx_signature: input.paymentSignature,
  };
  state.leads[pick.index] = next;
  writeDemo(state);
  return next;
}

export async function markLeadPaid(input: {
  slug: string;
  status: PaidStatus;
  paymentSignature?: string;
}): Promise<RestaurantLead | null> {
  const client = getSupabaseAdmin();
  if (client) {
    const patch: { status: PaidStatus; last_tx_signature?: string } = { status: input.status };
    if (input.paymentSignature) patch.last_tx_signature = input.paymentSignature;
    const { data, error } = await client
      .from(TABLE)
      .update(patch)
      .eq("slug", input.slug)
      .select("*")
      .maybeSingle();
    if (error) {
      warnSupabase(error.message);
    } else if (data) {
      return normalizeLead(data);
    } else {
      return null;
    }
  }

  const state = readDemo();
  const index = state.leads.findIndex((lead) => lead.slug === input.slug);
  const current = index >= 0 ? state.leads[index] : undefined;
  if (!current) return null;
  const next: RestaurantLead = {
    ...current,
    status: input.status,
  };
  if (input.paymentSignature) next.last_tx_signature = input.paymentSignature;
  state.leads[index] = next;
  writeDemo(state);
  return next;
}

export async function appendActivity(input: {
  kind: ActivityKind;
  message: string;
  slug?: string;
  signature?: string;
}): Promise<ActivityEvent> {
  const event: ActivityEvent = {
    id: randomUUID(),
    at: new Date().toISOString(),
    kind: input.kind,
    message: input.message,
  };
  if (input.slug) event.slug = input.slug;
  if (input.signature) event.signature = input.signature;
  const state = readDemo();
  state.activity = [...state.activity, event].slice(-ACTIVITY_LIMIT);
  writeDemo(state);
  return event;
}

export async function listActivity(): Promise<ActivityEvent[]> {
  return readDemo().activity;
}

export async function getCommandSnapshot(): Promise<CommandSnapshot> {
  const remote = await listFromSupabase();
  return {
    leads: remote ?? readDemo().leads,
    activity: readDemo().activity,
    source: remote ? "supabase" : "demo",
  };
}

export function resetDemoStore(): void {
  writeDemo(emptyDemo());
  supabaseAttempted = false;
  supabaseSingleton = null;
}
