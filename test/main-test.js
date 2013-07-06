require('chai').should();

var read = require('../');

var getAttr = function(name) {
  return function(item) {
    return item[name];
  };
};

describe('Main', function() {
  describe('getPackageFiles', function() {
    it('should extract all package files', function(done) {
      read(__dirname, 'bower', function(error, value) {
        value.map(getAttr('name')).should.eql(['a', 'b', 'c', 'd', 'e']);
        done();
      });
    });
  });
});
