const mongoose = require('mongoose');
const Schema = require('./schema');

/**
* Represents a single MongoDB server instance
* @param {String} connectionURI URI accessor for the database
* @param {Object} options
*/
class MongoDB extends DataStore {
  constructor(connectionURI) {
    super();
    if(!connectionURI) {
      throw new Error('Expected a connection URI, none provided');
    }
    this.defineGetter('connectionURI', options.connectionURI);
  }

  preload(app, resolve, reject) {
    app.datastore = this;
    resolve();
  }

  boot(app, resolve, reject) {
    this.connect({}).then(resolve).catch(reject);
  }

  /**
  * Connects to the database
  * @param {Object} options Options to pass to Mongoose.connect. @see https://mongoosejs.com/docs/api.html#mongoose_Mongoose-connect
  */
  connect(options) {
    mongoose.connect(this.connectionURI, options)
      .then(connection => {
        console.log(`${this.name}::connect: connected!! ${connection}`);
      })
      .catch(error => {
        console.log(`${this.name}::connect: fail!! ${error}`);
      });
  }

  /**
  * Adds a new Mongoose model
  * @param {String} name Name of the model
  * @param {Schema} schema Schema instance
  */
  addModel(name, schema) {
    // TODO add check for existing
    mongoose.model(name, schema);
  }

  /**
  * Retrieves an existing Mongoose model
  * @param {String} name Name of the model
  * @param {Schema} schema Schema instance
  */
  addModel(name, schema) {
    if(!schema instanceof Schema) {
      throw new Error('schema must be a valid Schema instance');
    }
    // TODO add check for existing
    mongoose.model(name, schema);
  }

  /**
  * Adds a plugin to all schemas in the DB
  * @param {function} plugin A function which extends functionality. @see https://mongoosejs.com/docs/plugins.html
  */
  addPlugin(plugin) {
    mongoose.plugin(plugin);
  }
}

module.exports = MongoDB;
