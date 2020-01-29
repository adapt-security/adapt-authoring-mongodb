const { AbstractModule, App, DataQuery, Hook, Responder } = require('adapt-authoring-core');
const { MongoClient, ObjectID } = require('mongodb');
const ValidateObjectId = require('./ValidateObjectId');

const ErrorCodes = Responder.StatusCodes.Error;
/**
* Represents a single MongoDB server instance
* @extends {AbstractModule}
*/
class MongoDBModule extends AbstractModule {
  /**
  * Converts a DataQuery instance into an object which makes sense to the MongoDB driver
  * @param {DataQuery} query Input query
  * @return {Object} Output data which can be fed directly to MongoDB
  */
  static formatQuery(query) {
    if(!query || !(query instanceof DataQuery)) {
      const e = new Error(App.instance.lang.t('error.expecteddataquery'));
      e.statusCode = ErrorCodes.User;
      throw e;
    }
    query.validate();

    const data = {};
    if(query.fieldsMatching) {
      data.filter = query.fieldsMatching || {};
      if(data.filter._id) data.filter._id = new ObjectID(data.filter._id);
    }
    if(query.limitResultsTo) {
      data.limit = query.limitResultsTo;
    }
    if(query.includeFields) {
      data.projection = query.includeFields;
    }
    if(query.startResultsFrom) {
      data.skip = query.startResultsFrom;
    }
    if(query.sortResultsBy) {
      data.sort = query.sortResultsBy;
    }
    return data;
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
  * @param {String} schemaName The schema name for the collection you want
  * @return {mongodb~Collection}
  * @see https://mongodb.github.io/node-mongodb-native/3.3/api/Collection.html
  */
  getCollection(schemaName) {
    return this.client.db().collection(`${schemaName}s`);
  }
  /** @override */
  constructor(...args) {
    super(...args);
    /** @ignore */ this.client = new MongoClient(this.connectionURI, { useNewUrlParser: true, useUnifiedTopology: true });
    /**
    * Hook invoked on document creation
    * @type {Hook}
    */
    this.createHook = new Hook({ type: Hook.Types.Series, mutable: true });
    /**
    * Hook invoked on document update
    * @type {Hook}
    */
    this.updateHook = new Hook({ type: Hook.Types.Series, mutable: true });

    this.init();
  }
  /**
  * Initialises the module
  * @return {Promise}
  */
  async init() {
    await this.connect();
    // add ObjectId keyword to JSON Schema validator
    ValidateObjectId(this.app);

    this.setReady();
  }
  /**
  * Connects to the database
  * @param {Object} options Any options
  * @return {Promise}
  */
  async connect(options = {}) {
    await this.client.connect();
    this.log('info', this.app.lang.t('info.connected', { uri: this.connectionURI }));
  }
  /**
  * Adds a new object to the data store
  * @param {Object} data
  * @return {Promise} promise
  */
  async create(data) {
    let results;
    try {
      const postHookData = await this.createHook.invoke(data);
      const coll = this.getCollection(postHookData.type);
      results = (await coll.insertMany([postHookData]));
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
  * @param {DataQuery} query
  * @return {Promise} promise
  */
  async retrieve(query) {
    try {
      const options = MongoDBModule.formatQuery(query);
      const cursor = this.getCollection(query.type).find();
      Object.entries(options).forEach(([name,val]) => cursor[name] && cursor[name](val));
      return (await cursor.toArray());
    } catch(e) {
      throw this.formatError('retrievedocs', e);
    }
  }
  /**
  * Updates existing objects in the data store
  * @param {DataQuery} query
  * @param {Object} data
  * @return {Promise} promise
  */
  async update(query, data) {
    let results;
    try {
      const formattedQuery = MongoDBModule.formatQuery(query);
      results = await this.getCollection(query.type).replaceOne(formattedQuery.filter, data);
    } catch(e) {
      throw this.formatError('updatedocs', e);
    }
    if(!results.modifiedCount) {
      throw this.formatError('updatedocs', this.app.lang.t('error.nomatchingdocs'), ErrorCodes.Missing);
    }
  }
  /**
  * Removes a new object from the data store
  * @param {DataQuery} query
  * @return {Promise} promise
  */
  async delete(query) {
    let results;
    try {
      const formattedQuery = MongoDBModule.formatQuery(query);
      results = await this.getCollection(query.type).deleteOne(formattedQuery.filter);
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
