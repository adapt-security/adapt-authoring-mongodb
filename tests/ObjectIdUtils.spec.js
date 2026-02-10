import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { ObjectId } from 'mongodb'
import ObjectIdUtils from '../lib/ObjectIdUtils.js'

describe('ObjectIdUtils', () => {
  describe('#create()', () => {
    it('should create a new ObjectId instance', () => {
      const id = ObjectIdUtils.create()
      assert.ok(id instanceof ObjectId)
    })
  })

  describe('#isValid()', () => {
    const validIds = [
      '507f1f77bcf86cd799439011',
      '507f191e810c19729de860ea',
      '000000000000000000000000'
    ]

    validIds.forEach((id) => {
      it(`should return true for valid ObjectId string ${id}`, () => {
        assert.equal(ObjectIdUtils.isValid(id), true)
      })
    })

    const invalidIds = [
      'invalid',
      '507f1f77bcf86cd79943901',
      '507f1f77bcf86cd79943901g',
      '',
      null,
      undefined,
      123,
      {}
    ]

    invalidIds.forEach((id) => {
      it(`should return false for invalid input ${JSON.stringify(id)}`, () => {
        assert.equal(ObjectIdUtils.isValid(id), false)
      })
    })

    it('should return true for an ObjectId instance', () => {
      const id = new ObjectId()
      assert.equal(ObjectIdUtils.isValid(id.toString()), true)
    })
  })

  describe('#parse()', () => {
    it('should convert a valid string to ObjectId', () => {
      const str = '507f1f77bcf86cd799439011'
      const id = ObjectIdUtils.parse(str)
      assert.ok(id instanceof ObjectId)
      assert.equal(id.toString(), str)
    })

    it('should return an ObjectId instance unchanged', () => {
      const id = new ObjectId()
      const parsed = ObjectIdUtils.parse(id)
      assert.equal(parsed, id)
    })

    it('should throw error for invalid string', () => {
      assert.throws(() => {
        ObjectIdUtils.parse('invalid')
      })
    })

    it('should throw error for empty string', () => {
      assert.throws(() => {
        ObjectIdUtils.parse('')
      })
    })
  })

  describe('#parseIds()', () => {
    it('should parse string ObjectIds in a simple object', () => {
      const obj = {
        _id: '507f1f77bcf86cd799439011',
        name: 'test'
      }
      ObjectIdUtils.parseIds(obj)
      assert.ok(obj._id instanceof ObjectId)
      assert.equal(obj.name, 'test')
    })

    it('should parse ObjectIds in nested objects', () => {
      const obj = {
        user: {
          _id: '507f1f77bcf86cd799439011'
        },
        name: 'test'
      }
      ObjectIdUtils.parseIds(obj)
      assert.ok(obj.user._id instanceof ObjectId)
      assert.equal(obj.name, 'test')
    })

    it('should parse ObjectIds in arrays', () => {
      const obj = {
        ids: ['507f1f77bcf86cd799439011', '507f191e810c19729de860ea']
      }
      ObjectIdUtils.parseIds(obj)
      assert.ok(obj.ids[0] instanceof ObjectId)
      assert.ok(obj.ids[1] instanceof ObjectId)
    })

    it('should handle mixed arrays with objects', () => {
      const obj = {
        items: [
          { _id: '507f1f77bcf86cd799439011' },
          { _id: '507f191e810c19729de860ea' }
        ]
      }
      ObjectIdUtils.parseIds(obj)
      assert.ok(obj.items[0]._id instanceof ObjectId)
      assert.ok(obj.items[1]._id instanceof ObjectId)
    })

    it('should ignore invalid strings silently', () => {
      const obj = {
        _id: '507f1f77bcf86cd799439011',
        invalid: 'not-an-id'
      }
      ObjectIdUtils.parseIds(obj)
      assert.ok(obj._id instanceof ObjectId)
      assert.equal(obj.invalid, 'not-an-id')
    })

    it('should handle undefined input', () => {
      assert.doesNotThrow(() => {
        ObjectIdUtils.parseIds(undefined)
      })
    })

    it('should leave non-ObjectId strings unchanged', () => {
      const obj = {
        name: 'test',
        email: 'test@example.com'
      }
      ObjectIdUtils.parseIds(obj)
      assert.equal(obj.name, 'test')
      assert.equal(obj.email, 'test@example.com')
    })

    it('should handle deeply nested structures', () => {
      const obj = {
        level1: {
          level2: {
            level3: {
              _id: '507f1f77bcf86cd799439011'
            }
          }
        }
      }
      ObjectIdUtils.parseIds(obj)
      assert.ok(obj.level1.level2.level3._id instanceof ObjectId)
    })
  })
})
