# Module Specification (v1)

The `module-spec` package defines a lightweight contract that every MiniModules feature module must follow. It focuses on the metadata needed to register a module, expose its capabilities, and describe configurable behaviour via JSON Schema.

## ModuleMeta

```ts
import type { ModuleMeta } from '@minimodules/libs/module-spec'
```

| Field | Type | Description |
| --- | --- | --- |
| `id` | `string` | Stable, lowercase identifier used across services and configuration files (e.g. `ordering`). |
| `name` | `string` | Human readable display name, shown in dashboards or tenant configuration UIs. |
| `routes` | `string[]` | List of route IDs or paths that the module contributes to the application shell. Keep entries unique. |
| `configSchema` | `JSONSchema7` | JSON Schema describing tenant-configurable options for the module. Consumers can use any JSON Schema validator to enforce the schema. |
| `capabilities` | `string[]` | Declarative list of features the module enables (e.g. `order:create`). Useful for capability-based access checks. |

## Validation Helper

```ts
import { validateModuleMeta } from '@minimodules/libs/module-spec'
```

`validateModuleMeta(meta)` is a type guard that returns `true` when the supplied value matches the `ModuleMeta` contract. When it returns `true`, TypeScript narrows the type of `meta` to `ModuleMeta`, allowing safe access to the fields.

```ts
import { validateModuleMeta } from '@minimodules/libs/module-spec'

const demoMeta = {
  id: 'ordering',
  name: 'Ordering',
  routes: ['ordering:list'],
  configSchema: {
    type: 'object',
    properties: {
      enableTips: { type: 'boolean', default: true }
    },
    additionalProperties: false
  },
  capabilities: ['order:create', 'order:view']
}

if (!validateModuleMeta(demoMeta)) {
  throw new Error('Invalid module meta definition')
}
```

The helper performs structural checks only (string arrays, non-empty identifiers, plain-object JSON Schema). Consumers remain free to perform deeper validation (e.g. using Ajv) if required.

## Extending The Spec

New spec fields should be added to `ModuleMeta` together with an accompanying update to `validateModuleMeta` so both compile-time and runtime checks stay aligned. Document every new field in this file to keep downstream teams informed.
