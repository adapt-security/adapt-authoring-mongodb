import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { assertSafeQuery } from '../lib/utils/assertSafeQuery.js'

describe('assertSafeQuery()', () => {
  it('should allow a simple field query', () => {
    assert.doesNotThrow(() => assertSafeQuery({ name: 'test' }))
  })

  it('should allow safe query operators', () => {
    assert.doesNotThrow(() => assertSafeQuery({ age: { $gt: 18, $lt: 65 } }))
  })

  it('should allow $or and $and operators', () => {
    assert.doesNotThrow(() => assertSafeQuery({
      $or: [{ name: 'a' }, { name: 'b' }],
      $and: [{ active: true }]
    }))
  })

  it('should allow $regex operator', () => {
    assert.doesNotThrow(() => assertSafeQuery({ name: { $regex: 'test', $options: 'i' } }))
  })

  it('should allow $in and $nin operators', () => {
    assert.doesNotThrow(() => assertSafeQuery({ status: { $in: ['active', 'pending'] } }))
  })

  it('should allow $exists and $type operators', () => {
    assert.doesNotThrow(() => assertSafeQuery({ field: { $exists: true, $type: 'string' } }))
  })

  it('should reject $where operator', () => {
    assert.throws(
      () => assertSafeQuery({ $where: 'this.a > this.b' }),
      { message: 'Use of the $where operator is not permitted' }
    )
  })

  it('should reject $accumulator operator', () => {
    assert.throws(
      () => assertSafeQuery({ field: { $accumulator: { init: 'function() {}' } } }),
      { message: 'Use of the $accumulator operator is not permitted' }
    )
  })

  it('should reject $function operator', () => {
    assert.throws(
      () => assertSafeQuery({ field: { $function: { body: 'function() {}' } } }),
      { message: 'Use of the $function operator is not permitted' }
    )
  })

  it('should reject blocked operators nested inside $or', () => {
    assert.throws(
      () => assertSafeQuery({ $or: [{ $where: 'true' }] }),
      { message: 'Use of the $where operator is not permitted' }
    )
  })

  it('should reject blocked operators deeply nested', () => {
    assert.throws(
      () => assertSafeQuery({ a: { b: { $where: 'true' } } }),
      { message: 'Use of the $where operator is not permitted' }
    )
  })

  it('should reject blocked operators inside $and within $or', () => {
    assert.throws(
      () => assertSafeQuery({ $or: [{ $and: [{ $where: 'true' }] }] }),
      { message: 'Use of the $where operator is not permitted' }
    )
  })

  it('should handle null values gracefully', () => {
    assert.doesNotThrow(() => assertSafeQuery({ field: null }))
  })

  it('should handle undefined input gracefully', () => {
    assert.doesNotThrow(() => assertSafeQuery(undefined))
  })

  it('should handle empty object', () => {
    assert.doesNotThrow(() => assertSafeQuery({}))
  })

  it('should handle primitive values', () => {
    assert.doesNotThrow(() => assertSafeQuery('string'))
    assert.doesNotThrow(() => assertSafeQuery(42))
    assert.doesNotThrow(() => assertSafeQuery(true))
  })
})
