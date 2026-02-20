import { describe, it, mock } from 'node:test'
import assert from 'node:assert/strict'
import MongoDBModule from '../lib/MongoDBModule.js'

/**
 * MongoDBModule extends AbstractModule and requires a running MongoDB connection.
 * We test parseOptions and getError in isolation.
 */

function createInstance () {
  const mockApp = {
    waitForModule: mock.fn(async () => {}),
    errors: {
      MONGO_ERROR: { setData: mock.fn(function (d) { return { code: 'MONGO_ERROR', ...d } }) },
      MONGO_IMMUTABLE_FIELD: { setData: mock.fn(function (d) { return { code: 'MONGO_IMMUTABLE_FIELD', ...d } }) },
      MONGO_DUPL_INDEX: { setData: mock.fn(function (d) { return { code: 'MONGO_DUPL_INDEX', ...d } }) },
      MONGO_CONN_FAILED: { setData: mock.fn(function () { return this }) }
    },
    dependencyloader: {
      moduleLoadedHook: { tap: () => {}, untap: () => {} }
    }
  }

  const originalInit = MongoDBModule.prototype.init
  MongoDBModule.prototype.init = async function () {}

  const instance = new MongoDBModule(mockApp, { name: 'adapt-authoring-mongodb' })

  MongoDBModule.prototype.init = originalInit

  instance.log = mock.fn()

  return { instance, mockApp }
}

describe('MongoDBModule', () => {
  describe('#parseOptions()', () => {
    it('should parse string limit to integer', () => {
      const { instance } = createInstance()
      const options = { limit: '10' }
      instance.parseOptions(options)
      assert.equal(options.limit, 10)
    })

    it('should parse string skip to integer', () => {
      const { instance } = createInstance()
      const options = { skip: '5' }
      instance.parseOptions(options)
      assert.equal(options.skip, 5)
    })

    it('should handle undefined options gracefully', () => {
      const { instance } = createInstance()
      instance.parseOptions(undefined)
    })

    it('should handle options without limit or skip', () => {
      const { instance } = createInstance()
      const options = { sort: { name: 1 } }
      instance.parseOptions(options)
      assert.deepEqual(options, { sort: { name: 1 } })
    })

    it('should keep numeric limit as-is', () => {
      const { instance } = createInstance()
      const options = { limit: 10 }
      instance.parseOptions(options)
      assert.equal(options.limit, 10)
    })

    it('should skip undefined limit', () => {
      const { instance } = createInstance()
      const options = { limit: undefined }
      instance.parseOptions(options)
      assert.equal(options.limit, undefined)
    })
  })

  describe('#getError()', () => {
    it('should return MONGO_IMMUTABLE_FIELD for error code 66', () => {
      const { instance } = createInstance()
      const result = instance.getError('test', 'update', { code: 66, message: 'immutable' })
      assert.equal(result.code, 'MONGO_IMMUTABLE_FIELD')
    })

    it('should return MONGO_DUPL_INDEX for error code 11000', () => {
      const { instance } = createInstance()
      const result = instance.getError('test', 'insert', { code: 11000, message: 'duplicate' })
      assert.equal(result.code, 'MONGO_DUPL_INDEX')
    })

    it('should return MONGO_ERROR for other error codes', () => {
      const { instance } = createInstance()
      const result = instance.getError('test', 'find', { code: 999, message: 'unknown' })
      assert.equal(result.code, 'MONGO_ERROR')
    })

    it('should return MONGO_ERROR for errors without code', () => {
      const { instance } = createInstance()
      const result = instance.getError('test', 'delete', { message: 'fail' })
      assert.equal(result.code, 'MONGO_ERROR')
    })
  })

  describe('#ObjectId', () => {
    it('should return ObjectIdUtils', () => {
      const { instance } = createInstance()
      assert.ok(instance.ObjectId)
      assert.equal(typeof instance.ObjectId.isValid, 'function')
      assert.equal(typeof instance.ObjectId.create, 'function')
    })
  })
})
