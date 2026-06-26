interface McpToolDefinition {
  name: string;
  description: string;
  inputSchema: {
    type: 'object';
    properties: Record<string, unknown>;
    required?: string[];
  };
}

interface McpToolExport {
  tools: McpToolDefinition[];
  callTool: (name: string, args: Record<string, unknown>) => Promise<unknown>;
  meter?: { credits: number };
  cost?: Record<string, unknown>;
  provider?: string;
}

/**
 * CountryStateCity MCP — wraps CountryStateCity API (api.countrystatecity.in/v1)
 *
 * BYO key: requires an API key from https://countrystatecity.in/
 * Passed via _apiKey parameter.
 *
 * Tools:
 * - list_countries: list all countries with codes, capitals, and currencies
 * - get_states: get all states/provinces for a country
 * - get_cities: get cities for a country or state
 */


const BASE = 'https://api.countrystatecity.in/v1';

// ── Helpers ───────────────────────────────────────────────────────────

function extractKey(args: Record<string, unknown>): string {
  const key = args._apiKey as string;
  delete args._apiKey;
  if (!key) throw new Error('CountryStateCity API key required. Get one at https://countrystatecity.in/ and pass via _apiKey.');
  return key;
}

async function cscGet(apiKey: string, path: string): Promise<unknown> {
  const res = await fetch(`${BASE}${path}`, {
    headers: {
      'X-CSCAPI-KEY': apiKey,
      Accept: 'application/json',
    },
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`CountryStateCity API error (${res.status}): ${text}`);
  }
  return res.json();
}

// ── Tool definitions ──────────────────────────────────────────────────

const tools: McpToolExport['tools'] = [
  {
    name: 'list_countries',
    description:
      'List all countries with ISO codes, capitals, phone codes, currencies, and regions. Returns ~250 countries. Useful for building dropdowns or validating country data.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        _apiKey: { type: 'string', description: 'CountryStateCity API key' },
      },
      required: ['_apiKey'],
    },
  },
  {
    name: 'get_states',
    description:
      'Get all states or provinces for a country by ISO2 code (e.g., "US", "IN", "BR"). Returns state names, codes, and types.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        _apiKey: { type: 'string', description: 'CountryStateCity API key' },
        country_code: {
          type: 'string',
          description: 'ISO2 country code (e.g., "US", "CA", "GB", "DE")',
        },
      },
      required: ['_apiKey', 'country_code'],
    },
  },
  {
    name: 'get_cities',
    description:
      'Get cities for a country, optionally filtered by state. Pass country_code (e.g., "US") and optionally state_code (e.g., "CA") to narrow results.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        _apiKey: { type: 'string', description: 'CountryStateCity API key' },
        country_code: {
          type: 'string',
          description: 'ISO2 country code (e.g., "US", "IN")',
        },
        state_code: {
          type: 'string',
          description: 'State/province code to filter by (e.g., "CA", "NY", "TX")',
        },
      },
      required: ['_apiKey', 'country_code'],
    },
  },
];

// ── callTool dispatcher ───────────────────────────────────────────────

async function callTool(name: string, args: Record<string, unknown>): Promise<unknown> {
  const key = extractKey(args);

  switch (name) {
    case 'list_countries':
      return listCountries(key);
    case 'get_states':
      return getStates(key, args.country_code as string);
    case 'get_cities':
      return getCities(key, args.country_code as string, args.state_code as string | undefined);
    default:
      throw new Error(`Unknown tool: ${name}`);
  }
}

// ── Tool implementations ─────────────────────────────────────────────

async function listCountries(apiKey: string) {
  const countries = (await cscGet(apiKey, '/countries')) as Array<{
    id: number;
    name: string;
    iso2: string;
    iso3: string;
    phone_code: string;
    capital: string;
    currency: string;
    currency_symbol: string;
    region: string;
    subregion: string;
  }>;

  return {
    count: countries.length,
    countries: countries.map((c) => ({
      name: c.name,
      iso2: c.iso2,
      iso3: c.iso3,
      capital: c.capital ?? null,
      phone_code: c.phone_code ?? null,
      currency: c.currency ?? null,
      currency_symbol: c.currency_symbol ?? null,
      region: c.region ?? null,
      subregion: c.subregion ?? null,
    })),
  };
}

async function getStates(apiKey: string, countryCode: string) {
  const states = (await cscGet(apiKey, `/countries/${countryCode}/states`)) as Array<{
    id: number;
    name: string;
    iso2: string;
    type: string;
  }>;

  return {
    country_code: countryCode,
    count: states.length,
    states: states.map((s) => ({
      name: s.name,
      code: s.iso2,
      type: s.type ?? null,
    })),
  };
}

async function getCities(apiKey: string, countryCode: string, stateCode?: string) {
  const path = stateCode
    ? `/countries/${countryCode}/states/${stateCode}/cities`
    : `/countries/${countryCode}/cities`;

  const cities = (await cscGet(apiKey, path)) as Array<{
    id: number;
    name: string;
    latitude: string;
    longitude: string;
  }>;

  return {
    country_code: countryCode,
    state_code: stateCode ?? null,
    count: cities.length,
    cities: cities.map((c) => ({
      name: c.name,
      latitude: c.latitude ?? null,
      longitude: c.longitude ?? null,
    })),
  };
}

export default { tools, callTool, meter: { credits: 5 } } satisfies McpToolExport;
