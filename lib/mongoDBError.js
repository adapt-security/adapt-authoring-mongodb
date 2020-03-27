const { App } = require('adapt-authoring-core');

const CodeLookup = {
  11000: 'duplicateindex'
};

class MongoDBError extends Error {
  /** @override */
  constructor(errorKey, mongoError) {
    super();
    this.name = this.constructor.name.toString();
    this.code = mongoError.code;
    this.mongoError = mongoError.errmsg;
    this.message = this.getMessage(errorKey);
  }
  getMessage(errorKey) {
    const message = App.instance.lang.t(`error.${errorKey}`);
    if(!this.code) {
      return message;
    }
    if(CodeLookup[this.code]) {
      return `${message}, ${App.instance.lang.t(`error.${CodeLookup[this.code]}`)}`;
    }
    return `${message}, ${this.mongoError}`;
  }
}

module.exports = MongoDBError;
