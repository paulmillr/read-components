var read = require('../');
read(__dirname, 'bower', function(error, packages) {
  console.log(error);
  console.log(packages);
});
