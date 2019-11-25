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
  /** @override */
  constructor(app, pkg) {
    super(app, pkg);
    /** @ignore */ this.client = new MongoClient(this.connectionURI, { useNewUrlParser: true });
    const hookOpts = { type: Hook.Types.Series, mutable: true };
    this.createHook = new Hook(hookOpts);
    this.updateHook = new Hook(hookOpts);
    this.deleteHook = new Hook(hookOpts);
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
        const coll = this.client.db().collection(`${transformedData.type}s`);

        if(!Utils.isArray(validatedData)) {
          validatedData = [validatedData];
        }
        const results = await coll.insertMany(validatedData);
        resolve({
          message: this.app.lang.t('info.createdocssuccess'),
          data: results.ops
        });
      } catch(e) {
        reject(this.formatError(e, 'error.createdocs'));
      }
    });
  }
  /** @override*/
  retrieve(query) {
    return new Promise((resolve, reject) => {
      const onError = e => reject(this.formatError(e, 'error.retrievedocs'));
      let options;
      try {
        options = this.formatQuery(query);
      } catch(e) {
        onError(e);
      }
      const cursor = this.client.db().collection(`${query.type}s`).find();
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
      //   const results = await coll.updateMany(formatted.query, formatted.data);
      //   resolve(results);
      // } catch(e) {
      //   reject(this.formatError(e, 'error.updatedocs'));
      // }
    });
  }
  /** @override*/
  delete(query) {
    return new Promise((resolve, reject) => {
      // try {
      //   const formatted = this.formatInputData(true, query);
      //   const coll = this.client.db().collection(`${query.type}s`);
      //   coll.deleteMany(formatted.query).then(resolve).catch(reject);
      // } catch(e) {
      //   reject(this.formatError(e, 'error.deletedocs'));
      // }
    });
  }
  formatQuery(query) {
    if(!query) {
      const e = new Error(this.app.lang.t('error.expectedquery'));
      e.statusCode = 400;
      throw e;
    }
    return MongoDBModule.formatQuery(query);
  }
  validateData(data) {
    if(!data) {
      const e = new Error(this.app.lang.t('error.expecteddata'));
      e.statusCode = 400;
      throw e;
    }
    try {
      App.instance.getModule('jsonschema').validate(data.type, data);
      return data;
    } catch(e) {
      e.statusCode = 400;
      throw e;
    }
  }
  /**
  * Processes a message, and returns a nicely formatted error
  * @param {String|Error} message The error message
  * @param {String} errorPrefixKey Lang key for the generic return error message
  * @param {Number} statusCode HTTP status code for the error
  * @return {Error}
  */
  formatError(message, errorPrefixKey, statusCode = 500) {
    if(typeof message === Error) {
      if(typeof message.statusCode) statusCode = message.statusCode;
      message = message.message;
    }
    const e = new Error(`${this.app.lang.t(errorPrefixKey)}, ${message}`);
    e.statusCode = statusCode;
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
