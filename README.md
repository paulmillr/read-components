# read-components [![Build Status](https://travis-ci.org/paulmillr/read-components.svg?branch=add-travis)](https://travis-ci.org/paulmillr/read-components)

Read Twitter Bower components.

Install with `npm install read-components`.

> read-components was made for automatic builders like [Brunch](http://brunch.io).
Automatic means you don’t need to specify bower files which will be built.
Instead, read-components reads root `bower.json`, opens `bower.json` of
all packages and their dependencies and auto-calculates concatenation order.

## Component JSON file must have `main` property.

Every component which is handled by bower must have "main" property in bower.json. You can specify this in your own `bower.json` in `overrides` section. See below for examples.

## Why

For automatic builds, read-components requires files to have `dependencies` and `main` properties specified.
But not all bower packages have `bower.json` with `main` property specified.
I’d say less than 50%. So parsing these will fail:

```js
// Root bower.json
{
  ...
  "dependencies": {
    "chaplin": "*"
  }
}

// bower_components/chaplin/bower.json
{
  ...
  "dependencies": {"backbone": "*"}
}

// bower_components/backbone/bower.json
{// no deps, no `main`}
```

read-components solves the problem by allowing user to specify `bower.json`
**overrides** in root config file.

For example, if your root bower.json looks like that

```json
{
  "dependencies": {"chaplin": "*"},
  "overrides": {
    "backbone": {
      "main": "backbone.js",
      "dependencies": {
        "underscore": "~1.5.0",
        "jquery": "~2.0.0"
      }
    }
  }
}
```

read-components will treate backbone bower.json as completed and will produce
correct output for automatic builders.

## Usage

Node.js:

```javascript
var read = require('read-components');

read('your-project-dir-with-bower.json', 'bower', function(error, components) {
  console.log('All components:', components);
});

read('.', 'bower', function(error, components) {});
```

Output is a list of packages like this:

```json
[{ "name": "d",
  "version": "1.0.2",
  "files": [ "/Users/john/project/bower_components/d/index.js" ],
  "dependencies": { },
  "sortingLevel": 2 },
{ "name": "e",
  "version": "1.0.1",
  "files": [ "/Users/paul/project/bower_components/e/index.js" ],
  "dependencies": { "d": "~1.0.0" },
  "sortingLevel": 1 } ]
```

Each package will also have `sortingLevel` and `files` specified.
You can use it to get concatenation order like this:

```javascript
// Note that it is sorted like this by default.
packages
  .sort(function(a, b) {
    var field = 'sortingLevel';
    return b[field] - a[field];
  })
  .map(function(pkg) {
    return pkg.files;
  });
```

## License

[MIT](https://github.com/paulmillr/mit) (c) 2016 Paul Miller (http://paulmillr.com)
