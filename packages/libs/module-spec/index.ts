import type { JSONSchema7 } from 'json-schema'

type UnknownRecord = Record<string, unknown>

export interface ModuleMeta {
  id: string
  name: string
  routes: string[]
  configSchema: JSONSchema7
  capabilities: string[]
}

const isNonEmptyString = (value: unknown): value is string =>
  typeof value === 'string' && value.trim().length > 0

const isStringArray = (value: unknown): value is string[] =>
  Array.isArray(value) && value.every(isNonEmptyString)

const isPlainObject = (value: unknown): value is UnknownRecord =>
  typeof value === 'object' && value !== null && !Array.isArray(value)

const isJsonSchema7 = (value: unknown): value is JSONSchema7 =>
  isPlainObject(value)

export const validateModuleMeta = (meta: unknown): meta is ModuleMeta => {
  if (!isPlainObject(meta)) {
    return false
  }

  const candidate = meta as UnknownRecord

  if (!isNonEmptyString(candidate.id)) {
    return false
  }

  if (!isNonEmptyString(candidate.name)) {
    return false
  }

  if (!isStringArray(candidate.routes)) {
    return false
  }

  if (!isJsonSchema7(candidate.configSchema)) {
    return false
  }

  if (!isStringArray(candidate.capabilities)) {
    return false
  }

  return true
}

export const assertModuleMeta = (meta: unknown): ModuleMeta => {
  if (validateModuleMeta(meta)) {
    return meta
  }

  throw new Error('Invalid module meta definition')
}
