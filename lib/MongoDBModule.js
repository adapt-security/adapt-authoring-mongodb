import { AbstractModule } from 'adapt-authoring-core';
import DateUtils from './DateUtils.js';
import { MongoClient } from 'mongodb';
import MongoDBError from './MongoDBError.js';
import ObjectIdUtils from './ObjectIdUtils.js';
/**
 * Represents a single MongoDB server instance
 * @extends {AbstractModule}
 */
export default class MongoDBModule extends AbstractModule {
  /** @override */
  async init() {
    await this.app.waitForModule('config');
    /**
     * Reference to the MongDB client
     * @type {mongodb~MongoClient}
     */
    this.client = new MongoClient(this.getConfig('connectionUri'), { ignoreUndefined: true });
    try {
      await this.connect();
    } catch(e) {
      throw new Error(e.message);
    }
    // add custom keywords to JSON Schema validator
    await DateUtils.addSchemaKeyword();
    await ObjectIdUtils.addSchemaKeyword();
  }
  /**
   * Connects to the database
   * @return {Promise}
   */
  async connect() {
    await this.client.connect();
    this.log('info', `connected to ${this.getConfig('connectionUri')}`);
  }
  /**
   * Get all the db statistics
   * @return {Promise}
   * @see https://mongodb.github.io/node-mongodb-native/4.2/classes/Db.html#stats
   */
  async getStats() {
    return this.client.db().stats();
  }
  /**
   * Returns the associated MongoDB collection
   * @param {String} collectionName The name of the MongoDB collection
   * @return {mongodb~Collection}
   * @see https://mongodb.github.io/node-mongodb-native/4.2/classes/Collection.html
   */
  getCollection(collectionName) {
    return this.client.db().collection(collectionName);
  }
  /**
   * Set an index on a MongoDB collection
   * @param {String} collectionName The name of the MongoDB collection
   * @param {String|Array|Object} fieldOrSpec Definition of the index
   * @param {Object} options Options
   * @return {Promise}
   * @see https://mongodb.github.io/node-mongodb-native/4.2/classes/Collection.html#createIndex
   */
  async setIndex(collectionName, fieldOrSpec, options) {
    try {
      await this.getCollection(collectionName).createIndex(fieldOrSpec, options);
    } catch(e) {
      this.log('warn', e.toString());
    }
  }
  /**
   * Makes sure options are in the correct format.
   * @param {Object} options The options to parse
   */
  parseOptions(options) {
    if(!options) {
      return;
    }
    ['limit', 'skip'].forEach(o => {
      if(options[o] === undefined) return;
      try {
        options[o] = parseInt(options[o]);
      } catch(e) {
        this.log('warn', `value for option '${o}' is in an unexpected format and will be ignored`);
        delete options[o];
      }
    });
  }
  /**
   * Adds a new object to the database
   * @param {String} collectionName The name of the MongoDB collection
   * @param {Object} data
   * @param {Object} options
   * @return {Promise} promise
   * @see https://mongodb.github.io/node-mongodb-native/4.2/classes/Collection.html#insertOne
   */
  async insert(collectionName, data, options) {
    this.ObjectId.parseIds(data);
    this.parseOptions(options);
    // MongoDB doesn't like the explicit setting of _id
    delete data._id;
    if(data.$set) delete data.$set._id;
    try {
      const { insertedId } = await this.getCollection(collectionName).insertOne(data, options);
      const [doc] = await this.find(collectionName, { _id: insertedId });
      return doc;
    } catch(e) {
      throw new MongoDBError('insertdocs', e);
    }
  }
  /**
   * Retrieves a new object from the database
   * @param {String} collectionName The name of the MongoDB collection
   * @param {Object} query
   * @param {Object} options
   * @return {Promise} promise
   * @see https://mongodb.github.io/node-mongodb-native/4.2/classes/Collection.html#find
   */
  async find(collectionName, query, options) {
    this.ObjectId.parseIds(query);
    this.parseOptions(options);
    try {
      return await this.getCollection(collectionName).find(query, options).toArray();
    } catch(e) {
      throw new MongoDBError('finddocs', e);
    }
  }
  /**
   * Updates an existing object in the database
   * @param {String} collectionName The name of the MongoDB collection
   * @param {Object} query
   * @param {Object} data
   * @param {Object} options
   * @return {Promise} promise
   * @see https://mongodb.github.io/node-mongodb-native/4.2/classes/Collection.html#findOneAndUpdate
   */
  async update(collectionName, query, data, options) {
    const opts = Object.assign({ returnDocument: 'after' }, options);
    this.ObjectId.parseIds(query);
    this.ObjectId.parseIds(data);
    this.parseOptions(options);
    // MongoDB doesn't like the explicit setting of _id
    delete data._id;
    if(data.$set) delete data.$set._id;
    try {
      const { value } = await this.getCollection(collectionName).findOneAndUpdate(query, data, opts);
      return value;
    } catch(e) {
      throw new MongoDBError('updatedocs', e);
    }
  }
  /**
   * Replaces an existing object in the database
   * @param {String} collectionName The name of the MongoDB collection
   * @param {Object} query
   * @param {Object} data
   * @param {Object} options
   * @return {Promise} promise
   * @see https://mongodb.github.io/node-mongodb-native/4.2/classes/Collection.html#findOneAndReplace
   */
  async replace(collectionName, query, data, options) {
    const opts = Object.assign({ returnDocument: 'after' }, options);
    this.ObjectId.parseIds(query);
    this.ObjectId.parseIds(data);
    this.parseOptions(options);
    // MongoDB doesn't like the explicit setting of _id
    delete data._id;
    if(data.$set) delete data.$set._id;
    try {
      const result = await this.getCollection(collectionName).findOneAndReplace(query, data, opts);
      return result.value;
    } catch(e) {
      throw new MongoDBError('replacedocs', e);
    }
  }
  /**
   * Removes an existing object from the database
   * @param {String} collectionName The name of the MongoDB collection
   * @param {Object} query
   * @param {Object} options
   * @return {Promise} promise
   * @see https://mongodb.github.io/node-mongodb-native/4.2/classes/Collection.html#deleteOne
   */
  async delete(collectionName, query, options) {
    this.ObjectId.parseIds(query);
    this.parseOptions(options);
    try {
      await this.getCollection(collectionName).deleteOne(query, options);
    } catch(e) {
      throw new MongoDBError('deletedocs', e);
    }
  }
  /**
   * Removes multiple objects from the database
   * @param {String} collectionName The name of the MongoDB collection
   * @param {Object} query
   * @param {Object} options
   * @return {Promise} promise
   * @see https://mongodb.github.io/node-mongodb-native/4.2/classes/Collection.html#deleteMany
   */
  async deleteMany(collectionName, query, options) {
    this.ObjectId.parseIds(query);
    this.parseOptions(options);
    try {
      await this.getCollection(collectionName).deleteMany(query, options);
    } catch(e) {
      throw new MongoDBError('deletedocs', e);
    }
  }
  /**
   * ObjectId utility functions
   * @type {ObjectIdUtils}
   */
  get ObjectId() {
    return ObjectIdUtils;
  }
}