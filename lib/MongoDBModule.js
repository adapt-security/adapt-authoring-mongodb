import { AbstractModule } from 'adapt-authoring-core'
import { MongoClient } from 'mongodb'
import { findDuplicates, isValidObjectId, parseObjectId, processParams } from './utils.js'
/**
 * Represents a single MongoDB server instance
 * @memberof mongodb
 * @extends {AbstractModule}
 */
class MongoDBModule extends AbstractModule {
  /** @override */
  async init () {
    await this.app.waitForModule('config')
    /**
     * Reference to the MongDB client
     * @type {external:MongoDBMongoClient}
     */
    this.client = new MongoClient(this.getConfig('connectionUri'), { ignoreUndefined: true })
    await this.connect()
    await this.addSchemaKeyword()
  }

  /**
   * Connects to the database
   * @return {Promise}
   */
  async connect () {
    try {
      await this.client.connect()
      const { hosts, dbName } = this.client.options
      this.log('info', `connected to ${dbName} on ${hosts}`)
    } catch (e) {
      throw this.app.errors.MONGO_CONN_FAILED
        .setData({ error: e.message })
    }
  }

  /**
   * Get all the db statistics
   * @return {Promise}
   * @see https://mongodb.github.io/node-mongodb-native/4.2/classes/Db.html#stats
   */
  async getStats () {
    return this.client.db().stats()
  }

  /**
   * Returns the associated MongoDB collection
   * @param {String} collectionName The name of the MongoDB collection
   * @return {external:MongoDBCollection}
   * @see https://mongodb.github.io/node-mongodb-native/4.2/classes/Collection.html
   */
  getCollection (collectionName) {
    return this.client.db().collection(collectionName)
  }

  /**
   * Set an index on a MongoDB collection
   * @param {String} collectionName The name of the MongoDB collection
   * @param {String|Array|Object} fieldOrSpec Definition of the index
   * @param {external:MongoDBCreateIndexesOptions} options Options to pass to the MongoDB driver
   * @return {Promise}
   * @see https://mongodb.github.io/node-mongodb-native/4.2/classes/Collection.html#createIndex
   */
  async setIndex (collectionName, fieldOrSpec, options) {
    try {
      await this.getCollection(collectionName).createIndex(fieldOrSpec, options)
    } catch (e) {
      if (e.code === 11000) {
        await this.logDuplicateIndexError(collectionName, fieldOrSpec, e)
      } else {
        this.log('warn', e.toString())
      }
    }
  }

  /**
   * Logs detailed information about duplicate index errors
   * @param {String} collectionName The name of the MongoDB collection
   * @param {String|Array|Object} fieldOrSpec Definition of the index
   * @param {Error} error The original MongoDB error
   */
  async logDuplicateIndexError (collectionName, fieldOrSpec, error) {
    this.log('warn', `Duplicate index error on '${collectionName}': ${error.message}`)
    try {
      const duplicates = await findDuplicates(this.getCollection(collectionName), fieldOrSpec)
      for (const { keyValue, _ids } of duplicates) {
        this.log('warn', `  ${JSON.stringify(keyValue)} → [${_ids.join(', ')}]`)
      }
    } catch (queryError) {
      this.log('warn', `  Could not query duplicates: ${queryError.message}`)
    }
  }

  /**
   * Adds a new object to the database
   * @param {String} collectionName The name of the MongoDB collection
   * @param {Object} data
   * @param {Object} options Options to pass to the MongoDB driver
   * @param {Boolean} [options.preserveId] If true, retains a pre-set data._id instead of auto-generating one
   * @return {Promise} promise
   * @see https://mongodb.github.io/node-mongodb-native/4.2/classes/Collection.html#insertOne
   */
  async insert (collectionName, data, options = {}) {
    const p = processParams({ data, options })
    try {
      const { insertedId } = await this.getCollection(collectionName).insertOne(p.data, p.options)
      const [doc] = await this.find(collectionName, { _id: insertedId })
      return doc
    } catch (e) {
      this.log('error', `failed to insert doc, ${e.message}`)
      throw this.getError(collectionName, 'insert', e)
    }
  }

  /**
   * Retrieves a new object from the database
   * @param {String} collectionName The name of the MongoDB collection
   * @param {Object} query
   * @param {external:MongoDBFindOptions} options Options to pass to the MongoDB driver
   * @return {Promise} promise
   * @see https://mongodb.github.io/node-mongodb-native/4.2/classes/Collection.html#find
   */
  async find (collectionName, query, options) {
    const p = processParams({ query, options })
    try {
      const cursor = this.getCollection(collectionName).find(p.query, p.options)
      return p.options?.returnCursor === true ? cursor : await cursor.toArray()
    } catch (e) {
      this.log('error', `failed to find docs, ${e.message}`)
      throw this.getError(collectionName, 'find', e)
    }
  }

