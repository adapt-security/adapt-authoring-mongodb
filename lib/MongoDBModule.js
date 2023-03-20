import { AbstractModule } from 'adapt-authoring-core'
import { MongoClient } from 'mongodb'
import ObjectIdUtils from './ObjectIdUtils.js'
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
    // add custom keywords to JSON Schema validator
    await ObjectIdUtils.addSchemaKeyword()
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
        .setData({ uri: this.getConfig('connectionUri'), error: e.message })
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
      this.log('warn', e.toString())
    }
  }

  /**
   * Makes sure options are in the correct format.
   * @param {Object} options The options to parse
   */
  parseOptions (options) {
    if (!options) {
      return
    }
    ['limit', 'skip'].forEach(o => {
      if (options[o] === undefined) return
      try {
        options[o] = parseInt(options[o])
      } catch (e) {
        this.log('warn', `value for option '${o}' is in an unexpected format and will be ignored`)
        delete options[o]
      }
    })
  }

  /**
   * Adds a new object to the database
   * @param {String} collectionName The name of the MongoDB collection
   * @param {Object} data
   * @param {external:MongoDBInsertOneOptions} options Options to pass to the MongoDB driver
   * @return {Promise} promise
   * @see https://mongodb.github.io/node-mongodb-native/4.2/classes/Collection.html#insertOne
   */
  async insert (collectionName, data, options) {
    this.ObjectId.parseIds(data)
    this.parseOptions(options)
    // MongoDB doesn't like the explicit setting of _id
    delete data._id
    if (data.$set) delete data.$set._id
    try {
      const { insertedId } = await this.getCollection(collectionName).insertOne(data, options)
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
    this.ObjectId.parseIds(query)
    this.parseOptions(options)
    try {
      return await this.getCollection(collectionName).find(query, options).toArray()
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
    const opts = Object.assign({ returnDocument: 'after' }, options)
    this.parseOptions(opts)
    this.ObjectId.parseIds(query)
    this.ObjectId.parseIds(data)
    // MongoDB doesn't like the explicit setting of _id
    delete data._id
    if (data.$set) delete data.$set._id
    try {
      const { value } = await this.getCollection(collectionName).findOneAndUpdate(query, data, opts)
      return value
    } catch (e) {
      this.log('error', `failed to update doc, ${e.message}`)
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
    const opts = Object.assign({ returnDocument: 'after' }, options)
    this.ObjectId.parseIds(query)
    this.ObjectId.parseIds(data)
    this.parseOptions(options)
    // MongoDB doesn't like the explicit setting of _id
    delete data._id
    if (data.$set) delete data.$set._id
    try {
      const result = await this.getCollection(collectionName).findOneAndReplace(query, data, opts)
      return result.value
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
    this.ObjectId.parseIds(query)
    this.parseOptions(options)
    try {
      await this.getCollection(collectionName).deleteOne(query, options)
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
    this.ObjectId.parseIds(query)
    this.parseOptions(options)
    try {
      await this.getCollection(collectionName).deleteMany(query, options)
    } catch (e) {
      this.log('error', `failed to delete docs, ${e.message}`)
      throw this.getError(collectionName, 'delete', e)
    }
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

  /**
   * ObjectId utility functions
   * @type {ObjectIdUtils}
   */
  get ObjectId () {
    return ObjectIdUtils
  }
}

export default MongoDBModule
