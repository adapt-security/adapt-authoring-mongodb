const { App } = require('adapt-authoring-core');

const CodeLookup = {
  11000: 'duplicateindex'
};

class MongoDBError extends Error {
  /** @override */
  constructor(errorKey, mongoError) {
    super(App.instance.lang.t(`error.${errorKey}`), mongoError);
    this.name = this.constructor.toString();
    this.code = mongoError.code;
    this.mongoError = mongoError.errmsg;
  }
  toString() {
    const message = this.toString();
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
