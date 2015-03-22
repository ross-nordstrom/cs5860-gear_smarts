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
var MachineLearning = require('../../lib/machineLearning/main');

/***********************************************************************************************************************
 * The Tests!
 **/
describe('MachineLearning', function () {
    describe('train', function () {
        var FUT = MachineLearning.train;

        it('should be a function', function (done) {
            expect(FUT).to.be.a('function');
            return done();
        });
    }); // describe('train')
    describe('test', testHelper.pendingDescribe);
    describe('classify', testHelper.pendingDescribe);
}); // describe('MachineLearning')
