import { App } from 'adapt-authoring-core'
import { ObjectId } from 'mongodb'
import { isObjectId } from './isObjectId.js'

/**
 * Converts a string to an ObjectId
 * @param {String} s The string to convert
 * @return {external:MongoDBObjectId} The converted ID
 * @throws {Error}
 * @memberof mongodb
 */
export function parseObjectId (s) {
  if (isObjectId(s)) {
    return s
  }
  if (!ObjectId.isValid(s)) {
    throw App.instance.errors.INVALID_OBJECTID.setData({ value: s })
  }
  return new ObjectId(s)
}
