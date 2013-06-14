var sysPath = require('path');
var fs = require('fs');

// Return unique list items.
var unique = function(list) {
  return Object.keys(list.reduce(function(obj, _) {
    if (!obj[_]) obj[_] = true;
    return obj;
  }, {}));
};

// Read bower.json.
// Returns String.
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

// Coerce data.main, data.scripts and data.styles to Array.
var standardizePackage = function(data) {
  if (data.main && !Array.isArray(data.main)) data.main = [data.main];
  ['main', 'scripts', 'styles'].forEach(function(_) {
    if (!data[_]) data[_] = [];
  });
  return data;
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
  return {
    name: pkg.name, version: pkg.version, files: files,
    dependencies: pkg.dependencies || {}
  };
};

var readBowerPackages = function(list, parent) {
  if (parent == null) parent = sysPath.join('.', 'components');

  var paths = list.map(function(item) {
    return sysPath.join(parent, item);
  });
  var data = paths.map(processPackage);

  return data;
};


// Find an item in list.
var find = function(list, predicate) {
  for (var i = 0, length = list.length, item; i < length; i++) {
    item = list[i];
    if (predicate(item)) return item;
  }
};

// Iterate recursively over each dependency and increase level
// on each iteration.
var setSortingLevels = function(packages) {
  var setLevel = function(initial, pkg) {
    var level = Math.max(pkg.sortingLevel || 0, initial);
    var deps = Object.keys(pkg.dependencies);
    // console.debug('setLevel', pkg.name, level);
    pkg.sortingLevel = level;
    deps.forEach(function(dep) {
      setLevel(initial + 1, find(packages, function(_) {
        return _.name === dep;
      }));
    });
  };

  packages.forEach(setLevel.bind(null, 1));
  return packages;
};

// Sort packages automatically, based on their dependencies.
var sortPackages = function(packages) {
  return setSortingLevels(packages).sort(function(a, b) {
    return b.sortingLevel - a.sortingLevel;
  });
};

var getPaths = function(directory, callback) {
  if (directory == null) directory = '.';
  var parent = sysPath.join(directory, 'components');
  fs.readdir(parent, function(error, packages) {
    if (error) throw new Error(error);
    var sorted = sortPackages(readBowerPackages(packages, parent));
    // console.debug('getPaths', sorted.map(function(_) {return _.name;}));
    callback(null, sorted);
  });
};

// getPaths();
module.exports = getPaths;
