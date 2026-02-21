import { ObjectId } from 'mongodb'

/**
 * Creates a new ObjectId instance
 * @return {external:MongoDBObjectId}
 * @memberof mongodb
 */
export function create () {
  return new ObjectId()
}
