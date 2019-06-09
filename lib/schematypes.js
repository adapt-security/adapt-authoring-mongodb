const Types = require('mongoose').Schema.Types;
/**
* Available data types for Mongo schema attributes
*/
class SchemaTypes {
  /**
  * String type
  * @see https://mongoosejs.com/docs/schematypes.html#strings
  * @return {mongoose~Schematype} The Mongoose SchemaType
  */
  static get String() { return Types.String; }
  /**
  * Number type
  * @see https://mongoosejs.com/docs/schematypes.html#numbers
  * @return {mongoose~Schematype} The Mongoose SchemaType
  */
  static get Number() { return Types.Number; }
  /**
  * Date type
  * @see https://mongoosejs.com/docs/schematypes.html#dates
  * @return {mongoose~Schematype} The Mongoose SchemaType
  */
  static get Date() { return Types.Date; }
  /**
  * Buffer type
  * @see https://mongoosejs.com/docs/schematypes.html#buffers
  * @return {mongoose~Schematype} The Mongoose SchemaType
  */
  static get Buffer() { return Types.Buffer; }
  /**
  * Boolean type
  * @see https://mongoosejs.com/docs/schematypes.html#booleans
  * @return {mongoose~Schematype} The Mongoose SchemaType
  */
  static get Boolean() { return Types.Boolean; }
  /**
  * Mixed type
  * @see https://mongoosejs.com/docs/schematypes.html#mixed
  * @return {mongoose~Schematype} The Mongoose SchemaType
  */
  static get Mixed() { return Types.Mixed; }
  /**
  * ObjectId type
  * @see https://mongoosejs.com/docs/schematypes.html#objectids
  * @return {mongoose~Schematype} The Mongoose SchemaType
  */
  static get ObjectId() { return Types.ObjectId; }
  /**
  * Array type
  * @see https://mongoosejs.com/docs/schematypes.html#arrays
  * @return {mongoose~Schematype} The Mongoose SchemaType
  */
  static get Array() { return Types.Array; }
  /**
  * Decimal128 type
  * @return {mongoose~Schematype} The Mongoose SchemaType
  */
  static get Decimal128() { return Types.Decimal128; }
  /**
  * Map type
  * @see https://mongoosejs.com/docs/schematypes.html#maps
  * @return {mongoose~Schematype} The Mongoose SchemaType
  */
  static get Map() { return Types.Map; }
}

module.exports = SchemaTypes;
