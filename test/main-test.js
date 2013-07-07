require('chai').should();

var read = require('../');

var getAttr = function(name) {
  return function(item) {
    return item[name];
  };
};

describe('Main', function() {
  describe('read', function() {
    it('should provide the correct order', function(done) {
      read(__dirname, 'bower', function(error, packages) {
        packages.map(getAttr('name')).should.eql(['a', 'b', 'c', 'd', 'e']);
        done();
      });
    });

    // it('should extract all package files', function(done) {
    //   read(__dirname, 'bower', function(error, packages) {
    //     console.log(packages)
    //     packages.map(getAttr('files')).should.eql(['a', 'b', 'c', 'd', 'e']);
    //     done();
    //   });
    // });
  });
});
