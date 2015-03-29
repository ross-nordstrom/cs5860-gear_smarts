/*global require, process, describe, it, xit, before, beforeEach, after, afterEach */
"use strict";

/***********************************************************************************************************************
 * General Test Dependencies
 **/
var expect = require('expect.js');
var util = require('../../lib/utils/main');
var _ = util._;
var async = require('async');
var testHelper = require('../testHelpers/testHelper');

/***********************************************************************************************************************
 * Unit-Under-Test Dependencies
 **/
var Svm = require('../../lib/machineLearning/svm');

/***********************************************************************************************************************
 * The Tests!
 **/
describe('MachineLearning/Svm', function () {
    describe('create', function () {
        var FUT = Svm.create;

        it('should be a function', function (done) {
            expect(FUT).to.be.a('function');
            return done();
        });
        it('should ignore bad options', function (done) {
            testHelper.badObjects.forEach(function (badObject) {
                var svm = FUT(badObject);
                expect(svm).to.be.ok();
                expect(svm.train).to.be.a('function');
                expect(svm.predict).to.be.a('function');
            });

            return done();
        });
        it('should create an SVM with reasonable defaults', function (done) {
            var svm = FUT({});
            expect(svm).to.be.ok();
            expect(svm.train).to.be.a('function');
            expect(svm.predict).to.be.a('function');
            return done();
        });
        it('should create an SVM with options', function (done) {
            var svm = FUT({svmType: 'NU_SVC'});
            expect(svm).to.be.ok();
            expect(svm.train).to.be.a('function');
            expect(svm.predict).to.be.a('function');
            return done();
        });
    }); // describe('create')
    describe('train', function () {
        var FUT = Svm.train;

        it('should be a function', function (done) {
            expect(FUT).to.be.a('function');
            return done();
        });
        it('should not operate on bad inputs', function (done) {
            var demoSvm = Svm.create();

            var testCallback = function (cb) {
                return function (err, res) {
                    expect(err).to.be.an(Error);
                    expect(res).to.not.be.ok();
                    return cb();
                };
            };

            return async.series([
                function (taskCb) {
                    return FUT('lkasdf', null, null, null, testCallback(taskCb));
                },
                function (taskCb) {
                    return FUT(demoSvm, [Infinity], null, null, testCallback(taskCb));
                },
                function (taskCb) {
                    return FUT(demoSvm, [Infinity], [Infinity], null, testCallback(taskCb));
                },
                function (taskCb) {
                    return FUT(demoSvm, 'drseuss', 'lkajsdf', null, testCallback(taskCb));
                },
                function (taskCb) {
                    return FUT(demoSvm, 'drseuss', {foo: 'bar'}, null, testCallback(taskCb));
                }
            ], done);
        });
        it('should work on the XOR example', function (done) {
            var xorSvm = Svm.create();

            return async.series([
                function (taskCb) {
                    return Svm.train(xorSvm, 'xor', '0', {a: 0, b: 0}, function (err, res) {
                        expect(err).to.not.be.ok();
                        expect(res).to.eql([
                            [[0, 0], 0]
                        ]);
                        return taskCb();
                    });
                },
                function (taskCb) {
                    return Svm.train(xorSvm, 'xor', '1', {a: 0, b: 1}, function (err, res) {
                        expect(err).to.not.be.ok();
                        expect(res).to.eql([
                            [[0, 0], 0],
                            [[0, 1], 1]
                        ]);
                        return taskCb();
                    });
                },
                function (taskCb) {
                    return Svm.train(xorSvm, 'xor', '1', {a: 1, b: 0}, function (err, res) {
                        expect(err).to.not.be.ok();
                        expect(res).to.eql([
                            [[0, 0], 0],
                            [[0, 1], 1],
                            [[1, 0], 1]
                        ]);
                        return taskCb();
                    });
                },
                function (taskCb) {
                    return Svm.train(xorSvm, 'xor', '0', {a: 1, b: 1}, function (err, res) {
                        expect(err).to.not.be.ok();
                        expect(res).to.eql([
                            [[0, 0], 0],
                            [[0, 1], 1],
                            [[1, 0], 1],
                            [[1, 1], 0]
                        ]);
                        return taskCb();
                    });
                }
            ], function (err, res) {
                return done();
            });
        });
    }); // describe('train')

    // Internal functions
    describe('indexFeaturesReducer', function () {
        var FUT = Svm.indexFeaturesReducer;

        it('should be a function', function (done) {
            expect(FUT).to.be.a('function');
            return done();
        });
        it('should work on an example usage', function (done) {
            var allFeatures = FUT({}, 'fleece', 'coat');
            expect(allFeatures).to.eql({coat: ['fleece']});

            // Idempotent
            allFeatures = FUT(allFeatures, 'fleece', 'coat');
            expect(allFeatures).to.eql({coat: ['fleece']});

            allFeatures = FUT(allFeatures, 'shell', 'coat');
            expect(allFeatures).to.eql({coat: ['fleece', 'shell']});

            allFeatures = FUT(allFeatures, 'snowpants', 'pants');
            expect(allFeatures).to.eql({coat: ['fleece', 'shell'], pants: ['snowpants']});

            return done();
        });
    }); // describe('indexFeaturesReducer')
}); // describe('MachineLearning/Svm')
