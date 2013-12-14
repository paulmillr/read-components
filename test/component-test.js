var read = require('../');
var Builder = require('component-builder')

var builder = new Builder(".");
builder.build(function(err, res) {
	console.log(res.js.substring(res.js.indexOf('\nrequire.alias')));
});

read(__dirname, 'component', function(error, packages, aliases) {
  console.log(packages);
  console.log(aliases);
});
