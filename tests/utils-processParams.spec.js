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

const { processParams } = await import('../lib/utils/processParams.js')

describe('processParams()', () => {
  describe('query processing', () => {
    it('should return a copy of the query', () => {
      const query = { name: 'test' }
      const result = processParams({ query })
      assert.notEqual(result.query, query)
      assert.deepEqual(result.query, query)
    })

    it('should not mutate the original query', () => {
      const idStr = new ObjectId().toString()
      const query = { _id: idStr }
      processParams({ query })
      assert.equal(query._id, idStr)
    })

    it('should convert ObjectIds in the query copy', () => {
      const idStr = new ObjectId().toString()
      const result = processParams({ query: { _id: idStr } })
      assert.ok(result.query._id instanceof ObjectId)
    })

    it('should reject unsafe query operators', () => {
      assert.throws(
        () => processParams({ query: { $where: 'true' } }),
        { message: 'Use of the $where operator is not permitted' }
      )
    })
  })

  describe('data processing', () => {
    it('should return a copy of the data', () => {
      const data = { name: 'test' }
      const result = processParams({ data })
      assert.notEqual(result.data, data)
      assert.deepEqual(result.data, { name: 'test' })
    })

    it('should not mutate the original data', () => {
      const data = { _id: new ObjectId(), name: 'test' }
      const originalId = data._id
      processParams({ data })
      assert.deepEqual(data._id, originalId)
    })

    it('should strip _id from the copy by default', () => {
      const data = { _id: new ObjectId(), name: 'test' }
      const result = processParams({ data })
      assert.equal(result.data._id, undefined)
    })

    it('should strip _id from $set by default', () => {
      const data = { $set: { _id: new ObjectId(), name: 'test' } }
      const result = processParams({ data })
      assert.equal(result.data.$set._id, undefined)
    })

    it('should preserve _id when preserveId option is set', () => {
      const id = new ObjectId()
      const result = processParams({ data: { _id: id, name: 'test' }, options: { preserveId: true } })
      assert.deepEqual(result.data._id, id)
    })

    it('should convert ObjectIds in the data copy', () => {
      const idStr = new ObjectId().toString()
      const result = processParams({ data: { ref: idStr } })
      assert.ok(result.data.ref instanceof ObjectId)
    })
  })

  describe('options processing', () => {
    it('should return a copy of the options', () => {
      const options = { limit: 10 }
      const result = processParams({ options })
      assert.notEqual(result.options, options)
    })

    it('should not mutate the original options', () => {
      const options = { limit: '10' }
      processParams({ options })
      assert.equal(options.limit, '10')
    })

    it('should parse limit as integer', () => {
      const result = processParams({ options: { limit: '25' } })
      assert.equal(result.options.limit, 25)
    })

    it('should parse skip as integer', () => {
      const result = processParams({ options: { skip: '5' } })
      assert.equal(result.options.skip, 5)
    })

    it('should strip preserveId from the returned options', () => {
      const result = processParams({ data: { name: 'test' }, options: { preserveId: true, limit: 10 } })
      assert.equal(result.options.preserveId, undefined)
    })

    it('should pass through allowed options unchanged', () => {
      const result = processParams({ options: { sort: { name: 1 }, limit: 10 } })
      assert.deepEqual(result.options.sort, { name: 1 })
    })

    it('should allow all safe driver options', () => {
      const options = {
        collation: { locale: 'en' },
        includeResultMetadata: false,
        limit: 10,
        projection: { name: 1 },
        returnCursor: true,
        returnDocument: 'after',
        skip: 5,
        sort: { name: 1 },
        upsert: true
      }
      const result = processParams({ options })
      assert.deepEqual(result.options, { ...options, limit: 10, skip: 5 })
    })

    it('should strip disallowed options', () => {
      const result = processParams({ options: { limit: 10, allowDiskUse: true, bypassDocumentValidation: true } })
      assert.equal(result.options.limit, 10)
      assert.equal(result.options.allowDiskUse, undefined)
      assert.equal(result.options.bypassDocumentValidation, undefined)
    })

    it('should strip hint option', () => {
      const result = processParams({ options: { hint: { _id: 1 } } })
      assert.equal(result.options.hint, undefined)
    })

    it('should strip writeConcern option', () => {
      const result = processParams({ options: { writeConcern: { w: 0 } } })
      assert.equal(result.options.writeConcern, undefined)
    })

    it('should strip maxTimeMS option', () => {
      const result = processParams({ options: { maxTimeMS: 1 } })
      assert.equal(result.options.maxTimeMS, undefined)
    })
  })

  describe('options value validation', () => {
    it('should strip limit if not a valid number', () => {
      const result = processParams({ options: { limit: 'abc' } })
      assert.equal(result.options.limit, undefined)
    })

    it('should strip skip if not a valid number', () => {
      const result = processParams({ options: { skip: 'abc' } })
      assert.equal(result.options.skip, undefined)
    })

    it('should strip limit if NaN', () => {
      const result = processParams({ options: { limit: NaN } })
      assert.equal(result.options.limit, undefined)
    })

    it('should strip collation if not a plain object', () => {
      const result = processParams({ options: { collation: 'en' } })
      assert.equal(result.options.collation, undefined)
    })

    it('should strip collation if array', () => {
      const result = processParams({ options: { collation: [{ locale: 'en' }] } })
      assert.equal(result.options.collation, undefined)
    })

    it('should strip sort if not a plain object', () => {
      const result = processParams({ options: { sort: 'name' } })
      assert.equal(result.options.sort, undefined)
    })

    it('should strip projection if not a plain object', () => {
      const result = processParams({ options: { projection: 'name' } })
      assert.equal(result.options.projection, undefined)
    })

    it('should strip returnDocument if not before or after', () => {
      const result = processParams({ options: { returnDocument: 'always' } })
      assert.equal(result.options.returnDocument, undefined)
    })

    it('should allow returnDocument before', () => {
      const result = processParams({ options: { returnDocument: 'before' } })
      assert.equal(result.options.returnDocument, 'before')
    })

    it('should strip upsert if not boolean', () => {
      const result = processParams({ options: { upsert: 'true' } })
      assert.equal(result.options.upsert, undefined)
    })

    it('should strip includeResultMetadata if not boolean', () => {
      const result = processParams({ options: { includeResultMetadata: 1 } })
      assert.equal(result.options.includeResultMetadata, undefined)
    })

    it('should strip returnCursor if not boolean', () => {
      const result = processParams({ options: { returnCursor: 1 } })
      assert.equal(result.options.returnCursor, undefined)
    })
  })

  describe('partial params', () => {
    it('should handle query only', () => {
      const result = processParams({ query: { name: 'test' } })
      assert.deepEqual(result.query, { name: 'test' })
      assert.equal(result.data, undefined)
      assert.equal(result.options, undefined)
    })

    it('should handle empty call', () => {
      const result = processParams()
      assert.deepEqual(result, {})
    })
  })
})
