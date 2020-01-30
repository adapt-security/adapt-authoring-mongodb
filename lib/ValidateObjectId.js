const { ObjectId } = require('mongodb');

function ValidateObjectId(app) {
  app.jsonschema.validator.addKeyword('isObjectId', {
    type: 'string',
    modifying: true,
    compile: function (schema, parentSchema) {
      return function (value, dataPath, object, key) {
        if(!ObjectId.isValid(value)) {
          return false;
        }
        object[key] = new ObjectId(value);
        return true;
      };
    }
  });
}

module.exports = ValidateObjectId;
