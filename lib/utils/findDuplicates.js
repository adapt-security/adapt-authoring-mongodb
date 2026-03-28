/**
 * Finds documents with duplicate values for the given index fields.
 * @param {external:MongoDBCollection} collection The MongoDB collection to search
 * @param {String|Object} fieldOrSpec The index field spec (string key or object with field:direction pairs)
 * @returns {Promise<Array<{keyValue: Object, _ids: Array}>>} Array of duplicate groups
 */
export async function findDuplicates (collection, fieldOrSpec) {
  const fields = getFieldNames(fieldOrSpec)
  const groupId = Object.fromEntries(fields.map(f => [f, `$${f}`]))
  return collection.aggregate([
    { $group: { _id: groupId, _ids: { $push: '$_id' }, count: { $sum: 1 } } },
    { $match: { count: { $gt: 1 } } },
    { $project: { _id: 0, keyValue: '$_id', _ids: 1 } }
  ]).toArray()
}

/**
 * Normalises a fieldOrSpec value into an array of field name strings.
 * @param {String|Object} fieldOrSpec
 * @returns {String[]}
 */
export function getFieldNames (fieldOrSpec) {
  if (typeof fieldOrSpec === 'string') return [fieldOrSpec]
  return Object.keys(fieldOrSpec)
}
