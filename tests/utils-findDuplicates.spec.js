import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { findDuplicates, getFieldNames } from '../lib/utils/findDuplicates.js'

describe('getFieldNames()', () => {
  it('should return a single-element array for a string input', () => {
    assert.deepEqual(getFieldNames('email'), ['email'])
  })

  it('should return the keys of an object input', () => {
    assert.deepEqual(getFieldNames({ _courseId: 1, _friendlyId: 1 }), ['_courseId', '_friendlyId'])
  })
})

describe('findDuplicates()', () => {
  function mockCollection (aggregateResult) {
    return {
      aggregate () {
        return { toArray: async () => aggregateResult }
      }
    }
  }

  it('should return duplicate groups from the collection', async () => {
    const expected = [
      { keyValue: { email: 'a@b.com' }, _ids: ['id1', 'id2'] }
    ]
    const result = await findDuplicates(mockCollection(expected), 'email')
    assert.deepEqual(result, expected)
  })

  it('should return an empty array when no duplicates exist', async () => {
    const result = await findDuplicates(mockCollection([]), 'email')
    assert.deepEqual(result, [])
  })
})
