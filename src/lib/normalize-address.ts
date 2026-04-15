/**
 * Map common US street-type abbreviations → full word (lowercase).
 * Only the street-type token is expanded (see expandStreetSuffix), not random words.
 */
const STREET_SUFFIX_NORMALIZATIONS: Record<string, string> = {
  rd: "road",
  rds: "roads",
  st: "street",
  sts: "streets",
  ave: "avenue",
  av: "avenue",
  blvd: "boulevard",
  dr: "drive",
  drs: "drives",
  ln: "lane",
  ct: "court",
  pl: "place",
  cir: "circle",
  ter: "terrace",
  terr: "terrace",
  pkwy: "parkway",
  hwy: "highway",
  tpke: "turnpike",
  sq: "square",
  aly: "alley",
  way: "way",
  path: "path",
  cres: "crescent",
  loop: "loop",
  trl: "trail",
  run: "run",
  xing: "crossing",
  br: "bridge",
  pt: "point",
  pike: "pike",
};

const UNIT_LEADERS = new Set([
  "apt",
  "apartment",
  "unit",
  "ste",
  "suite",
  "#",
  "bldg",
  "building",
  "fl",
  "floor",
]);

function stripTrailingPeriod(token: string): string {
  return token.replace(/\.+$/g, "");
}

/**
 * Lowercase tokens, expand trailing street type (after optional unit suffix).
 */
function expandStreetSuffix(rawTokens: string[]): string[] {
  const t = rawTokens.map((raw) => stripTrailingPeriod(raw).toLowerCase());
  if (t.length === 0) return t;

  let i = t.length - 1;

  if (/^\d+[a-z]?$/i.test(t[i]!)) {
    i -= 1;
  }

  while (i >= 0) {
    const tok = t[i]!;
    if (UNIT_LEADERS.has(tok)) {
      i -= 1;
      if (i >= 0 && /^\d+[a-z]?$/i.test(t[i]!)) {
        i -= 1;
      }
      continue;
    }
    break;
  }

  if (i >= 0) {
    const key = t[i]!;
    const expanded = STREET_SUFFIX_NORMALIZATIONS[key];
    if (expanded) {
      t[i] = expanded;
    }
  }

  return t;
}

function normalizeStreetLineTokens(line: string): string[] {
  const trimmed = line.trim().replace(/\s+/g, " ");
  if (!trimmed) return [];
  return trimmed.split(" ").filter(Boolean);
}

function tokenForUnitCheck(token: string): string {
  return stripTrailingPeriod(token).replace(/,$/g, "").toLowerCase();
}

/**
 * Remove unit/suite/floor suffixes from line 1 before geocoding.
 * Example: "55 Broadway Apt 2" -> "55 Broadway"
 */
export function stripUnitFromAddressLine1(line: string): string {
  const tokens = normalizeStreetLineTokens(line);
  if (tokens.length === 0) return "";

  const unitLeaderPattern =
    /^(apt|apartment|unit|ste|suite|bldg|building|fl|floor)[a-z0-9-]*$/i;

  let cutIndex = -1;
  for (let i = 0; i < tokens.length; i += 1) {
    const normalized = tokenForUnitCheck(tokens[i]!);
    if (
      normalized.startsWith("#") ||
      UNIT_LEADERS.has(normalized) ||
      unitLeaderPattern.test(normalized)
    ) {
      cutIndex = i;
      break;
    }
  }

  const root = (cutIndex >= 0 ? tokens.slice(0, cutIndex) : tokens).join(" ");
  return root.trim().replace(/\s+/g, " ");
}

/** Lowercase, expanded suffixes, single spaces - used only for matching keys. */
function normalizeStreetLineForKey(line: string): string {
  const tokens = normalizeStreetLineTokens(line);
  const expanded = expandStreetSuffix(tokens);
  return expanded.join(" ").toLowerCase();
}

/** Title-case each word for stored/display address line 1. */
export function formatAddressLine1ForDisplay(line: string): string {
  const tokens = normalizeStreetLineTokens(line);
  const expanded = expandStreetSuffix(tokens);
  return expanded
    .map((w) => {
      if (!w) return w;
      if (w.length === 1) return w.toUpperCase();
      return w.charAt(0).toUpperCase() + w.slice(1).toLowerCase();
    })
    .join(" ");
}

/** Stable key for property upsert / duplicate checks (matches review POST). */
export function normalizePropertyAddress(
  address: string,
  city: string,
  state: string,
): string {
  const line = normalizeStreetLineForKey(address);
  const c = city.trim().toLowerCase().replace(/\s+/g, " ");
  const st = state.trim().toLowerCase();
  return `${line}, ${c}, ${st}`.replace(/\s+/g, " ");
}

/** Canonical geocoder input string (unit-stripped). */
export function geocodeQueryAddress(
  address: string,
  city: string,
  state: string,
  postalCode?: string | null,
): string {
  const line = stripUnitFromAddressLine1(address);
  const cityPart = city.trim().replace(/\s+/g, " ");
  const statePart = state.trim().replace(/\s+/g, " ");
  const postalCodePart = (postalCode ?? "").trim();
  return [line, cityPart, statePart, postalCodePart].filter(Boolean).join(", ");
}
