const { DataStore, DataStoreQuery } = require('adapt-authoring-core');
const errors = require('../lang/en/errors');
const mongoose = require('mongoose');
const MongooseSchema = require('./mongooseschema');
const { updateIfCurrentPlugin } = require('mongoose-update-if-current');

/**
* Represents a single MongoDB server instance
* @extends {Module}
*/
class MongoDB extends DataStore {
  /**
  * Instantiates the module
  * @param {...Object} args Arguments
  */
  constructor(app, config) {
    super(app, config);
    // TODO need to set connection URI dynamically
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
  /**
  * Run boot sequence
  * @param {Module} app App instance
  * @param {Function} resolve Function to call on fulfilment
  * @param {Function} reject Function to call on rejection
  */
  boot(app, resolve, reject) {
    this.connect().then(resolve).catch(reject);
  }
  /**
  * Connects to the database. Creates a new connection
  * @param {Object} options Options to pass to Mongoose.connect. @see https://mongoosejs.com/docs/api.html#mongoose_Mongoose-connect
  * @return {Promise}
  */
  connect(options = {}) {
    /** @ignore */
    /** @todo remove useNewUrlParser once old parser has been deprecated */
    this.connection = mongoose.createConnection(this.connectionURI, Object.assign({ useNewUrlParser: true }, options));
    this.connection.then(connection => this.log('info', `${this.readyState}`));
    return this.connection;
  }
  /**
  * Adds a new Mongoose model
  * @param {String} name Name of the model
  * @param {Schema} schema Schema
  */
  addModel(name, schema) {
    if(!this.connection) {
      return this.log(`warn, ${errors.AddModelFail}, ${errors.NoConnection}`);
    }
    if(!schema instanceof MongooseSchema) {
      return this.log(`warn, ${errors.AddModelFail}, ${errors.InvalidSchema}`);
    }
    // TODO add check for existing (although also want to be able to replace)
    this.connection.model(name, new mongoose.Schema(schema.attributes));
    return this.getModel(name);
  }

  /**
  * Retrieves an existing Mongoose model
  * @param {String} name Name of the model
  * @return {Schema} schema Schema instance
  */
  getModel(name) {
    const Model = this.connection.models[name];
    if(!Model) {
      throw new Error(`${errors.UpdateFail}, ${errors.UnknownModel}`);
    }
    return Model;
  }

  /**
  * Adds a plugin to all schemas in the DB
  * @param {function} plugin A function which extends functionality. @see https://mongoosejs.com/docs/plugins.html
  */
  addPlugin(plugin) {
    mongoose.plugin(plugin);
  }
  /**
  * Formats a DataStoreQuery into a structure expected by Mongoose/MongoDB
  * @param {DataStoreQueryQuery} query
  * @return {Object} Formatted data
  */
  formatQuery(query) {
    if(!(query instanceof DataStoreQuery)) {
      throw new Error(errors.ExpectedDataStoreQuery);
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
  * Creates a new document in the DB
  * @param {Object} data Data for new doc
  * @return {Promise}
  */
  create(data) {
    return new Promise((resolve, reject) => {
      let Model;
      try {
        Model = this.getModel(data.type);
      } catch(e) {
        reject(e);
      }
      const instance = new Model(data);
      instance.save()
        .then(resolve)
        .catch(e => {
          reject(this.formatValidationError(e, errors.CreateFail));
        });
    });
  }

  /**
  * Retrieves documents from the DB
  * @param {DataStoreQuery} query Encapsulates the query
  * @return {Promise}
  * @example
  * Model.
  *   find({ occupation: /host/ }).
  *   where('name.last').equals('Ghost').
  *   where('age').gt(17).lt(66).
  *   where('likes').in(['vaporizing', 'talking']).
  *   limit(10).
  *   sort('-occupation').
  *   select('name occupation').
  *   exec(callback);
  */
  retrieve(query) {
    return new Promise((resolve, reject) => {
      let formatted, q;
      try {
        formatted = this.formatQuery(query);
        q = this.getModel(query.type).find(formatted.query, formatted.options);
      } catch(e) {
        reject(e);
      }
      if(formatted.populate) q.populate(formatted.populate);
      q.then(resolve).catch(error => reject(new Error(`${errors.RetrieveFail}, ${error.message}`)));
    });
  }
  /**
  * Updates documents in the DB
  * @param {DataStoreQuery} query Encapsulates the query
  * @param {Object} data Data to be updated
  * @return {Promise}
  */
  update(query, data) {
    return new Promise((resolve, reject) => {
      let formatted, Model;
      try {
        formatted = this.formatQuery(query);
        Model = this.getModel(query.type);
      } catch(e) {
        reject(e);
      }
      Model.updateMany(formatted.query, data, Object.assign({ runValidators: true }, formatted.options))
        .then(resolve)
        .catch(e => {
          reject(this.formatValidationError(e, errors.UpdateFail));
        });
    });
  }
  /**
  * Deletes documents in the DB
  * @param {DataStoreQuery} query Encapsulates the query
  * @return {Promise}
  */
  delete(query) {
    return new Promise((resolve, reject) => {
      let formatted, Model;
      try {
        formatted = this.formatQuery(query);
        Model = this.getModel(query.type);
      } catch(e) {
        reject(e);
      }
      Model.deleteMany(formatted.query, error => {
        if(error) return reject(new Error(`${errors.DeleteFail}, ${error.message}`));
        resolve();
      });
    });
  }

  formatValidationError(error, errorPrefix) {
    if(error.name !== 'ValidationError') {
      return error;
    }
    const e = new DataValidationError(errorPrefix);

    Object.entries(error.errors).forEach(([key,{ kind, path, value }]) => {
      let m;
      switch(kind) {
        case 'required': m = `${path} ${errors.IsRequired}`; break;
        case 'user defined': m = `${path} ${errors.InvalidValue} '${value}'`; break;
        default: console.log('NEW VALIDATION ERROR:', kind, path, value); break;
      }
      e.addError(m);
    });
    return e;
  }
}

class DataValidationError extends Error {
  constructor(messagePrefix) {
    super(...arguments);
    this.name = this.constructor.name;
    this.messagePrefix = messagePrefix;
    this.errors = [];
  }
  addError(e) {
    this.errors.push(e);
    this.message = `${this.messagePrefix}: ${this.errors.join(', ')}.`;
  }
}

module.exports = MongoDB;
