const { DataStore, DataStoreQuery } = require('adapt-authoring-core');
const DataValidationError = require('./datavalidationerror');
const MongoModel = require('./mongomodel');
const mongoose = require('mongoose');
const { updateIfCurrentPlugin } = require('mongoose-update-if-current');

const error = require('../lang/en/error');
const success = require('../lang/en/success');

/**
* Represents a single MongoDB server instance
* @extends {Module}
*/
class MongoDB extends DataStore {
  /** @override*/
  static formatQuery(query) {
    if(!(query instanceof DataStoreQuery)) {
      throw new Error(error.ExpectedDataStoreQuery);
    }
    query.validate();

    const data = {
      query: query.fieldsMatching,
      options: {}
    };
    if(query._id) data.query._id = query._id;
    if(query.limitResultsTo) data.options.limit = query.limitResultsTo;
    if(query.startResultsFrom) data.options.skip = query.startResultsFrom;
    if(query.sortResultsBy) data.options.sort = query.sortResultsBy;
    if(query.aggregateFields) data.populate = query.aggregateFields.join(' ');

    return data;
  }
  /**
  * @param {App} app The App instance
  * @param {Object} config The App configuration
  */
  constructor(app, config) {
    super(app, config);
    /** @ignore */ this.connectionURI = `mongodb://${config.aat_db_host}:${config.aat_db_port}/${config.aat_db_name}`;
    /** @ignore */ this.models = {};
    // optimistic concurrency control for Mongoose
    this.addPlugin(updateIfCurrentPlugin);
  }
  /**
  * Retrieves the ready state of the Mongoose connection
  * @see https://mongoosejs.com/docs/api.html#connection_Connection-readyState
  * @return {Boolean}
  */
  get readyState() {
    if(!this.connection) {
      return mongoose.connection.states[0];
    }
    return this.connection.states[this.connection.readyState];
  }
  /**
  * Determines if the Mongoose connection is connected
  * @return {Boolean}
  */
  get isConnected() {
    return this.readyState === mongoose.connection.states[1];
  }
  /** @override*/
  boot(app, resolve, reject) {
    this.connect().then(resolve).catch(reject);
  }
  /** @override*/
  connect(options = {}) {
    return new Promise((resolve, reject) => {
      /**
      * The Mongoose connection
      * @type {mongoose~Connection}
      */
      this.connection = mongoose.createConnection(this.connectionURI, Object.assign({ useNewUrlParser: true }, options));
      this.connection.then(() => {
        this.log('info', `${this.readyState}`);
        resolve();
      }).catch(reject);
    });
  }
  /**
  * Adds a new Mongoose model
  * @param {Object} data Data to be passed to {@link MongoModel#constructor}
  * @return {MongoModel} The newly added model
  */
  addModel(data) {
    if(!this.connection) {
      return this.log('warn', `${error.AddModelFail} '${data.name}', ${error.NoConnection}`);
    }
    try {
      const m = new MongoModel(data);
      m.compile(this.connection);
      this.models[data.name] = m;
      this.log('debug', `${success.AddModelSuccess} '${data.name}'`);
      return m;
    } catch(e) {
      return this.log('warn', e);
    }
  }
  /**
  * Retrieves an existing MongoModel
  * @param {String} name Name of the model
  * @return {MongoModel} The matching MongoModel instance
  */
  getModel(name) {
    const m = this.models[name];
    if(!m) {
      throw new Error(`${error.GetModelFail} '${name}', ${error.UnknownModel}`);
    }
    return m;
  }
  /**
  * Adds a plugin to all schemas in the DB
  * @param {function} plugin A function which extends functionality
  * @see https://mongoosejs.com/docs/plugins.html
  */
  addPlugin(plugin) {
    mongoose.plugin(plugin);
  }
  /** @override*/
  create(data) {
    return new Promise((resolve, reject) => {
      try {
        const Model = this.getModel(data.type).compiled;
        new Model(data).save()
          .then(resolve)
          .catch(e => reject(this.formatValidationError(e, error.CreateFail)));
      } catch(e) {
        return reject(e);
      }
    });
  }
  /** @override*/
  retrieve(query) {
    return new Promise((resolve, reject) => {
      let formatted, q;
      try {
        formatted = MongoDB.formatQuery(query);
        q = this.getModel(query.type).compiled.find(formatted.query, formatted.options);
      } catch(e) {
        reject(e);
      }
      if(formatted.populate) q.populate(formatted.populate);
      q.then(resolve).catch(error => reject(new Error(`${error.RetrieveFail}, ${error.message}`)));
    });
  }
  /** @override*/
  update(query, data) {
    return new Promise((resolve, reject) => {
      let formatted, Model;
      try {
        formatted = MongoDB.formatQuery(query);
        Model = this.getModel(query.type).compiled;
      } catch(e) {
        reject(e);
      }
      Model.updateMany(formatted.query, data, Object.assign({ runValidators: true }, formatted.options))
        .then(resolve)
        .catch(e => {
          reject(this.formatValidationError(e, error.UpdateFail));
        });
    });
  }
  /** @override*/
  delete(query) {
    return new Promise((resolve, reject) => {
      let formatted, Model;
      try {
        formatted = MongoDB.formatQuery(query);
        Model = this.getModel(query.type).compiled;
      } catch(e) {
        reject(e);
      }
      Model.deleteMany(formatted.query, error => {
        if(error) return reject(new Error(`${error.DeleteFail}, ${error.message}`));
        resolve();
      });
    });
  }
  /**
  * Processes an incoming validation error(s), and returns a nicely formatted error summarising all issues
  * @param {Error} error The original error
  * @param {String} errorPrefix Generic error message for the return error
  * @return {DataValidationError}
  */
  formatValidationError(error, errorPrefix) {
    if(error.name !== 'ValidationError') {
      return error;
    }
    const e = new DataValidationError(errorPrefix);

    Object.entries(error.errors).forEach(([key,{ kind, path, value }]) => {
      let m;
      switch(kind) {
        case 'required': m = `${path} ${error.IsRequired}`; break;
        case 'user defined': m = `${path} ${error.InvalidValue} '${value}'`; break;
        default: console.log('NEW VALIDATION ERROR:', kind, path, value); break;
      }
      e.addError(m);
    });
    return e;
  }
}

module.exports = MongoDB;
