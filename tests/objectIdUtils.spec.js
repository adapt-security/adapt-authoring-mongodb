const should = require('should');

describe('ObjectId Utils', function() {
  describe('#isValid', function() {
    it('should return false for empty/undefined param', function() {
      false.should.be.true();
    });
    it('should return true for valid string', function() {
      false.should.be.true();
    });
    it('should return true for invalid type', function() {
      false.should.be.true();
    });
    it('should return true for invalid string', function() {
      false.should.be.true();
    });
  });
  describe('#parse', function() {
    it('should return an ObjectId instance', function() {
      false.should.be.true();
    });
    it('should throw an error on invalid input', function() {
      false.should.be.true();
    });
  });
  describe('#parseParamIds', function() {
    it('parse a valid _id to an ObjectId', function() {
      false.should.be.true();
    });
    it('throw an error on invalid _id', function() {
      false.should.be.true();
    });
    it('ignore non _id fields', function() {
      false.should.be.true();
    });
  });
});
