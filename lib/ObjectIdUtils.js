import { App, Utils } from 'adapt-authoring-core';
import { ObjectId } from 'mongodb';
/**
 * Utility functions for dealing with MongoDB ObjectIds
 */
export default class ObjectIdUtils {
  /**
   * Registers the isObjectId JSON schema keyword
   */
  static async addSchemaKeyword() {
    const jsonschema = await App.instance.waitForModule('jsonschema');
    jsonschema.addKeyword({
      keyword: 'isObjectId',
      type: 'string',
      modifying: true,
      schemaType: 'boolean',
      compile: () => {
        return (value, { parentData, parentDataProperty }) => {
          if(!ObjectIdUtils.isValid(value)) {
            return false;
          }
          try {
            parentData[parentDataProperty] = ObjectIdUtils.parse(value);
          } catch(e) {
            return false;
          }
          return true;
        };
      }
    });
  }
  /**
   * Creates a new ObjectId instance
   * @return {ObjectID}
   */
  static create() {
    return ObjectId();
  }
  /**
   * Checks a string is a valid ObjectId
   * @param {String} s String to check
   * @return {Boolean}
   */
  static isValid(s) {
    return ObjectId.isValid(s) && new ObjectId(s).toString() === s;
  }
  /**
   * Converts a string to an ObjectId
   * @param {String} s The string to convert
   * @return {ObjectId} The converted ID
   * @throws {Error}
   */
  static parse(s) {
    if(s instanceof ObjectId) {
      return s;
    }
    if(!ObjectIdUtils.isValid(s)) {
      throw App.instance.errors.INVALID_OBJECTID;
    }
    return new ObjectId(s);
  }
  /**
   * Checks an input object for any strings which pass the parse check and convert matches to ObjectId instances
   * @param {Object} o Object to be checked
   */
  static parseIds(o) {
    Object.entries(o).forEach(([k,v]) => {
      if(Utils.isObject(v)) {
        this.parseIds(v);
      } else if(typeof v === 'string' && this.isValid(v)) {
        o[k] = this.parse(v);
      }
    });
  }
}