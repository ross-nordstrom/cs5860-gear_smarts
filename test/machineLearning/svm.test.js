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
        it.skip('should work on the XOR example as object', function (done) {
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
        it('should work on the XOR example as array', function (done) {
            var xorSvm = Svm.create();

            return async.series([
                function (taskCb) {
                    return Svm.train(xorSvm, 'xor2', '0', [0, 0], function (err, res) {
                        expect(err).to.not.be.ok();
                        expect(res).to.eql([
                            [[0, 0], '0']
                        ]);
                        return taskCb();
                    });
                },
                function (taskCb) {
                    return Svm.train(xorSvm, 'xor2', '1', [0, 1], function (err, res) {
                        expect(err).to.not.be.ok();
                        expect(res).to.eql([
                            [[0, 1], '1']
                        ]);
                        return taskCb();
                    });
                },
                function (taskCb) {
                    return Svm.train(xorSvm, 'xor2', '1', [1, 0], function (err, res) {
                        expect(err).to.not.be.ok();
                        expect(res).to.eql([
                            [[1, 0], '1']
                        ]);
                        return taskCb();
                    });
                },
                function (taskCb) {
                    return Svm.train(xorSvm, 'xor2', '0', [1, 1], function (err, res) {
                        expect(err).to.not.be.ok();
                        expect(res).to.eql([
                            [[1, 1], '0']
                        ]);
                        return taskCb();
                    });
                }
            ], function (err, res) {
                return done();
            });
        });
        it('should work on the XOR example as array of strings', function (done) {
            var xorSvm = Svm.create();

            return async.series([
                function (taskCb) {
                    return Svm.train(xorSvm, 'xor3', 'false', ['false', 'false'], function (err, res) {
                        expect(err).to.not.be.ok();
                        expect(res).to.eql([
                            [['false', 'false'], 'false']
                        ]);
                        return taskCb();
                    });
                },
                function (taskCb) {
                    return Svm.train(xorSvm, 'xor3', 'true', ['false', 'true'], function (err, res) {
                        expect(err).to.not.be.ok();
                        expect(res).to.eql([
                            [['false', 'true'], 'true']
                        ]);
                        return taskCb();
                    });
                },
                function (taskCb) {
                    return Svm.train(xorSvm, 'xor3', 'true', ['true', 'false'], function (err, res) {
                        expect(err).to.not.be.ok();
                        expect(res).to.eql([
                            [['true', 'false'], 'true']
                        ]);
                        return taskCb();
                    });
                },
                function (taskCb) {
                    return Svm.train(xorSvm, 'xor3', 'false', ['true', 'true'], function (err, res) {
                        expect(err).to.not.be.ok();
                        expect(res).to.eql([
                            [['true', 'true'], 'false']
                        ]);
                        return taskCb();
                    });
                }
            ], function (err, res) {
                return done();
            });
        });
    }); // describe('train')
    describe('classify', function () {
        var FUT = Svm.classify;
        var xorSvm = Svm.create();
        var xor = [
            [[0, 0], 'xor_no'],
            [[0, 1], 'xor_yes'],
            [[1, 0], 'xor_yes'],
            [[1, 1], 'xor_no']
        ];

        before(function (cb) {
            return async.map(xor, function (row, rowCb) {
                return Svm.train(xorSvm, 'xor', row[1], row[0], rowCb);
            }, cb);
        });

        it('should be a function', function (done) {
            expect(FUT).to.be.a('function');
            return done();
        });
        it.skip('should smother bad inputs', function (done) {
            var demoSvm = Svm.create();

            var testCallback = function (cb) {
                return function (err, res) {
                    expect(err).to.not.be.ok();
                    expect(res).to.equal(null);
                    return cb();
                };
            };

            return async.series([
                function (taskCb) {
                    try {
                        return demoSvm.train(xor).done(function () {
                            return taskCb();
                        });
                    } catch (e) {
                        return taskCb();
                    }
                },
                function (taskCb) {
                    return FUT('lkasdf', null, null, testCallback(taskCb));
                },
                function (taskCb) {
                    return FUT(demoSvm, [Infinity], null, testCallback(taskCb));
                },
                function (taskCb) {
                    return FUT(demoSvm, [Infinity], [Infinity], testCallback(taskCb));
                },
                function (taskCb) {
                    return FUT(demoSvm, 'drseuss', 'lkajsdf', testCallback(taskCb));
                },
                function (taskCb) {
                    return FUT(demoSvm, 'drseuss', {foo: 'bar'}, testCallback(taskCb));
                }
            ], done);
        });
        it('should work on the XOR example', function (done) {
            return async.map(xor, function (row, rowCb) {
                return Svm.classify(xorSvm, 'xor', {a: row[0][0], b: row[0][1]}, function (err, classification) {
                    expect(err).to.not.be.ok();
                    expect(classification).to.equal(row[1]);
                    return rowCb();
                });
            }, done);
        });
    }); // describe('classify')

    // Internal functions
    describe('upsertRow', function () {
        var FUT = Svm.upsertRow;
        var rows = [
            [['one', 'fish'], 'drseuss'],
            [['foo', 'bar'], 'cs']
        ];

        it('should be a function', function (done) {
            expect(FUT).to.be.a('function');
            return done();
        });
        it('should append if features not present', function (done) {
            var row = [[0, 0], 0];
            expect(FUT([], row)).to.eql([row]);

            row = [['red', 'fish'], 'drseuss'];
            expect(FUT(rows, row)).to.eql([
                [['one', 'fish'], 'drseuss'],
                [['foo', 'bar'], 'cs'],
                [['red', 'fish'], 'drseuss'] // New row
            ]);
            return done();
        });
        it('should update class if feature present', function (done) {
            var row = [['foo', 'bar'], 'military'];
            expect(FUT(rows, row)).to.eql([
                [['one', 'fish'], 'drseuss'],
                [['foo', 'bar'], 'military']
            ]);
            return done();
        });
    }); // describe('upsertRow')
    describe('indexedClassification', function () {
        var FUT = Svm.indexedClassification;

        it('should be a function', function (done) {
            expect(FUT).to.be.a('function');
            return done();
        });
        it('should work on an example usage', function (done) {
            var dict = {classifications: ['colors', 'animals']};
            expect(FUT(dict, 'colors')).to.equal(0);
            expect(FUT(dict, 'animals')).to.equal(1);
            return done();
        });
    }); // describe('indexedClassification')
    describe('indexedFeaturesRow', function () {
        var FUT = Svm.indexedFeaturesRow;

        it('should be a function', function (done) {
            expect(FUT).to.be.a('function');
            return done();
        });
        it('should work on an example usage', function (done) {
            var dict = {features: ['red', 'parrot', 'green', 'blue', 'iguana']};
            expect(FUT(dict, ['red', 'green'])).to.eql([0, 2]);
            expect(FUT(dict, ['blue', 'parrot', 'iguana'])).to.eql([3, 1, 4]);
            return done();
        });
    }); // describe('indexedFeaturesRow')
}); // describe('MachineLearning/Svm')
