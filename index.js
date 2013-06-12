var when = require('when');
var wrap = require('when/node/function').call;
var sysPath = require('path');
var fs = require('fs');

var standardizePackage = function(data) {
  data.main = (Array.isArray(data.main)) ? data.main : [data.main];
  if (!data.scripts) data.scripts = [];
  if (!data.styles) data.styles = [];
  return data;
};

var readBowerJson = function(path) {
  var bowerJson = sysPath.join(path, 'bower.json');
  if (!fs.existsSync(bowerJson)) {
    throw new Error('Bower component must have bower.json in "' + bowerJson + '"');
  };

  var data, error;
  try {
    data = require(sysPath.resolve(bowerJson));
  } catch(e) {
    throw new Error('Bower component bower.json is invalid in "' + path + '": ' + e);
  }

  var main = data.main;

  if (!main && !data.scripts && !data.styles) {
    throw new Error('Bower component bower.json must have `main` property. Contact component author of "' + path + '"')
  }

  return data;
};

var unique = function(list) {
  return Object.keys(list.reduce(function(obj, _) {
    if (!obj[_]) obj[_] = true;
    return obj;
  }, {}));
};

var getPackageFiles = exports.getPackageFiles = function(pkg) {
  var list = [];
  ['main', 'scripts', 'styles'].forEach(function(property) {
    pkg[property].forEach(function(item) {
      list.push(item);
    });
  });
  return unique(list);
};

var processPackage = function(path) {
  var pkg = standardizePackage(readBowerJson(path));
  var files = getPackageFiles(pkg).map(function(relativePath) {
    return sysPath.join(path, relativePath);
  });
  return {name: pkg.name, version: pkg.version, files: files};
};

var readBowerPackages = function(list, parent) {
  if (parent == null) parent = sysPath.join('.', 'components');

  var paths = list.map(function(item) {
    return sysPath.join(parent, item);
  });
  var data = paths.map(processPackage);

  return data;
};

console.log(readBowerPackages(['backbone', 'jquery']));

// module.exports = read;
