/**
 * Utility functions
 * @module Utils
 * @description Utility functions useful throughout the application
 * @see {@link http://underscorejs.org}
 */

/*global process, process.env, require, module, exports */
"use strict";

var geoip = require('geoip-lite');
//Setup logging in one spot here, but export it so other files can use it.
var bunyan = require('bunyan');
//noinspection JSUnresolvedVariable
var LOG_LEVEL = process.env.LOG_LEVEL || 'debug';
var PROJECT_NAME = process.env.PROJECT_NAME || 'GearSmarts';
var _ = require('underscore');

_.mixin({
    isNonEmptyString: isNonEmptyString,
    isNonEmptyObject: isNonEmptyObject,
    isNonEmptyArray: isNonEmptyArray,
    isTrueParam: isTrueParam,
    toUpperCase: toUpperCase,
    toLowerCase: toLowerCase
});

/**************************************
 * Underscore mixin functions
 */

function isNonEmptyString(s) {
    return _.isString(s) && !_.isEmpty(s);
}
function isNonEmptyObject(o) {
    return _.isObject(o) && !_.isArray(o) && !_.isEmpty(o);
}
function isNonEmptyArray(a) {
    return _.isArray(a) && !_.isEmpty(a);
}
function isTrueParam(x) {
    return _.isString(x) ? (x.toLowerCase() === 'true') : x === true;
}
function toUpperCase(value) {
    return !isNonEmptyString(value) ? null : value.toUpperCase();
}
function toLowerCase(value) {
    return !isNonEmptyString(value) ? null : value.toLowerCase();
}
var log = bunyan.createLogger({
    name: PROJECT_NAME,
    stream: process.stdout,
    level: LOG_LEVEL,
    src: true
});

/**
 * A currying function adding a layer of insulation in front of a callback. Main use is to
 * hide library error messages with ones suitable for consumers to see.
 * @param callback      - function(err, res) to call with insluted errors
 * @param errProducer   - [Optional] function(err) which produces an error message string.
 *                          Defaults to "Ran into a problem"
 * @returns {Function}
 */
function safeCallback(callback, errProducer) {
    errProducer = _.isFunction(errProducer) ? errProducer : _.constant('Ran into a problem');
    return function (err, res) {
        if (err) {
            log.warn({CallbackError: _.pick(err, 'message')});
            log.trace(err);
            return callback(new Error(errProducer(err)));
        }
        return callback(null, res);
    };
}

/**
 * A currying function for invoking a callback with the original arguments provided. Think of it
 * as an Async version of _.constant.
 *
 * Example:
 *      var notImplemented = asyncConstant(new Error('NOT IMPLEMENTED'))
 *      ...
 *      beforeEach(notImplemented) // Always fails tests with error "NOT IMPLEMENTED"
 *
 * @returns {Function}
 */
function asyncConstant(/*arguments*/) {
    var that = null; // this?
    var curriedArgs = _.toArray(arguments);
    return function (callback) {
        return callback.apply(undefined, curriedArgs);
    };
}


function getCity(req, callback) {
    var query = req.body;
    var city = query.city;
    var region = query.state || query.region;

    if (city) {
        return callback(null, {city: city, region: region});
    }
    var ip = req.headers['x-forwarded-for'] ||
        req.connection.remoteAddress ||
        req.socket.remoteAddress ||
        req.connection.socket.remoteAddress;

    if (ip === '127.0.0.1') {
        return callback(null, {
                range: [1795352192, 1795352319],
                country: 'US',
                region: 'CO',
                city: 'Colorado Springs',
                ll: [38.8673, -104.7607],
                metro: 752
            }
        );
    }

    var geo = geoip.lookup(ip);
    return callback(null, geo);
}


exports._ = _;
exports.log = log;  // [fatal, error, warn, info, debug, trace]
exports.safeCallback = safeCallback;
exports.asyncConstant = asyncConstant;
exports.getCity = getCity;
