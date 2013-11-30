require('chai').should();

var read = require('../');

var getAttr = function(name) {
  return function(item) {
    return item[name];
  };
};

describe('Main', function() {
  describe('readBower', function() {
    it('should provide the correct order', function(done) {
      read(__dirname, 'bower', function(error, packages) {
        packages.map(getAttr('name')).should.eql(['mixedcase', 'a', 'b', 'c', 'd', 'e']);
        done();
      });
    });
  });
  describe('readComponent', function() {
    it('should provide the correct order', function(done) {
      read(__dirname, 'component', function(error, packages) {
        packages.map(getAttr('name')).should.eql(['mixedcase', 'a', 'b', 'c', 'd', 'e']);
        done();
      });
    });
  });
  describe('readComponent', function() {
    it('should provide the correct order', function(done) {
      read(__dirname, 'component', function(error, packages, aliases) {
        aliases.length.should.eql(11);
        done();
      });
    });
  });
});
