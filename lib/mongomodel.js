const { Hookable } = require('adapt-authoring-core');
const mongoose = require('mongoose');
const SchemaTypes = require('./schematypes');
/**
* Representation of a Mongoose model
*/
class MongoModel {
  /**
  * Available types for schema attributes
  * @return {SchemaTypes}
  */
  static get SchemaTypes() {
    return SchemaTypes;
  }
  /**
  * Returns the model name
  * @return {string}
  */
  get name() {
    throw new Error('should be overridden in subclasses');
  }
  /**
  * Returns the model collection name
  * @return {string}
  */
  get collectionName() {
    return undefined;
  }
  /**
  * Returns the model's schema
  * @return {Object}
  */
  get schema() {
    throw new Error('should be overridden in subclasses');
  }
  /**
  * Instantiates the model instance
  */
  constructor() {
    const mongooseschema = new mongoose.Schema(this.constructor.schema, {
      collection: this.constructor.collectionName
    });
    /**
    * Adds a plugin to the schema
    * @param {function} plugin A function which extends functionality. @see https://mongoosejs.com/docs/plugins.html
    */
    this.addPlugin = (plugin) => mongooseschema.plugin(plugin);
    /**
    * Defines a 'pre' hook for the schema
    * @type {Function}
    * @see https://mongoosejs.com/docs/api.html#schema_Schema-pre
    * @param {String|RegExp} method method or regular expression to match method name
    * @param {Function} callback callback
    */
    this.pre = (method, callback) => mongooseschema.pre[method](callback);
    /**
    * Defines a 'post' hook for the schema
    * @type {Function}
    * @see https://mongoosejs.com/docs/api.html#schema_Schema-post
    * @param {String|RegExp} method method or regular expression to match method name
    * @param {Function} callback callback
    */
    this.post = (method, callback) => mongooseschema.post[method](callback);
    /**
    * Reference to the compiled Mongoose model class
    * @type {Class}
    * @see https://mongoosejs.com/docs/api.html#Model
    */
    this.compiled = undefined;
  }
}

module.exports = MongoModel;
