var sysPath = require('path');
var fs = require('fs');
var each = require('async-each');

var jsonPaths = {
  bower: 'bower.json',
  component: 'component.json'
};

var dirs = {
  bower: 'bower_components',
  component: 'components'
};
var jsonProps = ['main', 'scripts', 'styles'];

// Return unique list items.
var unique = function(list) {
  return Object.keys(list.reduce(function(obj, _) {
    if (!obj[_]) obj[_] = true;
    return obj;
  }, {}));
};

var resolveComponent = function(name) {
  return name.replace('/', '-');
};

var readJson = function(file, callback) {
  fs.exists(file, function(exists) {
    if (!exists) {
      return callback(new Error('Component must have "' + file + '"'));
    };

    fs.readFile(file, function(err, contents) {
      if (err) return callback(err);

      var json;

      try {
        json = JSON.parse(contents.toString());
      } catch(err) {
        err.code = 'EMALFORMED';
        return callback(new Error('Component JSON file is invalid in "' + file + '": ' + err));
      }

      callback(null, json);
    });
  });
};

var getJsonPath = function(path, type) {
  return sysPath.resolve(sysPath.join(path, jsonPaths[type]));
};

// Coerce data.main, data.scripts and data.styles to Array.
var standardizePackage = function(data) {
  if (data.main && !Array.isArray(data.main)) data.main = [data.main];
  jsonProps.forEach(function(_) {
    if (!data[_]) data[_] = [];
  });
  return data;
};

var getPackageFiles = exports.getPackageFiles = function(pkg) {
  var list = [];
  jsonProps.forEach(function(property) {
    pkg[property].forEach(function(item) {
      list.push(item);
    });
  });
  return unique(list);
};

var processPackage = function(type, pkg, callback) {
  var path = pkg.path;
  var override = pkg.override;

  readJson(getJsonPath(path, type), function(error, json) {
    if (error) return callback(error);
    if (override) {
      Object.keys(override).forEach(function(key) {
        json[key] = override[key];
      });
    }

    if (!json.main && !json.scripts && !json.styles) {
      return callback(new Error('Component JSON file "' + path + '" must have `main` property. See git.io/brunch-bower'));
    }

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

var readPackages = function(root, type, list, overrides, callback) {
  var parent = sysPath.join(root, dirs[type]);
  var paths = list.map(function(item) {
    return {path: sysPath.join(parent, item), override: overrides[item]};
  });
  each(paths, processPackage.bind(null, type), callback);
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


var init = function(directory, type, callback) {
  readJson(sysPath.join(directory, jsonPaths[type]), callback);
};

var readBowerComponents = exports.readBowerComponents = function(directory, callback) {
  if (typeof directory === 'function') {
    callback = directory;
    directory = null;
  }
  if (directory == null) directory = '.';

  init(directory, 'bower', function(error, json) {
    if (error) return callback(error);

    var deps = Object.keys(json.dependencies || {});
    var overrides = json.override || {};

    readPackages(directory, 'bower', deps, overrides, function(error, data) {
      if (error) return callback(error);
      var sorted = sortPackages(data);
      // console.debug('getPaths', sorted.map(function(_) {return _.name;}));
      callback(null, sorted);
    });
  });
};

// getBowerPaths('.', console.log.bind(console));
