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

const { parseObjectId } = await import('../lib/utils/parseObjectId.js')

describe('parseObjectId()', () => {
  it('should return same ObjectId if already an ObjectId instance', () => {
    const id = new ObjectId()
    assert.equal(parseObjectId(id), id)
  })

  it('should convert a valid ObjectId string to an ObjectId', () => {
    const str = '507f1f77bcf86cd799439011'
    const result = parseObjectId(str)
    assert.ok(result instanceof ObjectId)
    assert.equal(result.toString(), str)
  })

  it('should throw INVALID_OBJECTID for an invalid string', () => {
    assert.throws(
      () => parseObjectId('not-a-valid-id'),
      (err) => {
        assert.equal(err.message, 'INVALID_OBJECTID')
        assert.deepEqual(err.data, { value: 'not-a-valid-id' })
        return true
      }
    )
  })

  it('should throw INVALID_OBJECTID for an empty string', () => {
    assert.throws(
      () => parseObjectId(''),
      (err) => {
        assert.equal(err.message, 'INVALID_OBJECTID')
        return true
      }
    )
  })

  it('should convert a 24-char hex string', () => {
    const hex = 'aabbccddeeff00112233aabb'
    const result = parseObjectId(hex)
    assert.ok(result instanceof ObjectId)
    assert.equal(result.toString(), hex)
  })

  it('should throw for a 23-char string', () => {
    assert.throws(
      () => parseObjectId('507f1f77bcf86cd79943901'),
      (err) => {
        assert.equal(err.message, 'INVALID_OBJECTID')
        return true
      }
    )
  })
})
