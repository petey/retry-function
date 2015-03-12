// Copyright 2015 Yahoo Inc.
// Licensed under the MIT license.
// See the included LICENSE file for terms.

var retry = require('retry'),
    joi = require('joi');

/**
 * Executes retry operation
 * @method execRetry
 * @param  {Object}     config  Retry-function configuration
 * @param  {Function}   callback    Called when done fn(err, ...);
 * @private
 */
function execRetry(config, callback) {
    config.shouldRetry = config.shouldRetry || function () {return true;};
    config.options = config.options || {};
    config.arguments = config.arguments || [];

    var operation = retry.operation(config.options);

    operation.attempt(function () {
        var attemptArgs = config.arguments.slice();

        attemptArgs.push(function () {
            var args = Array.prototype.slice.call(arguments),
                err = args[0];

            if (config.shouldRetry(err) && operation.retry(err)) {
                return;
            }

            callback.apply(null, args);
        });

        config.method.apply(null, attemptArgs);
    });
}

/**
 * Validates inputs to retry execution
 * @method validateRetry
 * @param  {Object}     config      Retry-function configuration
 * @param  {Function}   callback    Called when done fn(err, ...);
 * @private
 */
function validateRetry(config, callback) {
    var schema = joi.object().keys({
            options: joi.object().keys({
                retries: joi.number().optional(),
                factor: joi.number().optional(),
                minTimeout: joi.number().optional(),
                maxTimeout: joi.number().optional(),
                randomize: joi.boolean().optional(),
            }).optional(),
            arguments: joi.array().optional(),
            shouldRetry: joi.func().optional(),
            method: joi.func().required(),
        }).required();

    if (typeof callback !== 'function') {
        throw new Error('"callback" must be a function');
    }

    joi.validate(config, schema, function (err) {
        if (err) {
            throw new Error(err.details.map(function (detail) {
                return detail.message;
            }).join(','));
        }
        execRetry(config, callback);
    });
}

/**
 * Retries a function call with exponential backoff
 * @method retryFn
 * @param  {Object}         config                      Retry-function configuration
 *     @param  {Function}   config.method               Asynchronous method to retry
 *     @param  {Function}   [config.shouldRetry=true]   Synchronous method takes an error object to determine if a retry is desired. (Boolean) fn(err). Defaults to always retry.
 *     @param  {Function}   config.callback             Function to call retry is complete
 *     @param  {Array}      config.arguments            Arguments that are supplied to the function being retried
 *     @param  {Object}     [config.options]            Retry configuration https://www.npmjs.com/package/retry
 *     @param  {Number}     [config.options.retries=10]             The maximum amount of times to retry the operation.
 *     @param  {Number}     [config.options.factor=2]               The exponential factor to use.
 *     @param  {Number}     [config.options.minTimeout=1000]        The number of milliseconds before starting the first retry.
 *     @param  {Number}     [config.options.maxTimeout=Infinity]    The maximum number of milliseconds between two retries.
 *     @param  {Boolean}    [config.options.randomize=false]        Randomizes the timeouts by multiplying with a factor between 1 to 2.
 * @param  {Function}       Callback                    Called when done fn(err, ...);
 */
module.exports = validateRetry;
