# retry-function
Wrapper to retry function calls with an exponential backoff strategy

## Installation:
```npm install --save retry-function```

## Usage:
```
var retryFn = require('retry-function');

var myFunc = function () {return process.nextTick(null, 'foo')},
    myCallback = function (err, data) {};

retryFn({
    method: myFunc,
    callback: myCallback
});
```
