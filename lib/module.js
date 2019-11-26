const { App, DataStore, DataStoreQuery, DataValidationError, Hook, Responder, Utils } = require('adapt-authoring-core');
const { MongoClient, ObjectID } = require('mongodb');
/**
* Represents a single MongoDB server instance
* @extends {DataStore}
*/
class MongoDBModule extends DataStore {
  /** @override*/
  static formatQuery(query) {
    if(!(query instanceof DataStoreQuery)) {
      throw new Error(App.instance.lang.t('error.expecteddatastorequery'));
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
  getCollection(schemaName) {
    return this.client.db().collection(`${schemaName}s`);
  }
  /** @override */
  constructor(app, pkg) {
    super(app, pkg);
    /** @ignore */ this.client = new MongoClient(this.connectionURI, { useNewUrlParser: true });
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
  }
  /** @override*/
  boot(app, resolve, reject) {
    this.connect().then(resolve).catch(reject);
  }
  /** @override*/
  connect(options = {}) {
    return new Promise((resolve, reject) => {
      this.client.connect(error => {
        if(error) {
          return reject(error);
        }
        this.log('info', this.app.lang.t('info.connected', { uri: this.connectionURI }));
        resolve();
      });
    });
  }
  /** @override*/
  create(data) {
    return new Promise(async (resolve, reject) => {
      try {
        const transformedData = await this.createHook.invoke(data);
        let validatedData = this.validateData(transformedData);
        const coll = this.getCollection(transformedData.type);

        if(!Utils.isArray(validatedData)) {
          validatedData = [validatedData];
        }
        const results = await coll.insertMany(validatedData);
        resolve(results.ops);
      } catch(e) {
        reject(this.formatError('createdocs', e));
      }
    });
  }
  /** @override*/
  retrieve(query) {
    return new Promise((resolve, reject) => {
      const onError = e => reject(this.formatError('retrievedocs', e));
      let options;
      try {
        options = this.formatQuery(query);
      } catch(e) {
        onError(e);
      }
      const cursor = this.getCollection(query.type).find();
      Object.entries(options).forEach(([name,val]) => cursor[name] && cursor[name](val));
      cursor.toArray().then(resolve).catch(onError);
    });
  }
  /** @override*/
  update(query, data) {
    return new Promise(async (resolve, reject) => {
      // try {
      //   const formatted = this.formatInputData(true, query, true, data);
      //   const coll = this.client.db().collection(`${query.type}s`);
      //   const results = await coll.updateOne(formatted.query, formatted.data);
      //   resolve(results);
      // } catch(e) {
      //   reject(this.formatError('updatedocs', e));
      // }
    });
  }
  /** @override*/
  delete(query) {
    return new Promise((resolve, reject) => {
      let formattedQuery;
      try {
        formattedQuery = this.formatQuery(query);
      } catch(e) {
        reject(this.formatError('deletedocs', e));
      }
      this.getCollection(query.type).deleteMany(formattedQuery.filter)
        .then(resolve)
        .catch(reject);
    });
  }
  formatQuery(query) {
    if(!query) {
      const e = new Error(this.app.lang.t('error.expectedquery'));
      e.statusCode = Responder.StatusCodes.Error.User;
      throw e;
    }
    return MongoDBModule.formatQuery(query);
  }
  validateData(data) {
    if(!data) {
      const e = new Error(this.app.lang.t('error.expecteddata'));
      e.statusCode = Responder.StatusCodes.Error.User;
      throw e;
    }
    try {
      App.instance.getModule('jsonschema').validate(data.type, data);
      return data;
    } catch(e) {
      e.statusCode = Responder.StatusCodes.Error.User;
      throw e;
    }
  }
  /**
  * Processes a message, and returns a nicely formatted error
  * @param {String} prefixKey Lang key for the generic return error message
  * @param {Error} error The error
  * @param {Number} statusCode HTTP status code for the error
  * @return {Error}
  */
  formatError(prefixKey, error, statusCode = 500) {
    const e = new Error(`${this.app.lang.t(`error.${prefixKey}`)}, ${error.message}`);
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
