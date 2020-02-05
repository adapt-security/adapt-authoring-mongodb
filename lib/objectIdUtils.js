const { App } = require('adapt-authoring-core');
const { ObjectId } = require('mongodb');

class ObjectIdUtils {
  /**
  * Registers the isObjectId JSON schema keyword
  */
  static async addSchemaKeyword() {
    const jsonschema = await App.instance.waitForModule('jsonschema');
    jsonschema.addKeyword('isObjectId', {
      type: 'string',
      modifying: true,
      compile: function (schema, parentSchema) {
        return function (value, dataPath, object, key) {
          if(!ValidateObjectId(value)) {
            return false;
          }
          object[key] = new ObjectId(value);
          return true;
        };
      }
    });
  }
  /**
  * Checks a string is a valid ObjectId
  * @param {String} s String to check
  * @return {Boolean}
  */
  static isValid(s) {
    return ObjectId.isValid(s);
  }
  /**
  * Converts a string to an ObjectId
  * @param {String} s The string to convert
  * @return {ObjectId} The converted ID
  * @throws {Error}
  */
  static parse(s) {
    if(!this.isValid(s)) {
      throw new Error('Not a valid ObjectId');
    }
    return new ObjectId(s);
  }
  /**
  * Checks incoming params for an _id, and attempts to parse it to an ObjectId
  * @param {...*} params Params to parse
  * @throws {Error}
  */
  static parseParamIds(...params) {
    params.forEach(p => {
      if(!p || !p.hasOwnProperty('_id')) return;
      try { p._id = this.parse(p._id); } catch(e) {} // do nothing on error
    });
  }
}

module.exports = ObjectIdUtils;
