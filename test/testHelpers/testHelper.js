/*global exports, require, process, describe, it, before, beforeEach, after, afterEach */
"use strict";

var expect = require('expect.js');
var util = require('../../lib/utils/main');
var _ = util._;
var chance = new (require('chance'))();
var async = require('async');

function pendingDescribe() {

}
function requiredTest(done) {
    expect().to.fail('This test is required. Please implement it!');
    return done();
}

function stubbedCallback(response) {
    return function () {
        var cb = _.last(_.parseArguments(arguments));
        return cb(null, response);
    };
}

function failureCallback(failMsg) {
    return function () {
        var cb = _.last(_.parseArguments(arguments));
        return cb(failMsg);
    };
}

exports.pendingDescribe = pendingDescribe;
exports.requiredTest = requiredTest;
exports.stubbedCallback = stubbedCallback;
exports.failureCallback = failureCallback;

exports.badObjects = [
    null, -1, 0, 1, Infinity, -Infinity, {}, undefined, '',
    true, false, [], [null, undefined], [true, 'truthy'], 'truthy'
];
exports.badStrings = [
    null, -1, 0, 1, Infinity, -Infinity, {}, undefined, '',
    true, false, {foo: 'bar'}, ['id1', 'id2', {ohNo: 'not a string!'}]
];
