const { Schema } = require('mongoose');

class Schema {
  /**
  * Class to represent a Mongoose.Schema
  * @param {Object} definition Data to be used as a schema
  * @param {Object} options Options to pass to the Mongoose.Schema constructor. @see https://mongoosejs.com/docs/api.html#schema_Schema
  */
  constructor(definition, options) {
    super.apply(this, arguments);

    this.__schema = new Schema(definition, options);
  }

  /**
  * Adds a plugin to the schema
  * @param {function} plugin A function which extends functionality. @see https://mongoosejs.com/docs/plugins.html
  */
  addPlugin() {
    this.__schema.plugin(plugin);
  }
}

module.exports = Schema;
