const { App, DataStore, DataStoreQuery, DataValidationError } = require('adapt-authoring-core');
const MongoModel = require('./mongomodel');
const mongoose = require('mongoose');
const { updateIfCurrentPlugin } = require('mongoose-update-if-current');
/**
* Represents a single MongoDB server instance
* @extends {Module}
*/
class MongoModule extends DataStore {
  /** @override*/
  static formatQuery(query) {
    if(!(query instanceof DataStoreQuery)) {
      throw new Error(App.instance.lang.t('error.expecteddatastorequery'));
    }
    query.validate();

    const data = {
      query: query.fieldsMatching,
      options: {}
    };
    if(query._id) data.query._id = query._id;
    if(query.limitResultsTo) data.options.limit = query.limitResultsTo;
    if(query.startResultsFrom) data.options.skip = query.startResultsFrom;
    if(query.sortResultsBy) data.options.sort = query.sortResultsBy;
    if(query.aggregateFields) data.populate = query.aggregateFields.join(' ');

    return data;
  }
  /**
  * Retrieves the ready state of the Mongoose connection
  * @see https://mongoosejs.com/docs/api.html#connection_Connection-readyState
  * @return {Boolean}
  */
  get readyState() {
    if(!this.connection) {
      return mongoose.connection.states[0];
    }
    return this.connection.states[this.connection.readyState];
  }
  /**
  * Determines if the Mongoose connection is connected
  * @return {Boolean}
  */
  get isConnected() {
    return this.readyState === mongoose.connection.states[1];
  }
  /** @override*/
  preload(app, resolve, reject) {
    /** @ignore */ this.connectionURI = `mongodb://${this.getConfig('host')}:${this.getConfig('port')}/${this.getConfig('dbname')}`;
    /** @ignore */ this.models = {};
    // optimistic concurrency control for Mongoose
    this.addPlugin(updateIfCurrentPlugin);
    resolve();
  }
  /** @override*/
  boot(app, resolve, reject) {
    this.connect().then(resolve).catch(reject);
  }
  /** @override*/
  connect(options = {}) {
    return new Promise((resolve, reject) => {
      /**
      * The Mongoose connection
      * @type {mongoose~Connection}
      */
      this.connection = mongoose.createConnection(this.connectionURI, Object.assign({ useNewUrlParser: true }, options));
      this.connection.then(() => {
        this.log('info', `${this.readyState}`);
        resolve();
      }).catch(reject);
    });
  }
  /**
  * Adds a new Mongoose model
  * @param {Object} data Data to be passed to {@link MongoModel#constructor}
  * @return {MongoModel} The newly added model
  */
  addModel(data) {
    if(!this.connection) {
      return this.log('warn', `${this.app.lang.t('error.addmodel', { model: data.name })}, ${this.app.lang.t('error.noconnection')}`);
    }
    try {
      const m = new MongoModel(data);
      m.compile(this.connection);
      this.models[data.name] = m;
      this.log('debug', this.app.lang.t('info.addmodel', { model: data.name }));
      return m;
    } catch(e) {
      return this.log('warn', `${this.app.lang.t('error.addmodel', { model: data.name })}, ${e}`);
    }
  }
  /**
  * Retrieves an existing MongoModel
  * @param {String} name Name of the model
  * @return {MongoModel} The matching MongoModel instance
  */
  getModel(name) {
    const m = this.models[name];
    if(!m) {
      throw new Error(`${this.app.lang.t('error.getmodel', { model: String(name) })}, ${this.app.lang.t('error.unknownmodel')}`);
    }
    return m;
  }
  /**
  * Adds a plugin to all schemas in the DB
  * @param {function} plugin A function which extends functionality
  * @see https://mongoosejs.com/docs/plugins.html
  */
  addPlugin(plugin) {
    mongoose.plugin(plugin);
  }
  /** @override*/
  create(data) {
    return new Promise((resolve, reject) => {
      try {
        const Model = this.getModel(data.type).compiled;
        new Model(data).save()
          .then(resolve)
          .catch(e => reject(this.formatValidationError(e, this.app.lang.t('error.createdocs'))));
      } catch(e) {
        return reject(e);
      }
    });
  }
  /** @override*/
  retrieve(query) {
    return new Promise((resolve, reject) => {
      let formatted, q;
      try {
        formatted = MongoModule.formatQuery(query);
        q = this.getModel(query.type).compiled.find(formatted.query, formatted.options);
      } catch(e) {
        reject(e);
      }
      if(formatted.populate) q.populate(formatted.populate);
      q.then(resolve).catch(error => reject(new Error(`${this.app.lang.t('error.retrievedocs')}, ${error.message}`)));
    });
  }
  /** @override*/
  update(query, data) {
    return new Promise((resolve, reject) => {
      let formatted, Model;
      try {
        formatted = MongoModule.formatQuery(query);
        Model = this.getModel(query.type).compiled;
      } catch(e) {
        reject(e);
      }
      Model.updateMany(formatted.query, data, Object.assign({ runValidators: true }, formatted.options))
        .then(resolve)
        .catch(e => {
          reject(this.formatValidationError(e, this.app.lang.t('error.updatedocs')));
        });
    });
  }
  /** @override*/
  delete(query) {
    return new Promise((resolve, reject) => {
      let formatted, Model;
      try {
        formatted = MongoModule.formatQuery(query);
        Model = this.getModel(query.type).compiled;
      } catch(e) {
        reject(e);
      }
      Model.deleteMany(formatted.query, error => {
        if(error) return reject(new Error(`${this.app.lang.t('error.deletedocs')}, ${error.message}`));
        resolve();
      });
    });
  }
  /**
  * Processes an incoming validation error(s), and returns a nicely formatted error summarising all issues
  * @param {Error} error The original error
  * @param {String} errorPrefix Generic error message for the return error
  * @return {DataValidationError}
  */
  formatValidationError(error, errorPrefix) {
    if(error.name !== 'ValidationError') {
      return error;
    }
    const e = new DataValidationError(errorPrefix);

    Object.entries(error.errors).forEach(([key,{ kind, path, value }]) => {
      switch(kind) {
        case 'required':
          return e.addError(this.app.lang.t('error.isrequired', { path }));
        case 'user defined':
          return e.addError(this.app.lang.t('error.invalidvalue', { path }));
        default:
          this.log('error', this.app.lang.t('error.genericvalidation', { kind, path, value })); break;
      }
    });
    return e;
  }
}

module.exports = MongoModule;
