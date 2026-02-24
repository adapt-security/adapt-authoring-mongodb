import { ObjectId } from 'mongodb'

/**
 * Creates a new ObjectId instance
 * @return {external:MongoDBObjectId}
 * @memberof mongodb
 * @deprecated Use createObjectId instead
 */
export function create () {
  return new ObjectId()
}
