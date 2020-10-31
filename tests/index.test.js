/* eslint-env mocha */

// Copyright 2015 Yahoo Inc.
// Licensed under the MIT license.
// See the included LICENSE file for terms.

const sinon = require('sinon');
const { assert } = require('chai');
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
                assert.isNull(err);
                assert.isTrue(myFunc.calledOnce);
                done();
            };

            myFunc.yieldsAsync(null);

            retryFn(
                {
                    method: myFunc,
                },
                myCallback,
            );
        });

        it('should retry fn until success', (done) => {
            myCallback = (err) => {
                assert.isNull(err);
                assert.isTrue(myFunc.calledThrice);
                done();
            };

            myFunc.yieldsAsync(new Error('nope'));
            myFunc.onCall(2).yieldsAsync(null);

            retryFn(
                {
                    method: myFunc,
                    options: {
                        minTimeout: 10,
                        retries: 5,
                    },
                },
                myCallback,
            );
        });

        it('should have error if never succeeds', (done) => {
            myCallback = (err) => {
                assert.isNotNull(err);
                assert.equal(err.message, 'nope');
                assert.isTrue(myFunc.calledThrice);
                done();
            };

            myFunc.yieldsAsync(new Error('nope'));

            retryFn(
                {
                    method: myFunc,
                    options: {
                        minTimeout: 10,
                        retries: 2,
                    },
                },
                myCallback,
            );
        });

        it('should not continue if shouldRetry says not to', (done) => {
            myCallback = (err) => {
                assert.isNotNull(err);
                assert.equal(err.message, 'yep');
                assert.isTrue(myFunc.calledThrice);
                done();
            };

            myFunc.yieldsAsync(new Error('nope'));
            myFunc.onCall(2).yieldsAsync(new Error('yep'));

            retryFn(
                {
                    method: myFunc,
                    shouldRetry: (err) => err.message === 'nope',
                    options: {
                        minTimeout: 10,
                        retries: 5,
                    },
                },
                myCallback,
            );
        });

        it('should fail if validation fails', () => {
            assert.throws(
                () => {
                    retryFn({}, () => ({}));
                },
                Error,
                '"method" is required',
            );
        });

        it('should fail if callback missing', () => {
            assert.throws(
                () => {
                    retryFn({});
                },
                Error,
                '"callback" must be a function',
            );
        });
    });
});
