# mcp-country-state-city

CountryStateCity MCP — wraps CountryStateCity API (api.countrystatecity.in/v1)

Part of [Pipeworx](https://pipeworx.io) — an MCP gateway connecting AI agents to 1394+ live data sources.

## Tools

| Tool | Description |
|------|-------------|
| `list_countries` | List all countries with ISO codes, capitals, phone codes, currencies, and regions. Returns ~250 countries. Useful for building dropdowns or validating country data. |
| `get_states` | Get all states or provinces for a country by ISO2 code (e.g., "US", "IN", "BR"). Returns state names, codes, and types. |
| `get_cities` | Get cities for a country, optionally filtered by state. Pass country_code (e.g., "US") and optionally state_code (e.g., "CA") to narrow results. |

## Quick Start

Add to your MCP client (Claude Desktop, Cursor, Windsurf, etc.):

```json
{
  "mcpServers": {
    "country-state-city": {
      "url": "https://gateway.pipeworx.io/country-state-city/mcp"
    }
  }
}
```

Or connect to the full Pipeworx gateway for access to all 1394+ data sources:

```json
{
  "mcpServers": {
    "pipeworx": {
      "url": "https://gateway.pipeworx.io/mcp"
    }
  }
}
```

## Using with ask_pipeworx

Instead of calling tools directly, you can ask questions in plain English:

```
ask_pipeworx({ question: "your question about Country State City data" })
```

The gateway picks the right tool and fills the arguments automatically.

## More

- [Docs and guides](https://pipeworx.io/docs)
- [pipeworx.io](https://pipeworx.io)

## License

MIT
