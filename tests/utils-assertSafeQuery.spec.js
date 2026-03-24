import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { assertSafeQuery } from '../lib/utils/assertSafeQuery.js'

const errors = {
  MONGO_BLOCKED_OPERATOR: {
    setData (data) {
      const e = new Error('MONGO_BLOCKED_OPERATOR')
      e.data = data
      return e
    }
  }
}

describe('assertSafeQuery()', () => {
  it('should allow a simple field query', () => {
    assert.doesNotThrow(() => assertSafeQuery({ name: 'test' }, errors))
  })

  it('should allow safe query operators', () => {
    assert.doesNotThrow(() => assertSafeQuery({ age: { $gt: 18, $lt: 65 } }, errors))
  })

  it('should allow $or and $and operators', () => {
    assert.doesNotThrow(() => assertSafeQuery({
      $or: [{ name: 'a' }, { name: 'b' }],
      $and: [{ active: true }]
    }, errors))
  })

  it('should allow $regex operator', () => {
    assert.doesNotThrow(() => assertSafeQuery({ name: { $regex: 'test', $options: 'i' } }, errors))
  })

  it('should allow $in and $nin operators', () => {
    assert.doesNotThrow(() => assertSafeQuery({ status: { $in: ['active', 'pending'] } }, errors))
  })

  it('should allow $exists and $type operators', () => {
    assert.doesNotThrow(() => assertSafeQuery({ field: { $exists: true, $type: 'string' } }, errors))
  })

  it('should throw MONGO_BLOCKED_OPERATOR for $where', () => {
    assert.throws(
      () => assertSafeQuery({ $where: 'this.a > this.b' }, errors),
      (err) => {
        assert.equal(err.message, 'MONGO_BLOCKED_OPERATOR')
        assert.deepEqual(err.data, { operator: '$where' })
        return true
      }
    )
  })

  it('should throw MONGO_BLOCKED_OPERATOR for $accumulator', () => {
    assert.throws(
      () => assertSafeQuery({ field: { $accumulator: { init: 'function() {}' } } }, errors),
      (err) => {
        assert.equal(err.message, 'MONGO_BLOCKED_OPERATOR')
        assert.deepEqual(err.data, { operator: '$accumulator' })
        return true
      }
    )
  })

  it('should throw MONGO_BLOCKED_OPERATOR for $function', () => {
    assert.throws(
      () => assertSafeQuery({ field: { $function: { body: 'function() {}' } } }, errors),
      (err) => {
        assert.equal(err.message, 'MONGO_BLOCKED_OPERATOR')
        assert.deepEqual(err.data, { operator: '$function' })
        return true
      }
    )
  })

  it('should reject blocked operators nested inside $or', () => {
    assert.throws(
      () => assertSafeQuery({ $or: [{ $where: 'true' }] }, errors),
      (err) => {
        assert.equal(err.message, 'MONGO_BLOCKED_OPERATOR')
        return true
      }
    )
  })

  it('should reject blocked operators deeply nested', () => {
    assert.throws(
      () => assertSafeQuery({ a: { b: { $where: 'true' } } }, errors),
      (err) => {
        assert.equal(err.message, 'MONGO_BLOCKED_OPERATOR')
        return true
      }
    )
  })

  it('should reject blocked operators inside $and within $or', () => {
    assert.throws(
      () => assertSafeQuery({ $or: [{ $and: [{ $where: 'true' }] }] }, errors),
      (err) => {
        assert.equal(err.message, 'MONGO_BLOCKED_OPERATOR')
        return true
      }
    )
  })

  it('should handle null values gracefully', () => {
    assert.doesNotThrow(() => assertSafeQuery({ field: null }, errors))
  })

  it('should handle undefined input gracefully', () => {
    assert.doesNotThrow(() => assertSafeQuery(undefined, errors))
  })

  it('should handle empty object', () => {
    assert.doesNotThrow(() => assertSafeQuery({}, errors))
  })

  it('should handle primitive values', () => {
    assert.doesNotThrow(() => assertSafeQuery('string', errors))
    assert.doesNotThrow(() => assertSafeQuery(42, errors))
    assert.doesNotThrow(() => assertSafeQuery(true, errors))
  })
})