  /**
   * Updates an existing object in the database
   * @param {String} collectionName The name of the MongoDB collection
   * @param {Object} query
   * @param {Object} data
   * @param {external:MongoDBFindOneAndUpdateOptions} options Options to pass to the MongoDB driver
   * @return {Promise} promise
   * @see https://mongodb.github.io/node-mongodb-native/4.2/classes/Collection.html#findOneAndUpdate
   */
  async update (collectionName, query, data, options) {
    const p = processParams({ query, data, options: { includeResultMetadata: false, returnDocument: 'after', ...options } })
    try {
      return await this.getCollection(collectionName).findOneAndUpdate(p.query, p.data, p.options)
    } catch (e) {
      this.log('error', `failed to update doc, ${e.message}`)
      throw this.getError(collectionName, 'update', e)
    }
  }

  /**
   * Updates multiple objects in the database
   * @param {String} collectionName The name of the MongoDB collection
   * @param {Object} query
   * @param {external:MongoDBUpdateManyOptions} options Options to pass to the MongoDB driver
   * @return {Promise} promise
   * @see https://mongodb.github.io/node-mongodb-native/4.2/classes/Collection.html#updateMany
   */
  async updateMany (collectionName, query, data, options) {
    const p = processParams({ query, data, options })
    try {
      await this.getCollection(collectionName).updateMany(p.query, p.data, p.options)
      return this.find(collectionName, p.query)
    } catch (e) {
      this.log('error', `failed to update docs, ${e.message}`)
      throw this.getError(collectionName, 'update', e)
    }
  }

  /**
   * Replaces an existing object in the database
   * @param {String} collectionName The name of the MongoDB collection
   * @param {Object} query
   * @param {Object} data
   * @param {external:MongoDBFindOneAndReplaceOptions} options Options to pass to the MongoDB driver
   * @return {Promise} promise
   * @see https://mongodb.github.io/node-mongodb-native/4.2/classes/Collection.html#findOneAndReplace
   */
  async replace (collectionName, query, data, options) {
    const p = processParams({ query, data, options: { includeResultMetadata: false, returnDocument: 'after', ...options } })
    try {
      return await this.getCollection(collectionName).findOneAndReplace(p.query, p.data, p.options)
    } catch (e) {
      this.log('error', `failed to replace doc, ${e.message}`)
      throw this.getError(collectionName, 'replace', e)
    }
  }

  /**
   * Removes an existing object from the database
   * @param {String} collectionName The name of the MongoDB collection
   * @param {Object} query
   * @param {external:MongoDBDeleteOptions} options Options to pass to the MongoDB driver
   * @return {Promise} promise
   * @see https://mongodb.github.io/node-mongodb-native/4.2/classes/Collection.html#deleteOne
   */
  async delete (collectionName, query, options) {
    const p = processParams({ query, options })
    try {
      await this.getCollection(collectionName).deleteOne(p.query, p.options)
    } catch (e) {
      this.log('error', `failed to delete doc, ${e.message}`)
      throw this.getError(collectionName, 'delete', e)
    }
  }

  /**
   * Removes multiple objects from the database
   * @param {String} collectionName The name of the MongoDB collection
   * @param {Object} query
   * @param {external:MongoDBDeleteOptions} options Options to pass to the MongoDB driver
   * @return {Promise} promise
   * @see https://mongodb.github.io/node-mongodb-native/4.2/classes/Collection.html#deleteMany
   */
  async deleteMany (collectionName, query, options) {
    const p = processParams({ query, options })
    try {
      await this.getCollection(collectionName).deleteMany(p.query, p.options)
    } catch (e) {
      this.log('error', `failed to delete docs, ${e.message}`)
      throw this.getError(collectionName, 'delete', e)
    }
  }

  /**
   * Registers the isObjectId JSON schema keyword
   */
  async addSchemaKeyword () {
    const jsonschema = await this.app.waitForModule('jsonschema')
    jsonschema.addKeyword({
      keyword: 'isObjectId',
      type: 'string',
      modifying: true,
      schemaType: 'boolean',
      compile: () => {
        return (value, { parentData, parentDataProperty }) => {
          if (!isValidObjectId(value)) {
            return false
          }
          try {
            parentData[parentDataProperty] = parseObjectId(value)
          } catch (e) {
            return false
          }
          return true
        }
      }
    }, { override: true })
  }

  /**
   * Returns the relevant AdaptError instance to match the MongoError
   * @param {String} collectionName DB collection being processed
   * @param {String} action DB action being performed
   * @param {String} error The error message
   * @returns {AdaptError}
   */
  getError (collectionName, action, error) {
    let e = this.app.errors.MONGO_ERROR
    if (error.code === 66) e = this.app.errors.MONGO_IMMUTABLE_FIELD
    else if (error.code === 11000) e = this.app.errors.MONGO_DUPL_INDEX
    return e.setData({ collectionName, action, error: error.message })
  }
}

export default MongoDBModule
