import { App } from 'adapt-authoring-core';
/**
 * Utility functions for dealing with MongoDB date objects
 */
export default class DateUtils {
  /**
   * Registers the isDate JSON schema keyword
   */
  static async addSchemaKeyword() {
    const jsonschema = await App.instance.waitForModule('jsonschema');
    jsonschema.addKeyword({
      keyword: 'isDate',
      type: 'string',
      modifying: true,
      schemaType: 'boolean',
      compile: function() {
        return (value, { parentData, parentDataProperty }) => {
          try {
            parentData[parentDataProperty] = new Date(value);
            return true;
          } catch(e) {
            return false;
          }
        };
      }
    });
  }
}