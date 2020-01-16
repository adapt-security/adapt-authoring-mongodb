const { AbstractModule, App, DataQuery, DataValidationError, Hook, Responder, Utils } = require('adapt-authoring-core');
const { MongoClient, ObjectID } = require('mongodb');

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
    try {
      const transformedData = await this.createHook.invoke(data);
      let validatedData = await this.validateData(transformedData);
      const coll = this.getCollection(transformedData.type);

      if(!Utils.isArray(validatedData)) {
        validatedData = [validatedData];
      }
      const results = await coll.insertMany(validatedData);
      return results.ops;
    } catch(e) {
      throw this.formatError('createdocs', e);
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
      const validatedData = await this.validateData(data);
      results = await this.getCollection(query.type).replaceOne(formattedQuery.filter, validatedData);
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
  * Checks the passed data conforms to the appropriate schema
  * @param {String} data Data to be validated
  * @return {Promise} Rejects on invalid data
  */
  async validateData(data) {
    const validated = Object.assign({}, data);
    if(!validated) {
      throw this.formatError('invaliddata', this.app.lang.t('error.expecteddata'), ErrorCodes.User);
    }
    if(!validated.type) {
      throw this.formatError('invaliddata', this.app.lang.t('error.expectedtype'), ErrorCodes.User);
    }
    const jsonschema = await this.app.waitForModule('jsonschema');
    await jsonschema.validate(validated.type, validated);
    return validated;
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
  /**
  * Processes an incoming validation error(s), and returns a nicely formatted error summarising all issues
  * @param {Error} error The original error
  * @param {String} errorPrefixKey Lang key for the generic return error message
  * @return {DataValidationError}
  */
  formatValidationError(error, errorPrefixKey) {
    if(error.name !== 'ValidationError') {
      return error;
    }
    const e = new DataValidationError(this.app.lang.t(errorPrefixKey));

    Object.entries(error.errors).forEach((key, [{ kind, path, value }]) => {
      switch(kind) {
        case 'required':
          return e.addError(this.app.lang.t('error.isrequired', { path }));
        case 'user defined':
          return e.addError(this.app.lang.t('error.invalidvalue', { path }));
        default:
          this.log('error', this.app.lang.t('error.genericvalidation', { kind, path, value })); break;
      }
    });
    return e;
  }
}

module.exports = MongoDBModule;
