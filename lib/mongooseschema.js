const { Hookable } = require('adapt-authoring-core');
const mongoose = require('mongoose');
/**
* Representation of a Mongoose Schema
*/
class MongooseSchema {
  /**
  * Returns the available Mongoose schema types
  * @return {Object}
  */
  static get Types() {
    return mongoose.Schema.Types;
  }
  /**
  * Returns the schema's attributes
  * @return {Object}
  */
  static get attributes() {
    return {};
  }
  /**
  * Instantiates the schema instance
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
  /**
  * Sets a schema attribute 
  * @param {String} name Name of attribute
  * @param {*} value Value for attribute
  */
  set(name, value) {
    // TODO validation
    this.attributes[name] = value;
  }
}

module.exports = MongooseSchema;
