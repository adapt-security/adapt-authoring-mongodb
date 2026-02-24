import { parseObjectId } from './parseObjectId.js'

/**
 * Checks a string is a valid ObjectId
 * @param {String} s String to check
 * @return {Boolean}
 * @memberof mongodb
 */
export function isValidObjectId (s) {
  try {
    return parseObjectId(s).equals(s)
  } catch (e) {
    return false
  }
}
