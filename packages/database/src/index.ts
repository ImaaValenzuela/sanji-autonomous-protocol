export type {
  ActivityEvent,
  ActivityKind,
  CommandSnapshot,
  LeadStatus,
  MenuHighlight,
  Neighborhood,
  PaidStatus,
  RestaurantLead,
} from "./types.js";
export { SEED_LEADS } from "./seed.js";
export {
  appendActivity,
  getCommandSnapshot,
  getLeadBySlug,
  getSupabaseAdmin,
  listActivity,
  listLeads,
  markLeadPaid,
  resetDemoStore,
  supabaseAdmin,
  takeNextPendingLead,
} from "./client.js";
