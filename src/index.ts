// Copyright 2015 Yahoo Inc.
// Licensed under the MIT license.
// See the included LICENSE file for terms.

import retry from "retry";

export type AnyFunction = (...args: any[]) => void;

export interface RetryConfig<T> {
  options?: retry.OperationOptions;
  context?: any;
  arguments?: any[];
  shouldRetry?: (err: any) => boolean;
  method: T;
}

const defaultShouldRetry = () => true;

/**
 * Executes retry operation
 * @method execRetry
 * @param  {RetryConfig}     config  Retry-function configuration
 * @param  {Function}   callback    Called when done fn(err, ...);
 * @private
 */
const execRetry = <T extends AnyFunction>(
  {
    shouldRetry = defaultShouldRetry,
    options = {},
    arguments: configArguments = [],
    context = null,
    method,
  }: RetryConfig<T>,
  callback: T,
) => {
  const operation = retry.operation(options);

  operation.attempt(() => {
    const attemptArgs = configArguments.slice();

    attemptArgs.push((...args: Parameters<T>) => {
      const err = args[0];

      if (shouldRetry?.(err) && operation.retry(err)) {
        return;
      }

      callback(...args);
    });

    method.apply(context, attemptArgs);
  });
};

/**
 * Validates inputs to retry execution
 * @method validateRetry
 * @param  {Object}     config      Retry-function configuration
 * @param  {Function}   callback    Called when done fn(err, ...);
 * @private
 */
const validateRetry = <T extends AnyFunction>(config: RetryConfig<T>, callback: T) => {
  if (typeof callback !== "function") {
    throw new Error('"callback" must be a function');
  }

  execRetry(config, callback);
};

/**
 * Retries a function call with exponential backoff
 * @method retryFn
 * @param  {Object}     config                      Retry-function configuration
 * @param  {Function}   config.method               Asynchronous method to retry
 * @param  {Function}   [config.shouldRetry=true]   Synchronous method takes an error object to determine if a retry is desired. (Boolean) fn(err). Defaults to always retry.
 * @param  {Function}   config.callback             Function to call retry is complete
 * @param  {Array}      config.arguments            Arguments that are supplied to the function being retried
 * @param  {Object}     [config.context=null]       Context to supply to fn.apply() when calling method
 * @param  {Object}     [config.options]            Retry configuration https://www.npmjs.com/package/retry
 * @param  {Number}     [config.options.retries=10]             The maximum amount of times to retry the operation.
 * @param  {Number}     [config.options.factor=2]               The exponential factor to use.
 * @param  {Number}     [config.options.minTimeout=1000]        The number of milliseconds before starting the first retry.
 * @param  {Number}     [config.options.maxTimeout=Infinity]    The maximum number of milliseconds between two retries.
 * @param  {Boolean}    [config.options.randomize=false]        Randomizes the timeouts by multiplying with a factor between 1 to 2.
 * @param  {Function}   Callback                    Called when done fn(err, ...);
 */
export const retryFn = validateRetry;
export default validateRetry;
