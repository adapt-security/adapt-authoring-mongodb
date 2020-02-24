const { AbstractModule, Responder } = require('adapt-authoring-core');
const { MongoClient } = require('mongodb');
const ObjectIdUtils = require('./objectIdUtils');

/** @ignore */ const ErrorCodes = Responder.StatusCodes.Error;
/**
* Represents a single MongoDB server instance
* @extends {AbstractModule}
*/
class MongoDBModule extends AbstractModule {
  /**
  * ObjectId utility functions
  * @type {ObjectIdUtils}
  */
  get ObjectId() {
    return ObjectIdUtils;
  }
  /**
  * Determines if module is connected to the MongoDB
  * @type {Boolean}
  */
  get isConnected() {
    return this.client.isConnected();
  }
  /**
  * The string URI used to connect to the MongoDB instance
  * @type {String}
  * @see https://docs.mongodb.com/manual/reference/connection-string/
  */
  get connectionURI() {
    const username = this.getConfig('username');
    const password = this.getConfig('password');
    const dbname = this.getConfig('dbname');
    const opts = this.getConfig('options');

    const hostString = `${this.getConfig('host')}:${this.getConfig('port')}`;
    let userString = '', dbString = '', optsString = '';

    if(username && password) userString = `${username}:${password}@`;
    if(dbname) dbString = `/${dbname}`;
    if(opts) optsString = `?${opts}`;

    return `mongodb://${userString}${hostString}${dbString}${optsString}`;
  }
  /**
  * Returns the associated MongoDB collection
  * @param {String} collectionName The name of the MongoDB collection
  * @return {mongodb~Collection}
  * @see https://mongodb.github.io/node-mongodb-native/3.3/api/Collection.html
  */
  getCollection(collectionName) {
    return this.client.db().collection(collectionName);
  }
  /** @override */
  constructor(...args) {
    super(...args);
    /** @ignore */ this.client = new MongoClient(this.connectionURI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    this.init();
  }
  /**
  * Initialises the module
  * @return {Promise}
  */
  async init() {
    await this.connect();
    // add ObjectId keyword to JSON Schema validator
    await ObjectIdUtils.addSchemaKeyword();

    this.setReady();
  }
  /**
  * Connects to the database
  * @param {Object} options Any options
  * @return {Promise}
  */
  async connect(options = {}) {
    await this.client.connect(options);
    this.log('info', this.app.lang.t('info.connected', { uri: this.connectionURI }));
  }
  /**
  * Adds a new object to the data store
  * @param {String} collectionName The name of the MongoDB collection
  * @param {Object} data
  * @param {Object} options
  * @return {Promise} promise
  * @see https://mongodb.github.io/node-mongodb-native/3.4/api/Collection.html#insertOne
  */
  async insert(collectionName, data, options = {}) {
    this.ObjectId.parseParamIds(data);
    let results;
    try {
      results = await this.getCollection(collectionName).insertOne(data, options);
    } catch(e) {
      throw this.formatError('createdocs', e);
    }
    try {
      return results.ops[0];
    } catch(e) {
      throw this.formatError('createdocs', this.app.lang.t('error.unexpecteddata'));
    }
  }
  /**
  * Retrieves a new object from the data store
  * @param {String} collectionName The name of the MongoDB collection
  * @param {Object} query
  * @param {Object} options
  * @return {Promise} promise
  * @see https://mongodb.github.io/node-mongodb-native/3.4/api/Collection.html#find
  */
  async find(collectionName, query, options = {}) {
    this.ObjectId.parseParamIds(query);
    try {
      return this.getCollection(collectionName).find(query, options).toArray();
    } catch(e) {
      throw this.formatError('retrievedocs', e);
    }
  }
  /**
  * Updates an existing object in the data store
  * @param {String} collectionName The name of the MongoDB collection
  * @param {Object} query
  * @param {Object} data
  * @param {Object} options
  * @return {Promise} promise
  https://mongodb.github.io/node-mongodb-native/3.4/api/Collection.html#findOneAndUpdate
  */
  async update(collectionName, query, data, options = { returnOriginal: false }) {
    this.ObjectId.parseParamIds(query, data);
    let result;
    try {
      result = await this.getCollection(collectionName).findOneAndUpdate(query, data, options);
    } catch(e) {
      throw this.formatError('updatedocs', e);
    }
    if(!result || !result.ok) {
      throw this.formatError('updatedocs', this.app.lang.t('error.nomatchingdocs'), ErrorCodes.Missing);
    }
    return result.value;
  }
  /**
  * Replaces an existing object in the data store
  * @param {String} collectionName The name of the MongoDB collection
  * @param {Object} query
  * @param {Object} data
  * @param {Object} options
  * @return {Promise} promise
  https://mongodb.github.io/node-mongodb-native/3.4/api/Collection.html#findOneAndReplace
  */
  async replace(collectionName, query, data, options = { returnOriginal: false }) {
    this.ObjectId.parseParamIds(query, data);
    let result;
    try {
      result = await this.getCollection(collectionName).findOneAndReplace(query, data, options);
    } catch(e) {
      throw this.formatError('replacedocs', e);
    }
    if(!result || !result.ok) {
      throw this.formatError('replacedocs', this.app.lang.t('error.nomatchingdocs'), ErrorCodes.Missing);
    }
    return result.value;
  }
  /**
  * Removes a new object from the data store
  * @param {String} collectionName The name of the MongoDB collection
  * @param {Object} query
  * @param {Object} options
  * @return {Promise} promise
  * @see https://mongodb.github.io/node-mongodb-native/3.4/api/Collection.html#deleteOne
  */
  async delete(collectionName, query, options = {}) {
    this.ObjectId.parseParamIds(query);
    let results;
    try {
      results = await this.getCollection(collectionName).deleteOne(query, options);
    } catch(e) {
      throw this.formatError('deletedocs', e);
    }
    if(!results.deletedCount) {
      throw this.formatError('deletedocs', this.app.lang.t('error.nomatchingdocs'), ErrorCodes.Missing);
    }
    return results.results;
  }
  /**
  * Processes a message, and returns a nicely formatted error
  * @param {String} prefixKey Lang key for the generic return error message
  * @param {Error|String} error The error
  * @param {Number} statusCode HTTP status code for the error
  * @return {Error}
  */
  formatError(prefixKey, error = '', statusCode = 500) {
    const e = new Error(`${this.app.lang.t(`error.${prefixKey}`)} ${error.message || error}`);
    e.statusCode = error.statusCode || statusCode;
    return e;
  }
}

module.exports = MongoDBModule;
