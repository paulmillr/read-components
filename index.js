var sysPath = require('path');
var fs = require('fs');
var each = require('async-each');

// Return unique list items.
var unique = function(list) {
  return Object.keys(list.reduce(function(obj, _) {
    if (!obj[_]) obj[_] = true;
    return obj;
  }, {}));
};


var readJson = function(file, callback) {
  fs.readFile(file, function(err, contents) {
    if (err) return callback(err);

    var json;

    try {
        json = JSON.parse(contents.toString());
    } catch (err) {
        err.code = 'EMALFORMED';
        return callback(err);
    }

    callback(null, json);
  });
};

// Read bower.json.
// Returns String.
var readBowerJson = function(path, callback) {
  var bowerJson = sysPath.join(path, 'bower.json');

  fs.exists(bowerJson, function(exists) {
    if (!exists) {
      return callback(new Error('Bower component must have bower.json in "' + bowerJson + '"'));
    };

    var fullPath = sysPath.resolve(bowerJson);

    readJson(fullPath, function(error, data) {
      if (error) return callback(new Error('Bower component bower.json is invalid in "' + path + '": ' + error));

      var main = data.main;

      if (!main && !data.scripts && !data.styles) {
        return callback(new Error('Bower component bower.json must have `main` property. See git.io/brunch-bower. Contact component author of "' + path + '"'));
      }

      callback(null, data);
    });
  });
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

var processPackage = function(path, callback) {
  readBowerJson(path, function(error, json) {
    if (error) return callback(error);
    var pkg = standardizePackage(json);
    var files = getPackageFiles(pkg).map(function(relativePath) {
      return sysPath.join(path, relativePath);
    });
    callback(null, {
      name: pkg.name, version: pkg.version, files: files,
      dependencies: pkg.dependencies || {}
    });
  });
};

var readBowerPackages = function(list, parent, callback) {
  if (parent == null) parent = sysPath.join('.', 'components');

  var paths = list.map(function(item) {
    return sysPath.join(parent, item);
  });
  each(paths, processPackage, callback);
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
    if (error) return callback(new Error(error));
    readBowerPackages(packages, parent, function(error, data) {
      if (error) return callback(error);
      var sorted = sortPackages(data);
      // console.debug('getPaths', sorted.map(function(_) {return _.name;}));
      callback(null, sorted);
    });
  });
};

getPaths('.', console.log.bind(console));
module.exports = getPaths;
