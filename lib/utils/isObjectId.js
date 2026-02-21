import { ObjectId } from 'mongodb'

/**
 * Checks if a value is a MongoDB ObjectId instance
 * @param {*} data The value to check
 * @return {Boolean}
 * @memberof mongodb
 */
export function isObjectId (data) {
  return data instanceof ObjectId
}
