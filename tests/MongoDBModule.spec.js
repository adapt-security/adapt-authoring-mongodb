import { describe, it, before } from 'node:test'
import assert from 'node:assert/strict'
import { ObjectId } from 'mongodb'
import MongoDBModule from '../lib/MongoDBModule.js'

describe('MongoDBModule', () => {
  let instance

  before(() => {
    instance = new MongoDBModule()
  })

  describe('#parseOptions()', () => {
    it('should parse string limit to integer', () => {
      const options = { limit: '10' }
      instance.parseOptions(options)
      assert.equal(options.limit, 10)
      assert.equal(typeof options.limit, 'number')
    })

    it('should parse string skip to integer', () => {
      const options = { skip: '5' }
      instance.parseOptions(options)
      assert.equal(options.skip, 5)
      assert.equal(typeof options.skip, 'number')
    })

    it('should handle both limit and skip', () => {
      const options = { limit: '10', skip: '5' }
      instance.parseOptions(options)
      assert.equal(options.limit, 10)
      assert.equal(options.skip, 5)
    })

    it('should return NaN for invalid string values', () => {
      const options = { limit: 'invalid' }
      instance.parseOptions(options)
      // parseInt returns NaN for invalid strings, not throwing an error
      assert.ok(isNaN(options.limit))
    })

    it('should handle undefined options', () => {
      assert.doesNotThrow(() => {
        instance.parseOptions(undefined)
      })
    })

    it('should handle empty options object', () => {
      const options = {}
      instance.parseOptions(options)
      assert.deepEqual(options, {})
    })

    it('should leave numeric limit unchanged', () => {
      const options = { limit: 10 }
      instance.parseOptions(options)
      assert.equal(options.limit, 10)
    })

    it('should leave numeric skip unchanged', () => {
      const options = { skip: 5 }
      instance.parseOptions(options)
      assert.equal(options.skip, 5)
    })

    it('should not affect other options', () => {
      const options = { limit: '10', sort: { name: 1 }, projection: { name: 1 } }
      instance.parseOptions(options)
      assert.equal(options.limit, 10)
      assert.deepEqual(options.sort, { name: 1 })
      assert.deepEqual(options.projection, { name: 1 })
    })
  })

  describe('#getError()', () => {
    it('should return MONGO_ERROR for generic errors', () => {
      const mockApp = {
        errors: {
          MONGO_ERROR: {
            setData: (data) => ({ name: 'MONGO_ERROR', data })
          }
        }
      }
      instance.app = mockApp

      const error = { code: 123, message: 'Generic error' }
      const result = instance.getError('users', 'insert', error)
      assert.equal(result.name, 'MONGO_ERROR')
      assert.equal(result.data.collectionName, 'users')
      assert.equal(result.data.action, 'insert')
      assert.equal(result.data.error, 'Generic error')
    })

    it('should return MONGO_IMMUTABLE_FIELD for code 66', () => {
      const mockApp = {
        errors: {
          MONGO_IMMUTABLE_FIELD: {
            setData: (data) => ({ name: 'MONGO_IMMUTABLE_FIELD', data })
          }
        }
      }
      instance.app = mockApp

      const error = { code: 66, message: 'Immutable field' }
      const result = instance.getError('users', 'update', error)
      assert.equal(result.name, 'MONGO_IMMUTABLE_FIELD')
    })

    it('should return MONGO_DUPL_INDEX for code 11000', () => {
      const mockApp = {
        errors: {
          MONGO_DUPL_INDEX: {
            setData: (data) => ({ name: 'MONGO_DUPL_INDEX', data })
          }
        }
      }
      instance.app = mockApp

      const error = { code: 11000, message: 'Duplicate key error' }
      const result = instance.getError('users', 'insert', error)
      assert.equal(result.name, 'MONGO_DUPL_INDEX')
    })
  })

  describe('#ObjectId', () => {
    it('should provide access to ObjectIdUtils', () => {
      assert.ok(instance.ObjectId)
      assert.equal(typeof instance.ObjectId.create, 'function')
      assert.equal(typeof instance.ObjectId.isValid, 'function')
      assert.equal(typeof instance.ObjectId.parse, 'function')
      assert.equal(typeof instance.ObjectId.parseIds, 'function')
    })

    it('should create ObjectId through getter', () => {
      const id = instance.ObjectId.create()
      assert.ok(id instanceof ObjectId)
    })
  })
})
