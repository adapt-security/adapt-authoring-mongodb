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

const { convertObjectIds } = await import('../lib/utils/convertObjectIds.js')

describe('convertObjectIds()', () => {
  it('should handle undefined input gracefully', () => {
    assert.equal(convertObjectIds(undefined), undefined)
  })

  it('should convert valid ObjectId strings in a flat object', () => {
    const idStr = new ObjectId().toString()
    const obj = { _id: idStr }
    convertObjectIds(obj)
    assert.ok(obj._id instanceof ObjectId)
    assert.equal(obj._id.toString(), idStr)
  })

  it('should leave non-ObjectId strings unchanged', () => {
    const obj = { name: 'test', value: 'hello' }
    convertObjectIds(obj)
    assert.equal(obj.name, 'test')
    assert.equal(obj.value, 'hello')
  })

  it('should recurse into nested objects', () => {
    const idStr = new ObjectId().toString()
    const obj = { nested: { _id: idStr } }
    convertObjectIds(obj)
    assert.ok(obj.nested._id instanceof ObjectId)
    assert.equal(obj.nested._id.toString(), idStr)
  })

  it('should convert ObjectId strings in arrays', () => {
    const idStr = new ObjectId().toString()
    const obj = { ids: [idStr] }
    convertObjectIds(obj)
    assert.ok(obj.ids[0] instanceof ObjectId)
    assert.equal(obj.ids[0].toString(), idStr)
  })

  it('should recurse into objects within arrays', () => {
    const idStr = new ObjectId().toString()
    const obj = { items: [{ _id: idStr }] }
    convertObjectIds(obj)
    assert.ok(obj.items[0]._id instanceof ObjectId)
  })

  it('should leave non-ObjectId strings in arrays unchanged', () => {
    const obj = { tags: ['hello', 'world'] }
    convertObjectIds(obj)
    assert.equal(obj.tags[0], 'hello')
    assert.equal(obj.tags[1], 'world')
  })

  it('should leave numbers and booleans unchanged', () => {
    const obj = { count: 42, active: true }
    convertObjectIds(obj)
    assert.equal(obj.count, 42)
    assert.equal(obj.active, true)
  })

  it('should handle deeply nested structures', () => {
    const idStr = new ObjectId().toString()
    const obj = { a: { b: { c: { _id: idStr } } } }
    convertObjectIds(obj)
    assert.ok(obj.a.b.c._id instanceof ObjectId)
  })

  it('should handle mixed content in an object', () => {
    const idStr = new ObjectId().toString()
    const obj = {
      _id: idStr,
      name: 'test',
      count: 5,
      nested: { value: 'keep' }
    }
    convertObjectIds(obj)
    assert.ok(obj._id instanceof ObjectId)
    assert.equal(obj.name, 'test')
    assert.equal(obj.count, 5)
    assert.equal(obj.nested.value, 'keep')
  })

  it('should handle empty objects', () => {
    const obj = {}
    convertObjectIds(obj)
    assert.deepEqual(obj, {})
  })

  it('should handle objects with empty arrays', () => {
    const obj = { items: [] }
    convertObjectIds(obj)
    assert.deepEqual(obj.items, [])
  })
})
