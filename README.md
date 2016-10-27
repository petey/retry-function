# retry-function
Wrapper to retry function calls with an exponential backoff strategy

## Installation:
```npm install --save retry-function```

## Usage:
Pass a function and callback to retryFn and it will retry with exponential backoff.
```
var retryFn = require('retry-function');

var myFunc = function (cb) {return process.nextTick(cb(null, 'foo'))},
    myCallback = function (err, data) {};

retryFn({
    method: myFunc
}, myCallback);
```

## Configuring retry

Uses [retry](https://www.npmjs.com/package/retry) to implement retries. You can use the same config with retryFn.

`options` is a JS object that can contain any of the following keys:

* retries: The maximum amount of times to retry the operation. Default is 10.
* factor: The exponential factor to use. Default is 2.
* minTimeout: The number of milliseconds before starting the first retry. Default is 1000.
* maxTimeout: The maximum number of milliseconds between two retries. Default is Infinity.
* randomize: Randomizes the timeouts by multiplying with a factor between 1 to 2. Default is false.

```
var retryFn = require('retry-function');

var myFunc = function (cb) {return process.nextTick(cb(null, 'foo'))},
    myCallback = function (err, data) {};

retryFn({
    method: myFunc,
    options: {
        retries: 5
    }
}, myCallback);
```

## Conditional Retry

You may add a function that inspects the error from a run of `method` to determine if a retry is desired. For example, you may wish to retry calls that result in a 500 error, but not those that result in a 400.

```
var retryFn = require('retry-function');

var myFunc = function (cb) {return process.nextTick(cb(null, 'foo'))},
    myCallback = function (err, data) {};

retryFn({
    method: myFunc,
    shouldRetry: function (err) { return err.code >= 500; }
}, myCallback);
```

## Additional args

You may need to pass additional arguments to your `method`. You may do so by adding an `arguments` array to the retryFn config. The same arguments will be passed to each execution of the `method`.

```
var retryFn = require('retry-function');

var myFunc = function (args, cb) {return process.nextTick(cb(null, 'foo'))},
    myCallback = function (err, data) {};

retryFn({
    method: myFunc,
    arguments: ['foo']
}, myCallback);
```

Code licensed under the MIT license. See LICENSE file for terms.
