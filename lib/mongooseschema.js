const { Hookable } = require('adapt-authoring-core');
const mongoose = require('mongoose');

class MongooseSchema {
  static get Types() {
    return mongoose.Schema.Types;
  }
  static get attributes() {
    return {};
  }
  /**
  * Class to represent a Mongoose.Schema
  * @param {Object} definition Data to be used as a schema
  * @param {Object} options Options to pass to the Mongoose.Schema constructor. @see https://mongoosejs.com/docs/api.html#schema_Schema
  */
  constructor() {
    const options = {};
    const __schema = new mongoose.Schema(this.constructor.attributes, options);
    /**
    * Adds a plugin to the schema
    * @param {function} plugin A function which extends functionality. @see https://mongoosejs.com/docs/plugins.html
    */
    this.addPlugin = plugin => __schema.plugin(plugin);

    this.pre = e => __schema.pre[e];
    this.post = e => __schema.post[e];
  }

  set(name, value) {
    // TODO validation
    this.attributes[name] = value;
  }
}

module.exports = MongooseSchema;
