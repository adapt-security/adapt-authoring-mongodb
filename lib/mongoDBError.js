const { App } = require('adapt-authoring-core');

/** @ignore */ const CodeLookup = {
  11000: 'duplicateindex'
};
/**
* Defines errors related to MongoDB operations
*/
class MongoDBError extends Error {
  /** @override */
  constructor(errorKey, mongoError) {
    super();
    /**
    * Name of the error
    * @type {String}
    */
    this.name = this.constructor.name.toString();
    /**
    * HTTP status code for the error
    * @type {Number}
    */
    this.code = mongoError.code;
    /**
    * The error message passed by the MongoDB driver
    * @type {String}
    */
    this.mongoError = mongoError.errmsg;
    /**
    * The error message
    * @type {String}
    */
    this.message = this.getMessage(errorKey);
  }
  /**
  * Generates and returns the error message
  * @param {String} errorKey Key to be used for the error message
  * @return {String}
  */
  getMessage(errorKey) {
    const message = App.instance.lang.t(`error.${errorKey}`);
    if(!this.code) {
      return `${message}, ${this.mongoError}`;
    }
    if(CodeLookup[this.code]) {
      return `${message}, ${App.instance.lang.t(`error.${CodeLookup[this.code]}`)}`;
    }
  }
}

module.exports = MongoDBError;
