import { App, Utils } from 'adapt-authoring-core';
import { ObjectId } from 'mongodb';
/**
 * Utility functions for dealing with MongoDB ObjectIds
 */
class ObjectIdUtils {
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
   * @return {external:mongodb~ObjectId}
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
   * @return {external:mongodb~ObjectId} The converted ID
   * @throws {Error}
   */
  static parse(s) {
    if(s instanceof ObjectId) {
      return s;
    }
    if(!ObjectIdUtils.isValid(s)) {
      throw App.instance.errors.INVALID_OBJECTID.setData({ value: s });
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
      } else if(Array.isArray(v)) {
        v.forEach((v2, i) => {
          try {
            if(typeof v2 === 'string') v[i] = this.parse(v2);
          } catch(e) {} // ignore failures
          this.parseIds(v2);
        });
      } else if(typeof v === 'string' && this.isValid(v)) {
        try {
          o[k] = this.parse(v);
        } catch(e) {} // ignore failures
      }
    });
  }
}

export default ObjectIdUtils;