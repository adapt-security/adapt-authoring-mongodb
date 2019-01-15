const mongoose = require('mongoose');

class Schema {
  /**
  * Class to represent a Mongoose.Schema
  * @param {Object} definition Data to be used as a schema
  * @param {Object} options Options to pass to the Mongoose.Schema constructor. @see https://mongoosejs.com/docs/api.html#schema_Schema
  */
  constructor(definition, options) {
    this.attributes = {};
    this.__schema = new mongoose.Schema(definition, options);
  }

  set(name, value) {
    // TODO validation
    this.attributes[name] = value;
  }

  /**
  * Adds a plugin to the schema
  * @param {function} plugin A function which extends functionality. @see https://mongoosejs.com/docs/plugins.html
  */
  addPlugin() {
    this.__schema.plugin(plugin);
  }

  toSchema() {
    return this.__schema;
  }
}

module.exports = Schema;
