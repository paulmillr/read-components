require('chai').should();

var items = require('../');

describe('Main', function() {
  describe('getPackageFiles', function() {
    it('should extract all package files', function() {
      var result = items.getPackageFiles({
        main: ['a.js', 'b.js'],
        scripts: ['a.js', 'b.js', 'c.js'],
        styles: ['a.css']
      });

      result.should.eql(['a.js', 'b.js', 'c.js', 'a.css']);
    });
  });
});
