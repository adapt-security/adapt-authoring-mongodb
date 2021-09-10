const MongoDBModule = require('../lib/MongoDBModule');
const should = require('should');

describe('MongoDB module', function() {
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
  describe('#connectionURI()', function() {
    it('should return a valid connection string', function() {
      false.should.be.true();
    });
    it('should not include undefined values', function() {
      false.should.be.true();
    });
  });
  describe('#getCollection()', function() {
    it('should return a MongoDB collection', function() {
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
  describe('#insert()', function() {
    it('should return a promise', function() {
      false.should.be.true();
    });
    it('should return an error if no data is passed', function() {
      false.should.be.true();
    });
    it('should return the inserted document', function() {
      false.should.be.true();
    });
  });
  describe('#find()', function() {
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
  describe('#replace()', function() {
    it('should return a promise', function() {
      false.should.be.true();
    });
    it('should return an error if invalid query data is passed', function() {
      false.should.be.true();
    });
    it('should return an error if invalid model type is specified', function() {
      false.should.be.true();
    });
    it('should replace matching document(s)', function() {
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
});
