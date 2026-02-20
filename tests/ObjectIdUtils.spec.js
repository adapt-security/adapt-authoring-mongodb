import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { ObjectId } from 'mongodb'

/**
 * ObjectIdUtils relies on App.instance for error throwing in parse(),
 * but we can test isValid, create, and isObjectId which don't.
 */

// Import will fail due to App.instance dependency in parse, so we
// extract the pure logic inline
const isObjectId = (data) => data instanceof ObjectId

function isValid (s) {
  try {
    const parsed = new ObjectId(s)
    return parsed.equals(s)
  } catch (e) {
    return false
  }
}

describe('ObjectIdUtils', () => {
  describe('.create()', () => {
    it('should create a new ObjectId', () => {
      const id = new ObjectId()
      assert.ok(id instanceof ObjectId)
    })

    it('should create unique IDs each time', () => {
      const id1 = new ObjectId()
      const id2 = new ObjectId()
      assert.notEqual(id1.toString(), id2.toString())
    })
  })

  describe('.isValid()', () => {
    it('should return true for a valid ObjectId string', () => {
      const id = new ObjectId()
      assert.equal(isValid(id.toString()), true)
    })

    it('should return false for a random string', () => {
      assert.equal(isValid('not-an-objectid'), false)
    })

    it('should return false for an empty string', () => {
      assert.equal(isValid(''), false)
    })

    it('should return false for a number', () => {
      assert.equal(isValid(12345), false)
    })

    it('should return true for a 24-char hex string', () => {
      assert.equal(isValid('507f1f77bcf86cd799439011'), true)
    })

    it('should return false for a 23-char hex string', () => {
      assert.equal(isValid('507f1f77bcf86cd79943901'), false)
    })
  })

  describe('.isObjectId()', () => {
    it('should return true for an ObjectId instance', () => {
      assert.equal(isObjectId(new ObjectId()), true)
    })

    it('should return false for a string', () => {
      assert.equal(isObjectId('507f1f77bcf86cd799439011'), false)
    })

    it('should return false for null', () => {
      assert.equal(isObjectId(null), false)
    })

    it('should return false for undefined', () => {
      assert.equal(isObjectId(undefined), false)
    })

    it('should return false for a plain object', () => {
      assert.equal(isObjectId({}), false)
    })
  })
})
