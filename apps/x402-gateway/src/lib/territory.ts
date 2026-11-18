import {
  isLeadLanguage,
  isRegion,
  SERVED_REGIONS,
  type Region,
  type ScoutFilter,
} from "@sanji/database";

const ASIA_AFRICA_REGIONS = new Set(["ASIA", "AFRICA", "AF", "APAC", "MENA", "MEA"]);

const ASIA_AFRICA_PLACES = new Set([
  "china",
  "japan",
  "korea",
  "south korea",
  "north korea",
  "india",
  "thailand",
  "vietnam",
  "singapore",
  "indonesia",
  "malaysia",
  "philippines",
  "taiwan",
  "hong kong",
  "uae",
  "united arab emirates",
  "saudi arabia",
  "qatar",
  "israel",
  "south africa",
  "nigeria",
  "kenya",
  "egypt",
  "morocco",
  "ghana",
  "ethiopia",
  "tokyo",
  "osaka",
  "kyoto",
  "seoul",
  "busan",
  "beijing",
  "shanghai",
  "shenzhen",
  "bangkok",
  "dubai",
  "abu dhabi",
  "doha",
  "mumbai",
  "delhi",
  "bangalore",
  "bengaluru",
  "jakarta",
  "bali",
  "kuala lumpur",
  "manila",
  "taipei",
  "hanoi",
  "ho chi minh",
  "cape town",
  "johannesburg",
  "lagos",
  "nairobi",
  "cairo",
  "casablanca",
  "marrakech",
  "accra",
  "addis ababa",
]);

const CITY_ALIASES: Record<string, string> = {
  cdmx: "Mexico City",
  df: "Mexico City",
  "ciudad de mexico": "Mexico City",
  wynwood: "Miami",
  salamanca: "Madrid",
  polanco: "Mexico City",
  soho: "London",
  palermo: "Buenos Aires",
  caba: "Buenos Aires",
};

const COUNTRY_ALIASES: Record<string, string> = {
  us: "United States",
  usa: "United States",
  "united states": "United States",
  "united states of america": "United States",
  uk: "United Kingdom",
  "united kingdom": "United Kingdom",
  britain: "United Kingdom",
  england: "United Kingdom",
  spain: "Spain",
  espana: "Spain",
  mexico: "Mexico",
  argentina: "Argentina",
};

export interface TerritoryOk {
  ok: true;
  filter: ScoutFilter;
}

export interface TerritoryRejected {
  ok: false;
  error: string;
  acceptedRegions: readonly Region[];
}

function fold(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "");
}

function queryString(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

export function assessTerritory(query: Record<string, unknown>): TerritoryOk | TerritoryRejected {
  const regionRaw = queryString(query.region)?.toUpperCase();
  const countryRaw = queryString(query.country);
  const cityRaw = queryString(query.city) ?? queryString(query.neighborhood);
  const languageRaw = queryString(query.language)?.toLowerCase();

  if (regionRaw && ASIA_AFRICA_REGIONS.has(regionRaw)) {
    return rejected("Sanji scouts NA, EU, and LATAM only. Asia and Africa are rejected.");
  }
  if (regionRaw && !isRegion(regionRaw)) {
    return rejected("region must be NA, EU, or LATAM.");
  }

  const countryKey = countryRaw ? fold(countryRaw) : undefined;
  const cityKey = cityRaw ? fold(cityRaw) : undefined;
  if ((countryKey && ASIA_AFRICA_PLACES.has(countryKey)) || (cityKey && ASIA_AFRICA_PLACES.has(cityKey))) {
    return rejected("Sanji scouts NA, EU, and LATAM only. Asia and Africa are rejected.");
  }

  if (languageRaw && !isLeadLanguage(languageRaw)) {
    return rejected("language must be en, es, pt, fr, or it.");
  }

  const filter: ScoutFilter = {};
  if (regionRaw && isRegion(regionRaw)) filter.region = regionRaw;
  if (cityKey) filter.city = CITY_ALIASES[cityKey] ?? titlePlace(cityRaw as string);
  if (countryKey) filter.country = COUNTRY_ALIASES[countryKey] ?? titlePlace(countryRaw as string);
  if (languageRaw && isLeadLanguage(languageRaw)) filter.language = languageRaw;
  return { ok: true, filter };
}

function rejected(error: string): TerritoryRejected {
  return { ok: false, error, acceptedRegions: SERVED_REGIONS };
}

function titlePlace(value: string): string {
  return value
    .trim()
    .split(/\s+/)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}
