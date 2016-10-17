'use strict';

// Copyright 2015 Yahoo Inc.
// Licensed under the MIT license.
// See the included LICENSE file for terms.

const sinon = require('sinon');
const Assert = require('chai').assert;
const retryFn = require('../index');

describe('retry-function test case', () => {
    let myFunc;
    let myCallback;

    beforeEach(() => {
        myFunc = sinon.stub();
    });

    describe('retryFn', () => {
        it('should not retry if first run successful', (done) => {
            myCallback = (err) => {
                Assert.isNull(err);
                Assert.isTrue(myFunc.calledOnce);
                done();
            };

            myFunc.yieldsAsync(null);

            retryFn({
                method: myFunc
            }, myCallback);
        });

        it('should retry fn until success', (done) => {
            myCallback = (err) => {
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

        it('should have error if never succeeds', (done) => {
            myCallback = (err) => {
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

        it('should not continue if shouldRetry says not to', (done) => {
            myCallback = (err) => {
                Assert.isNotNull(err);
                Assert.equal(err.message, 'yep');
                Assert.isTrue(myFunc.calledThrice);
                done();
            };

            myFunc.yieldsAsync(new Error('nope'));
            myFunc.onCall(2).yieldsAsync(new Error('yep'));

            retryFn({
                method: myFunc,
                shouldRetry: err => err.message === 'nope',
                options: {
                    minTimeout: 10,
                    retries: 5
                }
            }, myCallback);
        });

        it('should fail if validation fails', () => {
            Assert.throws(() => {
                retryFn({}, () => ({}));
            }, Error, '"method" is required');
        });

        it('should fail if callback missing', () => {
            Assert.throws(() => {
                retryFn({});
            }, Error, '"callback" must be a function');
        });
    });
});
