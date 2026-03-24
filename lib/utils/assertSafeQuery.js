/**
 * Operators that allow arbitrary JavaScript execution on the MongoDB server.
 * @type {Set<string>}
 */
const BLOCKED_OPERATORS = new Set(['$where', '$accumulator', '$function'])

/**
 * Recursively checks a MongoDB query object for dangerous operators that could
 * allow arbitrary code execution on the server.
 * @param {*} input The query object (or nested value) to check
 * @param {ErrorsModule} errors The app errors object
 * @throws {AdaptError} If a blocked operator is found
 * @memberof mongodb
 */
export function assertSafeQuery (input, errors) {
  if (Array.isArray(input)) {
    for (const item of input) {
      assertSafeQuery(item, errors)
    }
    return
  }
  if (input === null || typeof input !== 'object') {
    return
  }
  for (const key of Object.keys(input)) {
    if (BLOCKED_OPERATORS.has(key)) {
      throw errors.MONGO_BLOCKED_OPERATOR.setData({ operator: key })
    }
    assertSafeQuery(input[key], errors)
  }
}
