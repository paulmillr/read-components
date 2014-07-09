require('chai').should();

var read = require('../');
var path = require('path');

var getAttr = function(name) {
  return function(item) {
    return item[name];
  };
};

describe('Main', function() {
  describe('readBower', function() {
    it('should provide the correct order', function(done) {
      read(__dirname, 'bower', function(error, packages) {
        packages.map(getAttr('name')).should.eql(['mixedCase', 'a', 'b', 'c', 'd', 'e']);
        done();
      });
    });

    it('should resolve the dependency files', function(done) {
      read(__dirname, 'bower', function(error, packages) {
        var files = [];
        files.concat.apply(files, packages.map(getAttr('files'))).length.should.eql(6);
        done();
      });
    });

    it('should follow bowerrc', function(done) {
      read(path.join(__dirname, 'bowerrc_fixture'), 'bower', function(error, packages) {
        packages.map(getAttr('name')).should.eql(['other', 'some']);
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
