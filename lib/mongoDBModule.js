const { AbstractModule, Hook } = require('adapt-authoring-core');
const { MongoClient } = require('mongodb');
const MongoDBError = require('./mongoDBError');
const ObjectIdUtils = require('./objectIdUtils');
/**
* Represents a single MongoDB server instance
* @extends {AbstractModule}
*/
class MongoDBModule extends AbstractModule {
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
  * Returns the associated MongoDB collection
  * @param {String} collectionName The name of the MongoDB collection
  * @return {mongodb~Collection}
  * @see https://mongodb.github.io/node-mongodb-native/3.4/api/Collection.html
  */
  getCollection(collectionName) {
    return this.client.db().collection(collectionName);
  }
  /**
  * Shortcut for
  * @param {String} collectionName The name of the MongoDB collection
  * @param {String|Array|Object} fieldOrSpec Definition of the index
  * @return {Promise}
  * @see https://mongodb.github.io/node-mongodb-native/3.4/api/Collection.html#createIndex
  */
  async setUniqueIndex(collectionName, fieldOrSpec) {
    try {
      await this.getCollection(collectionName).createIndex(fieldOrSpec, { unique: true });
    } catch(e) {
      this.log('warn', e.toString());
    }
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
    try {
      const result = await this.getCollection(collectionName).insertOne(data, options);
      this.emit('insert', collectionName, undefined, result.ops[0]);
      return result.ops[0];
    } catch(e) {
      throw new MongoDBError('insertdocs', e);
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
      return await this.getCollection(collectionName).find(query, options).toArray();
    } catch(e) {
      throw new MongoDBError('finddocs', e);
    }
  }
  /**
  * Updates an existing object in the data store
  * @param {String} collectionName The name of the MongoDB collection
  * @param {Object} query
  * @param {Object} data
  * @param {Object} options
  * @return {Promise} promise
  * @see https://mongodb.github.io/node-mongodb-native/3.4/api/Collection.html#findOneAndUpdate
  */
  async update(collectionName, query, data, options) {
    const opts = Object.assign({ returnOriginal: false }, options);
    this.ObjectId.parseParamIds(query, data);
    try {
      const [originalDoc] = await this.find(collectionName, query);
      if(!originalDoc) {
        return;
      }
      const { value } = await this.getCollection(collectionName).findOneAndUpdate(query, data, opts);
      this.emit('update', collectionName, originalDoc, value);
      return value;
    } catch(e) {
      throw new MongoDBError('updatedocs', e);
    }
  }
  /**
  * Replaces an existing object in the data store
  * @param {String} collectionName The name of the MongoDB collection
  * @param {Object} query
  * @param {Object} data
  * @param {Object} options
  * @return {Promise} promise
  * @see https://mongodb.github.io/node-mongodb-native/3.4/api/Collection.html#findOneAndReplace
  */
  async replace(collectionName, query, data, options = { returnOriginal: false }) {
    const opts = Object.assign({ returnOriginal: false }, options);
    this.ObjectId.parseParamIds(query, data);
    try {
      const [originalDoc] = await this.find(collectionName, query);
      if(!originalDoc) {
        return;
      }
      const { value } = await this.getCollection(collectionName).findOneAndReplace(query, data, opts);
      this.emit('replace', collectionName, originalDoc, value);
      return value;
    } catch(e) {
      throw new MongoDBError('replacedocs', e);
    }
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
    try {
      const [originalDoc] = await this.find(collectionName, query);
      if(!originalDoc) {
        return;
      }
      const { value } = await this.getCollection(collectionName).deleteOne(query, options);
      this.emit('delete', collectionName, originalDoc);
      return value;
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
}

module.exports = MongoDBModule;
