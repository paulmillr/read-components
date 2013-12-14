var sysPath = require('path');
var fs = require('fs');
var each = require('async-each');

var jsonPaths = {
  bower: 'bower.json',
  dotbower: '.bower.json',
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
      var err = new Error('Component must have "' + file + '"');
      err.code = 'NO_BOWER_JSON';
      return callback(err);
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
  var overrides = pkg.overrides;
  var fullPath = getJsonPath(path, type);
  var dotpath = getJsonPath(path, 'dotbower');

  var _read = function(actualPath) {
    readJson(actualPath, function(error, json) {
      if (error) return callback(error);
      if (overrides) {
        Object.keys(overrides).forEach(function(key) {
          json[key] = overrides[key];
        });
      }

      if (!json.main) {
        return callback(new Error('Component JSON file "' + actualPath + '" must have `main` property. See https://github.com/paulmillr/read-components#README'));
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

  fs.exists(dotpath, function(isStableBower) {
    _read(isStableBower ? dotpath : fullPath)
  });
};

var gatherDeps = function(packages) {
  return Object.keys(packages.reduce(function(obj, item) {
    if (!obj[item.name]) obj[item.name] = true;
    Object.keys(item.dependencies).forEach(function(dep) {
      if (!obj[dep]) obj[dep] = true;
    });
    return obj;
  }, {}));
};

var readPackages = function(root, type, allProcessed, list, overrides, callback) {
  var parent = sysPath.join(root, dirs[type]);
  var paths = list.map(function(item) {
    return {path: sysPath.join(parent, item), overrides: overrides[item]};
  });

  each(paths, processPackage.bind(null, type), function(error, newProcessed) {
    if (error) return callback(error);

    var processed = allProcessed.concat(newProcessed);

    var processedNames = {};
    processed.forEach(function(_) {
      processedNames[_.name] = true;
    });

    var newDeps = gatherDeps(newProcessed).filter(function(item) {
      return !processedNames[item];
    });

    if (newDeps.length === 0) {
      callback(error, processed);
    } else {
      readPackages(root, type, processed, newDeps, overrides, callback);
    }
  });
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
    // console.log('setLevel', pkg.name, level);
    pkg.sortingLevel = level;
    deps.forEach(function(depName) {
      var dep = find(packages, function(_) {
        return _.name === depName;
      });
      if (!dep) {
        var names = Object.keys(packages).map(function(_) {
          return packages[_].name;
        }).join(', ');
        throw new Error('Dependency "' + depName + '" is not present in the list of deps [' + names + ']. Specify correct dependency in bower.json or contact package author.');
      }
      setLevel(initial + 1, dep);
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

var readBowerComponents = function(directory, callback) {
  if (typeof directory === 'function') {
    callback = directory;
    directory = null;
  }
  if (directory == null) directory = '.';

  init(directory, 'bower', function(error, json) {
    if (error) {
      if (error.code === 'NO_BOWER_JSON') {
        return callback(null, []);
      } else {
        return callback(error);
      }
    }

    var deps = Object.keys(json.dependencies || {});
    var overrides = json.overrides || {};

    readPackages(directory, 'bower', [], deps, overrides, function(error, data) {
      if (error) return callback(error);
      var sorted = sortPackages(data);
      // console.debug('getPaths', sorted.map(function(_) {return _.name;}));
      callback(null, sorted);
    });
  });
};

var read = function(root, type, callback) {
  if (type === 'bower') {
    readBowerComponents(root, callback);
  } else {
    throw new Error('read-components: unknown type');
  }
};

module.exports = read;

// getBowerPaths('.', console.log.bind(console));
