import Ajv from 'ajv'
import type { JSONSchema7 } from 'json-schema'

export interface TenantTheme {
  primaryColor?: string
  logo?: string
  buttonRadius?: number
}

export type ModuleConfigMap = Record<string, unknown>

export interface TenantConfig {
  tenantId: string
  industry: string
  enabledModules: string[]
  theme?: TenantTheme
  moduleConfigs?: ModuleConfigMap
}

export const tenantConfigSchema: JSONSchema7 = {
  $id: 'https://schemas.minimodules.dev/tenant-config.json',
  type: 'object',
  additionalProperties: false,
  required: ['tenantId', 'industry', 'enabledModules'],
  properties: {
    tenantId: {
      type: 'string',
      minLength: 1,
    },
    industry: {
      type: 'string',
      minLength: 1,
    },
    enabledModules: {
      type: 'array',
      minItems: 1,
      uniqueItems: true,
      items: {
        type: 'string',
        minLength: 1,
      },
    },
    theme: {
      type: 'object',
      additionalProperties: false,
      properties: {
        primaryColor: { type: 'string', minLength: 1 },
        logo: { type: 'string', minLength: 1 },
        buttonRadius: { type: 'number', minimum: 0 },
      },
    },
    moduleConfigs: {
      type: 'object',
      default: {},
      additionalProperties: true,
    },
  },
}

const ajv = new Ajv({ allErrors: true, strict: false, useDefaults: true })
const validate = ajv.compile<TenantConfig>(tenantConfigSchema)

export type TenantConfigValidationResult =
  | { valid: true; value: TenantConfig }
  | { valid: false; errors: string[] }

const formatErrors = (errors: typeof validate.errors): string[] => {
  if (!errors || errors.length === 0) {
    return ['Unknown validation error']
  }

  return errors.map(error => {
    const path = error.instancePath || error.schemaPath
    return `${path} ${error.message ?? 'is invalid'}`.trim()
  })
}

export const validateTenantConfig = (
  json: unknown,
): TenantConfigValidationResult => {
  if (validate(json)) {
    return { valid: true, value: json }
  }

  return { valid: false, errors: formatErrors(validate.errors) }
}
