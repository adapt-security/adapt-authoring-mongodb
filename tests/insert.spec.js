import { describe, it, mock } from 'node:test'
import assert from 'node:assert/strict'
import { ObjectId } from 'mongodb'

describe('insert() preserveId', () => {
  const presetId = new ObjectId()
  const generatedId = new ObjectId()

  function createContext () {
    let insertedData
    return {
      context: {
        getCollection: mock.fn(() => ({
          insertOne: mock.fn(async (data) => {
            insertedData = { ...data }
            return { insertedId: data._id ?? generatedId }
          })
        })),
        find: mock.fn(async () => [{ _id: generatedId, name: 'test' }])
      },
      getInsertedData: () => insertedData
    }
  }

  async function insert (context, collectionName, data, options = {}) {
    const { preserveId, ...mongoOptions } = options
    if (!preserveId) {
      delete data._id
      if (data.$set) delete data.$set._id
    }
    const { insertedId } = await context.getCollection(collectionName).insertOne(data, mongoOptions)
    const [doc] = await context.find(collectionName, { _id: insertedId })
    return doc
  }

  it('should strip _id by default', async () => {
    const { context, getInsertedData } = createContext()
    await insert(context, 'test', { _id: presetId, name: 'test' })
    assert.equal(getInsertedData()._id, undefined)
  })

  it('should strip _id from $set by default', async () => {
    const { context, getInsertedData } = createContext()
    await insert(context, 'test', { $set: { _id: presetId, name: 'test' } })
    assert.equal(getInsertedData().$set._id, undefined)
  })

  it('should preserve _id when preserveId is true', async () => {
    const { context, getInsertedData } = createContext()
    await insert(context, 'test', { _id: presetId, name: 'test' }, { preserveId: true })
    assert.deepEqual(getInsertedData()._id, presetId)
  })

  it('should not pass preserveId to the MongoDB driver', async () => {
    const { context } = createContext()
    await insert(context, 'test', { _id: presetId, name: 'test' }, { preserveId: true })
    const insertOne = context.getCollection.mock.calls[0].result.insertOne
    const driverOptions = insertOne.mock.calls[0].arguments[1]
    assert.equal(driverOptions?.preserveId, undefined)
  })

  it('should return the inserted document', async () => {
    const { context } = createContext()
    const result = await insert(context, 'test', { name: 'test' })
    assert.deepEqual(result, { _id: generatedId, name: 'test' })
  })
})
