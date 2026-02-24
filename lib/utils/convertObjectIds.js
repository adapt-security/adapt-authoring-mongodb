import { isObject } from 'adapt-authoring-core'
import { isValidObjectId } from './isValidObjectId.js'
import { parseObjectId } from './parseObjectId.js'

/**
 * Checks an input object for any strings which pass the parse check and convert matches to ObjectId instances
 * @param {Object} o Object to be checked
 * @memberof mongodb
 */
export function convertObjectIds (o) {
  if (o === undefined) {
    return
  }
  Object.entries(o).forEach(([k, v]) => {
    if (isObject(v)) {
      convertObjectIds(v)
    } else if (Array.isArray(v)) {
      v.forEach((v2, i) => {
        try {
          if (typeof v2 === 'string') v[i] = parseObjectId(v2)
        } catch (e) {} // ignore failures
        convertObjectIds(v2)
      })
    } else if (typeof v === 'string' && isValidObjectId(v)) {
      try {
        o[k] = parseObjectId(v)
      } catch (e) {} // ignore failures
    }
  })
}
