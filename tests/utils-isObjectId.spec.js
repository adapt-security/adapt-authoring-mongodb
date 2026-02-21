import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { ObjectId } from 'mongodb'
import { isObjectId } from '../lib/utils/isObjectId.js'

describe('isObjectId()', () => {
  it('should return true for an ObjectId instance', () => {
    assert.equal(isObjectId(new ObjectId()), true)
  })

  it('should return false for a valid ObjectId string', () => {
    assert.equal(isObjectId('507f1f77bcf86cd799439011'), false)
  })

  it('should return false for a plain string', () => {
    assert.equal(isObjectId('hello'), false)
  })

  it('should return false for null', () => {
    assert.equal(isObjectId(null), false)
  })

  it('should return false for undefined', () => {
    assert.equal(isObjectId(undefined), false)
  })

  it('should return false for a number', () => {
    assert.equal(isObjectId(12345), false)
  })

  it('should return false for a plain object', () => {
    assert.equal(isObjectId({}), false)
  })

  it('should return false for an array', () => {
    assert.equal(isObjectId([]), false)
  })
})
