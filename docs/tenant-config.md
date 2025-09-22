# Tenant Configuration Schema

The tenant configuration describes how a MiniModules deployment is tailored for a specific customer. Back-end services expose this payload, and front-end/automation flows rely on it to discover enabled modules, theme settings, and per-module overrides.

## Shape

```ts
import type { TenantConfig } from '@minimodules/libs/config-schema'
```

| Field | Type | Notes |
| --- | --- | --- |
| `tenantId` | `string` | Unique identifier used across APIs and storage layers. |
| `industry` | `string` | Free-form industry slug (e.g. `restaurant`, `venue`). |
| `enabledModules` | `string[]` | Unique list of module ids that should be bootstrapped for the tenant. |
| `theme` | `{ primaryColor?: string; logo?: string; buttonRadius?: number }` | Optional presentation customisation. `buttonRadius` is expressed in pixels. |
| `moduleConfigs` | `Record<string, unknown>` | Bag of module specific settings keyed by module id. Values are usually validated against the module's own `configSchema`. |

## JSON Schema

A ready-to-use JSON Schema is exported as `tenantConfigSchema` for server-side validation and documentation tooling.

```ts
import { tenantConfigSchema } from '@minimodules/libs/config-schema'
```

## Validation Helper

`validateTenantConfig(json)` runs the schema using Ajv and returns a discriminated union result:

```ts
import { validateTenantConfig } from '@minimodules/libs/config-schema'

const result = validateTenantConfig(payload)
if (!result.valid) {
  console.error(result.errors)
  throw new Error('tenant_config payload is invalid')
}

// result.value is strongly typed as TenantConfig
bootstrapTenant(result.value)
```

## Examples

### Restaurant (餐饮)

```json
{
  "tenantId": "tenant-001",
  "industry": "restaurant",
  "enabledModules": ["ordering", "table-management"],
  "theme": {
    "primaryColor": "#E67E22",
    "logo": "https://cdn.example.com/tenants/tenant-001/logo.png",
    "buttonRadius": 8
  },
  "moduleConfigs": {
    "ordering": {
      "serviceFee": 0.05,
      "supportTips": true
    },
    "table-management": {
      "maxPartySize": 8,
      "enableWaitlist": true
    }
  }
}
```

### Venue (场馆)

```json
{
  "tenantId": "tenant-venue-123",
  "industry": "venue",
  "enabledModules": ["booking", "ticketing"],
  "theme": {
    "primaryColor": "#2C3E50",
    "buttonRadius": 4
  },
  "moduleConfigs": {
    "booking": {
      "openingHours": {
        "mon": ["09:00", "18:00"],
        "tue": ["09:00", "18:00"],
        "sat": ["10:00", "22:00"],
        "sun": ["10:00", "22:00"]
      }
    },
    "ticketing": {
      "supportsQr": true,
      "delivery": ["email", "sms"]
    }
  }
}
```

Both examples pass `validateTenantConfig` and illustrate how per-module payloads differ while the shared envelope stays consistent.
