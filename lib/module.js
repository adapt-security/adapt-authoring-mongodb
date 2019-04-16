const { DataStore } = require('adapt-authoring-core');
const errors = require('../lang/en/errors');
const mongoose = require('mongoose');
const MongooseSchema = require('./mongooseschema');

/**
* Represents a single MongoDB server instance
*/
class MongoDB extends DataStore {
  /**
  * Instantiates the module
  * @param {...Object} args Arguments
  */
  constructor(...args) {
    super(...args);
    // TODO need to set connection URI dynamically
    this.connectionURI = `mongodb://localhost:27017/adapt-authoring-test`;
    this.models = {};
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
    this.connection = mongoose.createConnection(this.connectionURI, options);

    this.connection
      .then(connection => this.log('info', `${this.readyState}`))
      .catch(error => this.log(`${errors.ConnectionFail}, ${error}`));

    return this.connection;
  }
  /**
  * Adds a new Mongoose model
  * @param {String} name Name of the model
  * @param {Schema} schema Schema
  */
  addModel(name, schema) {
    if(!this.connection) {
      return this.log(`WARN, ${errors.AddModelFail}, ${errors.NoConnection}`);
    }
    if(!schema instanceof MongooseSchema) {
      return this.log(`WARN, ${errors.AddModelFail}, ${errors.InvalidSchema}`);
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
    return this.connection.models[name];
  }

  /**
  * Adds a plugin to all schemas in the DB
  * @param {function} plugin A function which extends functionality. @see https://mongoosejs.com/docs/plugins.html
  */
  addPlugin(plugin) {
    this.connection.plugin(plugin);
  }
  /**
  * Formats a DataStoreQuery into a structure expected by Mongoose/MongoDB
  * @param {DataStoreQueryQuery} query
  * @return {Object} Formatted data
  */
  formatQuery(query) {
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
  */
  create(data) {
    return new Promise((resolve, reject) => {
      const Model = this.getModel(data.type);

      if(!Model) {
        return reject(`${errors.CreateFail}, ${errors.UnknownModel}`);
      }
      const instance = new Model(data);
      instance.save().then(resolve).catch(reject);
    });
  }

  /**
  * Retrieves documents from the DB
  * @param {DataStoreQuery} query Encapsulates the query
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
      try {
        query.validate();
      } catch(e) {
        return reject(e);
      }
      const Model = this.getModel(query.type);

      if(!Model) {
        return reject(`${errors.RetrieveFail}, ${errors.UnknownModel}`);
      }
      const formatted = this.formatQuery(query);
      const q = Model.find(formatted.query, formatted.options);

      if(formatted.populate) q.populate(formatted.populate);
      q.then(resolve).catch(error => reject(`${errors.RetrieveFail}, ${error.message}`));
    });
  }
  /**
  * Updates documents in the DB
  * @param {DataStoreQuery} query Encapsulates the query
  * @param {Object} data Data to be updated
  */
  update(query, data) {
    return new Promise((resolve, reject) => {
      try {
        query.validate();
      } catch(e) {
        return reject(e);
      }
      const Model = this.getModel(query.type);

      if(!Model) {
        return reject(`${errors.UpdateFail}, ${errors.UnknownModel}`);
      }
      const formatted = this.formatQuery(query);
      // TODO do we want separate functions for one/many?
      formatted.options.multi = formatted.query._id !== undefined;

      Model.update(formatted.query, data, formatted.options)
        .then(resolve)
        .catch(error => reject(`${errors.UpdateFail}, ${error.message}`));
    });
  }
  /**
  * Updates documents in the DB
  * @param {DataStoreQuery} query Encapsulates the query
  * @param {Object} data Data to be updated
  */
  delete(query) {
    return new Promise((resolve, reject) => {
      try {
        query.validate();
      } catch(e) {
        return reject(e);
      }
      const Model = this.getModel(query.type);

      if(!Model) {
        return reject(`${errors.DeleteFail}, ${errors.UnknownModel}`);
      }
      const formatted = this.formatQuery(query);
      Model.deleteMany(formatted.query, error => {
        if(error) {
          return reject(`${errors.DeleteFail}, ${error.message}`);
        }
        resolve();
      });
    });
  }
}

module.exports = MongoDB;
