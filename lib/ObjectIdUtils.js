import { App } from 'adapt-authoring-core'
import { isValid } from './utils/isValid.js'
import { parse } from './utils/parse.js'

/**
 * JSON schema integration for MongoDB ObjectIds
 * @memberof mongodb
 */
class ObjectIdUtils {
  /**
   * Registers the isObjectId JSON schema keyword
   */
  static async addSchemaKeyword () {
    const jsonschema = await App.instance.waitForModule('jsonschema')
    jsonschema.addKeyword({
      keyword: 'isObjectId',
      type: 'string',
      modifying: true,
      schemaType: 'boolean',
      compile: () => {
        return (value, { parentData, parentDataProperty }) => {
          if (!isValid(value)) {
            return false
          }
          try {
            parentData[parentDataProperty] = parse(value)
          } catch (e) {
            return false
          }
          return true
        }
      }
    })
  }
}

export default ObjectIdUtils
