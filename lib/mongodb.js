const { DataStore } = require('adapt-authoring-core');
const errors = require('./errors');
const mongoose = require('mongoose');
const MongooseSchema = require('./mongooseschema');

/**
* Represents a single MongoDB server instance
* @param {String} connectionURI URI accessor for the database
* @param {Object} options
* TODO should we check connection before relevantmethods?
*/
class MongoDB extends DataStore {
  constructor(...args) {
    super(...args);
    // TODO need to set connection URI dynamically
    this.connectionURI = `mongodb://localhost:27017/adapt-authoring-test`;
    this.models = {};
  }

  boot(app, resolve, reject) {
    this.connect().then(resolve).catch(reject);
  }

  get readyState() {
    if(!this.connection) {
      return mongoose.connection.states[0];
    }
    return this.connection.states[this.connection.readyState];
  }

  get isConnected() {
    return this.readyState === mongoose.connection.states[1];
  }

  /**
  * Connects to the database. Creates a new connection
  * @param {Object} options Options to pass to Mongoose.connect. @see https://mongoosejs.com/docs/api.html#mongoose_Mongoose-connect
  * @return {Promise}
  */
  connect(options = {}) {
    this.connection = mongoose.createConnection(this.connectionURI, options);

    this.connection
      .then(connection => console.log(`${this.name}.connect: ${this.readyState}`))
      .catch(error => console.log(`${errors.ConnectionError}, ${error}`));

    return this.connection;
  }

  /**
  * Adds a new Mongoose model
  * @param {String} name Name of the model
  * @param {Schema} schema Schema
  */
  addModel(name, schema) {
    if(!this.connection) {
      return console.log('WARN, CONNECTION NOT ESTABLISHED');
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

  formatQuery(query) {
    return {
      query: query.fieldsMatching,
      options: {
        limit: query.limitResultsTo,
        skip: query.startResultsFrom,
        sort: query.sortResultsBy,
      },
      populate: query.aggregateFields.join(' ')
    };
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
  */
  retrieve(query) {
    return new Promise((resolve, reject) => {
      const Model = this.getModel(query.type);

      if(!Model) {
        return reject(`${errors.RetrieveError}, ${errors.UnknownModel}`);
      }
      const formatted = this.formatQuery(query);

      Model.find(formatted.query, formatted.options).populate(formatted.populate)
        .then(resolve)
        .catch(error => reject(`${errors.RetrieveError}, ${error.message}`));
    });
  }
}

module.exports = MongoDB;
