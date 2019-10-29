const MongoDBModule = require('../lib/module');
const should = require('should');

describe('MongoDB module', function() {
  describe('#formatQuery()', function() {
    before(function() {
      this.query = MongoDBModel.formatQuery({
        _id: 12345,
        limitResultsTo: 40
      });
    });
    it('should specify the _id if passed', function() {
      // _id
      false.should.be.true();
    });
    it('should not specify the _id if not passed', function() {
      // _id
      false.should.be.true();
    });
    it('should define the maximum number of results to return', function() {
      // limitResultsTo
      false.should.be.true();
    });
    it('should define where to start results count for pagination', function() {
      // startResultsFrom
      false.should.be.true();
    });
    it('should define sort for results', function() {
      // sortResultsBy
      false.should.be.true();
    });
    it('should define aggregation', function() {
      // aggregateFields
      false.should.be.true();
    });
    it('should omit unexpected input data', function() {
      false.should.be.true();
    });
    it('should return a DataStoreQuery instance', function() {
      this.query.constructor.name.should.equal('DataStoreQuery');
    });
  });
  describe('#readyState()', function() {
    it('should return a number', function() {
      false.should.be.true();
    });
    it('should return a value even if no connection', function() {
      false.should.be.true();
    });
  });
  describe('#isConnected()', function() {
    it('should return true if connected', function() {
      false.should.be.true();
    });
    it('should return false if not connected', function() {
      false.should.be.true();
    });
  });
  describe('#connect()', function() {
    it('should establish a connection to specified MongoDB instance', function() {
      false.should.be.true();
    });
    it('should fail gracefully on error', function() {
      false.should.be.true();
    });
  });
  describe('#addModel()', function() {
    it('should fail silently if no DB connection', function() {
      false.should.be.true();
    });
    it('should add a compiled model to the mongoose connection', function() {
      // models[name] set
      // check if compiled?
      false.should.be.true();
    });
    it('should return a MongoDBModel instance', function() {
      false.should.be.true();
    });
    it('should fail silently on bad input', function() {
      // bad data?
      false.should.be.true();
    });
  });
  describe('#getModel()', function() {
    it('should return a MongoDBModel instance', function() {
      false.should.be.true();
    });
    it('should throw an error if model doesn\'t exist', function() {
      false.should.be.true();
    });
  });
  describe('#addPlugin()', function() {
    it('should define a global mongoose plugin', function() {
      false.should.be.true();
    });
  });
  describe('#create()', function() {
    it('should return a promise', function() {
      false.should.be.true();
    });
    it('should return an error if no data is passed', function() {
      false.should.be.true();
    });
    it('should return an error if invalid model type is specified', function() {
      false.should.be.true();
    });
    it('should return an error if mongoose validation fails', function() {
      false.should.be.true();
    });
    it('should return the created document', function() {
      false.should.be.true();
    });
  });
  describe('#retrieve()', function() {
    it('should return a promise', function() {
      false.should.be.true();
    });
    it('should return an error if invalid query data is passed', function() {
      false.should.be.true();
    });
    it('should return an error if invalid model type is specified', function() {
      false.should.be.true();
    });
    it('should populate specified attributes', function() {
      false.should.be.true();
    });
    it('should return matching documents', function() {
      false.should.be.true();
    });
  });
  describe('#update()', function() {
    it('should return a promise', function() {
      false.should.be.true();
    });
    it('should return an error if invalid query data is passed', function() {
      false.should.be.true();
    });
    it('should return an error if invalid model type is specified', function() {
      false.should.be.true();
    });
    it('should update matching document(s)', function() {
      false.should.be.true();
    });
  });
  describe('#delete()', function() {
    it('should return a promise', function() {
      false.should.be.true();
    });
    it('should return an error if invalid query data is passed', function() {
      false.should.be.true();
    });
    it('should return an error if invalid model type is specified', function() {
      false.should.be.true();
    });
    it('should delete matching document(s)', function() {
      false.should.be.true();
    });
  });
  describe('#formatError()', function() {
    it('should return an Error', function() {
      false.should.be.true();
    });
    it('should set custom statusCode', function() {
      false.should.be.true();
    });
    it('should set default statusCode', function() {
      false.should.be.true();
    });
  });
  describe('#formatValidationError()', function() {
    it('should return a DataValidationError instance', function() {
      false.should.be.true();
    });
    it('should only format ValidationError instances', function() {
      // input: Error > output: Error
      false.should.be.true();
    });
  });
});
