/**
 * http://www.csie.ntu.edu.tw/~cjlin/libsvmtools/datasets/binary.html > a1a
 * @module GearSmarts/Tests/a1a
 * @memberof GearSmarts/Tests
 * @description Tests the a1a data set against the GearSmarts API. Assumes API is running on localhost:8080
 *
 *  Preprocessing:  The original Adult data set has 14 features, among which six are continuous and eight are categorical. In this data set, continuous features are discretized into quantiles, and each quantile is represented by a binary feature. Also, a categorical feature with m categories is converted to m binary features. Details on how each feature is converted can be found in the beginning of each file from this page. [JP98a]
 *  # of classes: 2
 *  # of data: 1,60 5 / 30,956 (testing)
 *  # of features:  123 / 123 (testing)
 *  Files:
 *  a1a
 *  a1a.t (testing)
 *
 *  @example
 *  $ node
 *  // Print out training data
 *  var x= require('./scripts/a1a/script.js'); x.getTrainingData(x.logger)
 *  //==> Prints out the first NUM_ROWS rows of training data
 *
 *  // Manually train XOR
 *  var x= require('./scripts/a1a/script.js');
 *  x.trainRow([[0,0], 0]); x.trainRow([[1,1], 0]);
 *  x.trainRow([[0,1], 1]); x.trainRow([[1,0], 1]);
 *  // Then verify:
 *  x.dump(x.logger);
 */

/*global exports, process, require, exports */
"use strict";

var NAMESPACE = 'test_a1a';
var URL = 'http://localhost:8080/v1/ml/' + NAMESPACE;
var TRAIN_FILE = 'train.txt';
var TEST_FILE = 'test.txt';
var NUM_ROWS = 3;
var MAX_CALLS = 10;

var TRAIN_URL = [URL, 'train'].join('/');
var CLASSIFY_URL = [URL, 'classify'].join('/');


var util = require('../../lib/utils/main');
var _ = util._;
var fs = require('fs');
var async = require('async');
var request = require('superagent');

/***********************************************************************************************************************
 * Train the ML API
 **/

/**
 * Train the API on a dataset
 * @param {array[]} dataset
 * @param {object} [query]
 * @param {function} callback
 * @return {*}
 */
function train(dataset, query, callback) {
    if (_.isFunction(query)) {
        callback = query;
        query = undefined;
    }
    if (!_.isArray(dataset)) {
        return callback(new Error('Expecting dataset to be array of data rows'));
    }

    return async.mapLimit(dataset, MAX_CALLS, trainRow, function (e, r) {
        return e ? callback(e) : dump(callback);
    });
}


/***********************************************************************************************************************
 * Test the ML API
 **/


/***********************************************************************************************************************
 * Helpers
 **/

/**
 * Train the API on a feature/class row
 * @param {array} row           - [ [f1,f2,...,fn], cls ]
 * @param {object} [query]
 * @param {function} callback
 */
function trainRow(row, query, callback) {
    if (_.isFunction(query)) {
        callback = query;
        query = undefined;
    }
    if (!_.isArray(row) || _.size(row) !== 2) {
        return callback(new Error('Expecting row to look like: [ [f1,f2,...,fn], cls ]'));
    }
    var url = [TRAIN_URL, row[1]].join('/');

    return request.post(url)
        .send(_.extend({}, query, {features: row[0]}))
        .set('Accept', 'application/json')
        .end(resHandler(callback))
        .url;
}
/**
 * Retrieve the trained dataset
 */
function dump(callback) {
    return request.get(URL)
        .set('Accept', 'application/json')
        .end(resHandler(callback))
        .url;
}

function resHandler(callback) {
    if (!_.isFunction(callback)) {
        callback = function () {
            console.log("Got response.");
        };
    }
    return function (err, res) {
        if (err) {
            return callback(err);
        }

        var retVal = [null, res.body];
        return callback.apply(null, res.ok ? retVal : retVal.reverse());
    };
}

function logger(err, res) {
    console.log("Callback invoked:\nERR? ", err);
    if (!_.isArray(res)) {
        console.log("RES? ", res);
    } else {
        console.log("RES? ", res.slice(0, NUM_ROWS));
        var rem = res.length - NUM_ROWS;
        if (rem > 0) {
            console.log("\n\n + " + rem + " more...");
        }
    }
}
function getTrainingData(callback) {
    return getData([__dirname, TRAIN_FILE].join('/'), callback);
}
function getTestingData(callback) {
    return getData([__dirname, TEST_FILE].join('/'), callback);
}
function getData(filename, callback) {
    return fs.readFile(filename, {encoding: 'utf8'}, function (err, data) {
        if (err) {
            return callback(err);
        }

        /*
         * Expect data to look like:
         *
         * -1 2:1 8:1 17:1 19:1 39:1 40:1 48:1 63:1 67:1 73:1 74:1 76:1 82:1 87:1
         * +1 4:1 9:1 18:1 20:1 37:1 42:1 55:1 64:1 67:1 73:1 75:1 76:1 82:1 83:1
         *
         * And we want it to look like:
         */
        var formattedData = data.split("\n").map(function (row) {
            var els = row.split(" ");
            var cls = els[0];
            var fObjs = els.slice(1);
            var fts = _.compact(fObjs.map(function (x) {
                return x.split(':')[0];
            }));
            return [fts, cls];
        });
        return callback(null, formattedData);
    });
}

/***********************************************************************************************************************
 * Export
 **/

// Train
exports.train = train;

// Test

// Helpers
exports.trainRow = trainRow;
exports.dump = dump;
exports.getTrainingData = getTrainingData;
exports.getTestingData = getTestingData;
exports.logger = logger;
