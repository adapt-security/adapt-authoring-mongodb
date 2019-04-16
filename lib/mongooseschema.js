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
    /**
    * Defines a 'pre' hook for the schema
    * @type {Function}
    * @see https://mongoosejs.com/docs/api.html#schema_Schema-pre
    * @param {String|RegExp} method method or regular expression to match method name
    * @param {Function} callback callback
    */
    this.pre = (method, callback) => __schema.pre[method];
    /**
    * Defines a 'post' hook for the schema
    * @type {Function}
    * @see https://mongoosejs.com/docs/api.html#schema_Schema-post
    * @param {String|RegExp} method method or regular expression to match method name
    * @param {Function} callback callback
    */
    this.post = (method, callback) => __schema.post[method];
  }
  /**
  * Sets a schema attribute
  * @param {String} name Name of attribute
  * @param {*} value Value for attribute
  * @todo validation
  */
  set(name, value) {
    this.attributes[name] = value;
  }
}

module.exports = MongooseSchema;
