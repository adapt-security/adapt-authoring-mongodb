const { App, Hookable, Utils } = require('adapt-authoring-core');
const mongoose = require('mongoose');
/**
* Representation of a Mongoose model
*/
class MongoModel {
  /**
  * Available types for schema attributes
  * @type {Object}
  * @property {mongoose~Schematype} String {@link https://mongoosejs.com/docs/schematypes.html#strings}
  * @property {mongoose~Schematype} Number {@link https://mongoosejs.com/docs/schematypes.html#numbers}
  * @property {mongoose~Schematype} Date {@link https://mongoosejs.com/docs/schematypes.html#dates}
  * @property {mongoose~Schematype} Buffer {@link https://mongoosejs.com/docs/schematypes.html#buffers}
  * @property {mongoose~Schematype} Boolean {@link https://mongoosejs.com/docs/schematypes.html#booleans}
  * @property {mongoose~Schematype} Mixed {@link https://mongoosejs.com/docs/schematypes.html#mixed}
  * @property {mongoose~Schematype} ObjectId {@link https://mongoosejs.com/docs/schematypes.html#objectids}
  * @property {mongoose~Schematype} Array {@link https://mongoosejs.com/docs/schematypes.html#arrays}
  * @property {mongoose~Schematype} Decimal128
  * @property {mongoose~Schematype} Map {@link https://mongoosejs.com/docs/schematypes.html#maps}
  */
  static get SchemaTypes() {
    return {
      String: Types.String,
      Number: Types.Number,
      Date: Types.Date,
      Buffer: Types.Buffer,
      Boolean: Types.Boolean,
      Mixed: Types.Mixed,
      ObjectId: Types.ObjectId,
      Decimal128: Types.Decimal128,
      Map: Types.Map
    };
  }
  /**
  * Instantiates the model instance
  * @param {{ name: String, schema: Object }} data Data to define the model
  */
  constructor(data) {
    /**
    * Name of the model
    * @type {String}
    */
    this.name = '';
    /**
    * The collection name of the model
    * @type {string}
    */
    this.collectionName = '';
    /**
    * The schema data for the model
    * @type {Object}
    */
    this.schema = {};

    Utils.defineGetter(this, {
      name: data.name,
      collectionName: data.collectionName,
      schema: data.schema
    });
    /**
    * Reference to the compiled Mongoose model class
    * @type {Class}
    * @see https://mongoosejs.com/docs/api.html#Model
    */
    this.compiled = undefined;
    /**
    * Adds a plugin to the schema
    * @param {function} plugin A function which extends functionality
    * @see https://mongoosejs.com/docs/plugins.html
    */
    this.addSchemaPlugin = (plugin) => this.callModelProxy('plugin', plugin);
    /**
    * Add extra data to the schema
    * @param {function} schema Object with paths to add, or another schema
    * @see https://mongoosejs.com/docs/api.html#schema_Schema-add
    * @return {mongoose~Schema} The schema instance
    */
    this.extendSchema = (schema) => this.callModelProxy('add', schema);
    /**
    * Defines a 'pre' hook for the schema
    * @type {Function}
    * @see https://mongoosejs.com/docs/api.html#schema_Schema-pre
    * @param {String|RegExp} method method or regular expression to match method name
    * @param {Function} callback callback
    */
    this.pre = (method, callback) => this.callModelProxy('method', callback);
    /**
    * Defines a 'post' hook for the schema
    * @type {Function}
    * @see https://mongoosejs.com/docs/api.html#schema_Schema-post
    * @param {String|RegExp} method method or regular expression to match method name
    * @param {Function} callback callback
    */
    this.post = (method, callback) => this.callModelProxy('method', callback);
  }
  /**
  * Compiles the
  * @param {mongoose~Connection} connection Connection to the mongoose
  */
  compile(connection) {
    this.compiled = connection.model(this.name, new mongoose.Schema(this.schema, {
      collection: this.constructor.collectionName
    }));
  }
  /**
  * A proxy function which calls a named function on the {@link mongoose~Model}
  * @param {String} func Mongoose function name
  * @param {...*} args Arguments
  */
  /** @ignore */
  callModelProxy(func, ...args) {
    if(!this.compiled) {
      return this.log('error', App.instance.lang.t('error.compilemodel', { func }));
    }
    this.compiled.schema[func].call(this.compiled.schema, ...args);
  }
}

module.exports = MongoModel;
