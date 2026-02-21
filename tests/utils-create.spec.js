import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { ObjectId } from 'mongodb'
import { create } from '../lib/utils/create.js'

describe('create()', () => {
  it('should return an ObjectId instance', () => {
    const id = create()
    assert.ok(id instanceof ObjectId)
  })

  it('should create unique IDs each time', () => {
    const id1 = create()
    const id2 = create()
    assert.notEqual(id1.toString(), id2.toString())
  })

  it('should return a 24-character hex string representation', () => {
    const id = create()
    assert.match(id.toString(), /^[0-9a-f]{24}$/)
  })
})
