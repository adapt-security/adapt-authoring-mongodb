import { isObject } from 'adapt-authoring-core'
import { assertSafeQuery } from './assertSafeQuery.js'
import { convertObjectIds } from './convertObjectIds.js'

/**
 * Validators for each allowed MongoDB driver option.
 * Each function returns a parsed value if valid, or undefined to strip the option.
 * @type {Object<string, function>}
 */
const OPTION_VALIDATORS = {
  collation: v => isObject(v) ? v : undefined,
  includeResultMetadata: v => typeof v === 'boolean' ? v : undefined,
  limit: v => { const n = parseInt(v); return Number.isFinite(n) ? n : undefined },
  projection: v => isObject(v) ? v : undefined,
  returnCursor: v => typeof v === 'boolean' ? v : undefined,
  returnDocument: v => v === 'before' || v === 'after' ? v : undefined,
  skip: v => { const n = parseInt(v); return Number.isFinite(n) ? n : undefined },
  sort: v => isObject(v) ? v : undefined,
  upsert: v => typeof v === 'boolean' ? v : undefined
}

/**
 * Validates and normalises query, data, and options before a database operation.
 * Returns shallow copies so the caller's originals are not mutated.
 * @param {Object} params
 * @param {Object} [params.query] The query object to validate and convert
 * @param {Object} [params.data] The data object to convert and sanitise
 * @param {Object} [params.options] The options object to parse
 * @returns {{ query: Object, data: Object, options: Object }}
 * @memberof mongodb
 */
export function processParams ({ query, data, options } = {}) {
  const result = {}

  if (query) {
    result.query = { ...query }
    assertSafeQuery(result.query)
    convertObjectIds(result.query)
  }

  if (data) {
    result.data = { ...data }
    convertObjectIds(result.data)
    if (!options?.preserveId) {
      delete result.data._id
      if (result.data.$set) delete result.data.$set._id
    }
  }

  if (options) {
    result.options = {}
    for (const [key, value] of Object.entries(options)) {
      const validate = OPTION_VALIDATORS[key]
      if (!validate) continue
      const parsed = validate(value)
      if (parsed !== undefined) {
        result.options[key] = parsed
      }
    }
  }

  return result
}
