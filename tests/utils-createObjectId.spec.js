import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { ObjectId } from 'mongodb'
import { createObjectId } from '../lib/utils/createObjectId.js'

describe('createObjectId()', () => {
  it('should return an ObjectId instance', () => {
    const id = createObjectId()
    assert.ok(id instanceof ObjectId)
  })

  it('should create unique IDs each time', () => {
    const id1 = createObjectId()
    const id2 = createObjectId()
    assert.notEqual(id1.toString(), id2.toString())
  })

  it('should return a 24-character hex string representation', () => {
    const id = createObjectId()
    assert.match(id.toString(), /^[0-9a-f]{24}$/)
  })
})
