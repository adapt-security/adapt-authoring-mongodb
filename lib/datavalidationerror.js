/**
* Error for Model validation issues which multiple errors to be summarised in a single parent error
* @class
*/
class DataValidationError extends Error {
  /**
  * @param {String} messagePrefix String to prefix the Error.message
  */
  constructor(messagePrefix) {
    super(...arguments);
    /**
    * Name of the error
    * @type {String}
    */
    this.name = this.constructor.name;
    /**
    * String to prefix the Error.message
    * @type {String}
    */
    this.messagePrefix = messagePrefix;
    /**
    * The concatenated error message
    * @type {String}
    */
    this.message = '';
    /**
    * Child errors
    * @type {Array<Error>}
    */
    this.errors = [];
  }
  /**
  * Adds a 'child' error to the list, and updates the error's message
  */
  addError(e) {
    this.errors.push(e);
    this.message = `${this.messagePrefix}: ${this.errors.join(', ')}.`;
  }
}

module.exports = DataValidationError;
