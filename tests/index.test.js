// Copyright 2015 Yahoo Inc.
// Licensed under the MIT license.
// See the included LICENSE file for terms.

/*global describe, it */
var sinon = require('sinon'),
    Assert = require('chai').assert,
    retryFn = require('../index');

describe('retry-function test case', function () {
    describe('retryFn', function () {
        it('should not retry if first run successful', function (done) {
            var myFunc = sinon.stub(),
                myCallback = function (err) {
                    Assert.isNull(err);
                    Assert.isTrue(myFunc.calledOnce);
                    done();
                };

            myFunc.yieldsAsync(null);

            retryFn({
                method: myFunc
            }, myCallback);
        });

        it('should retry fn until success', function (done) {
            var myFunc = sinon.stub(),
                myCallback = function (err) {
                    Assert.isNull(err);
                    Assert.isTrue(myFunc.calledThrice);
                    done();
                };

            myFunc.yieldsAsync(new Error('nope'));
            myFunc.onCall(2).yieldsAsync(null);

            retryFn({
                method: myFunc,
                options: {
                    minTimeout: 10,
                    retries: 5
                }
            }, myCallback);
        });

        it('should have error if never succeeds', function (done) {
            var myFunc = sinon.stub(),
                myCallback = function (err) {
                    Assert.isNotNull(err);
                    Assert.equal(err.message, 'nope');
                    Assert.isTrue(myFunc.calledThrice);
                    done();
                };

            myFunc.yieldsAsync(new Error('nope'));

            retryFn({
                method: myFunc,
                options: {
                    minTimeout: 10,
                    retries: 2
                }
            }, myCallback);
        });

        it('should not continue if shouldRetry says not to', function (done) {
            var myFunc = sinon.stub(),
                myCallback = function (err) {
                    Assert.isNotNull(err);
                    Assert.equal(err.message, 'yep');
                    Assert.isTrue(myFunc.calledThrice);
                    done();
                };

            myFunc.yieldsAsync(new Error('nope'));
            myFunc.onCall(2).yieldsAsync(new Error('yep'));

            retryFn({
                method: myFunc,
                shouldRetry: function (err) {
                    return err.message === 'nope';
                },
                options: {
                    minTimeout: 10,
                    retries: 5
                }
            }, myCallback);
        });

        it('should fail if validation fails', function () {
            Assert.throws(function () {
                retryFn({}, function () {});
            }, Error, '"method" is required');
        });

        it('should fail if callback missing', function () {
            Assert.throws(function () {
                retryFn({});
            }, Error, '"callback" must be a function');
        });
    });
});
