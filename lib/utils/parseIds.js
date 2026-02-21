import { isObject } from 'adapt-authoring-core'
import { isValid } from './isValid.js'
import { parse } from './parse.js'

/**
 * Checks an input object for any strings which pass the parse check and convert matches to ObjectId instances
 * @param {Object} o Object to be checked
 * @memberof mongodb
 */
export function parseIds (o) {
  if (o === undefined) {
    return
  }
  Object.entries(o).forEach(([k, v]) => {
    if (isObject(v)) {
      parseIds(v)
    } else if (Array.isArray(v)) {
      v.forEach((v2, i) => {
        try {
          if (typeof v2 === 'string') v[i] = parse(v2)
        } catch (e) {} // ignore failures
        parseIds(v2)
      })
    } else if (typeof v === 'string' && isValid(v)) {
      try {
        o[k] = parse(v)
      } catch (e) {} // ignore failures
    }
  })
}
