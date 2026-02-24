import { describe, it, mock } from 'node:test'
import assert from 'node:assert/strict'
import { ObjectId } from 'mongodb'
import App from 'adapt-authoring-core/lib/App.js'

mock.getter(App, 'instance', () => ({
  errors: {
    INVALID_OBJECTID: {
      setData (data) {
        const e = new Error('INVALID_OBJECTID')
        e.data = data
        return e
      }
    }
  }
}))

const { isValidObjectId } = await import('../lib/utils/isValidObjectId.js')

describe('isValidObjectId()', () => {
  it('should return true for a valid ObjectId string', () => {
    const id = new ObjectId()
    assert.equal(isValidObjectId(id.toString()), true)
  })

  it('should return true for a 24-char hex string', () => {
    assert.equal(isValidObjectId('507f1f77bcf86cd799439011'), true)
  })

  it('should return false for a random string', () => {
    assert.equal(isValidObjectId('not-an-objectid'), false)
  })

  it('should return false for an empty string', () => {
    assert.equal(isValidObjectId(''), false)
  })

  it('should return false for a number', () => {
    assert.equal(isValidObjectId(12345), false)
  })

  it('should return false for a 23-char hex string', () => {
    assert.equal(isValidObjectId('507f1f77bcf86cd79943901'), false)
  })

  it('should return false for null', () => {
    assert.equal(isValidObjectId(null), false)
  })

  it('should return false for undefined', () => {
    assert.equal(isValidObjectId(undefined), false)
  })
})
