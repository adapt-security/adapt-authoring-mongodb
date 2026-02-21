import { parse } from './parse.js'

/**
 * Checks a string is a valid ObjectId
 * @param {String} s String to check
 * @return {Boolean}
 * @memberof mongodb
 */
export function isValid (s) {
  try {
    return parse(s).equals(s)
  } catch (e) {
    return false
  }
}
