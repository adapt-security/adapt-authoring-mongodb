const { ObjectId } = require('mongodb');

function ValidateObjectId(app) {
  app.jsonschema.validator.addKeyword('isObjectId', {
    type: 'string',
    errors: false,
    modifying: true,
    valid: true,
    compile: function (schema, parentSchema) {
      return function (value, dataPath, object, key) {
        if(!object) {
          return;
        }
        if(!ObjectId.isValid(value)) {
          throw new Error(`Invalid mongodb ObjectId: '${value}'`);
        }
        //  coerce type
        object[key] = new ObjectId(value);
      };
    }
  });
}

module.exports = ValidateObjectId;
