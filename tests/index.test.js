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
                method: myFunc,
                callback: myCallback
            });
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
                callback: myCallback,
                options: {
                    minTimeout: 10,
                    retries: 5
                }
            });
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
                callback: myCallback,
                options: {
                    minTimeout: 10,
                    retries: 2
                }
            });
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
                callback: myCallback,
                shouldRetry: function (err) {
                    return err.message === 'nope';
                },
                options: {
                    minTimeout: 10,
                    retries: 5
                }
            });
        });

        it('should fail if validation fails', function () {
            Assert.throws(function () {
                retryFn({});
            }, Error, '"method" is required');
        });
    });
});
