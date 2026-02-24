import { ObjectId } from 'mongodb'

/**
 * Creates a new ObjectId instance
 * @return {external:MongoDBObjectId}
 * @memberof mongodb
 */
export function createObjectId () {
  return new ObjectId()
}
