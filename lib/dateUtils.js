const { App } = require('adapt-authoring-core');
/**
* Utility functions for dealing with MongoDB date objects
*/
class DateUtils {
  /**
  * Registers the isDate JSON schema keyword
  */
  static async addSchemaKeyword() {
    const jsonschema = await App.instance.waitForModule('jsonschema');
    jsonschema.addKeyword('isDate', {
      type: 'string',
      modifying: true,
      compile: function () {
        return function (value, dataPath, object, key) {
          try {
            const d = new Date(value);
            object[key] = d;
            return true;
          } catch(e) {
            return false;
          }
        };
      }
    });
  }
}

module.exports = DateUtils;
