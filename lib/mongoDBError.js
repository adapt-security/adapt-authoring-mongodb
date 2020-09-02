const { App } = require('adapt-authoring-core');

/** @ignore */ const CodeLookup = {
  66: { key: 'immutablefield', statusCode: 500 },
  11000: { key: 'duplicateindex', statusCode: 400 }
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
    * Reference to the MongoDB error code
    * @type {Number}
    */
   this.code = mongoError.code;
   /**
   * HTTP status code for the error
   * @type {Number}
   */
    this.statusCode = this.getStatusCode();
    /**
    * The error message passed by the MongoDB driver
    * @type {String}
    */
    this.mongoError = mongoError.message;
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
    let error = this.mongoError;
    try {
      error = App.instance.lang.t(`error.${CodeLookup[this.code].key}`);
    } catch {}
    return `${App.instance.lang.t(`error.${errorKey}`)}, ${error}`;
  }
  /**
  * Returns the appropriate HTTP status code
  * @return {Number}
  */
  getStatusCode() {
    try {
      return CodeLookup[this.code].statusCode;
    } catch {}
  }
}

module.exports = MongoDBError;
