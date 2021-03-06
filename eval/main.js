/**
 * http://www.csie.ntu.edu.tw/~cjlin/libsvmtools/datasets/binary.html
 * @module GearSmarts/Eval
 * @memberof GearSmarts
 * @description Tests the data sets against the GearSmarts API. Assumes API is running on localhost:8080
 *
 *  @example
 *  $ node
 *  //
 *  // Print out training data
 *  //
 *  var x= require('./eval/main.js'); x.getTrainingData(x.logger)
 *  //==> Prints out the first NUM_ROWS rows of training data
 *
 *
 *  //
 *  // Smoke test using XOR
 *  //
 *  var x= require('./eval/main.js');
 *  var xor = [ [[0,0],0], [[0,1],1], [[1,0],1], [[1,1],0] ];
 *  x.trainDataset(x.logger)(null, xor);
 *
 *  // Then test
 *  x.testDataset(1, x.logger)(null, xor);
 *  //==> Output:
 *  //  {
 *  //    count: 4,
 *  //    raw: { TP: 2, TN: 2, FP: 0, FN: 0 },
 *  //    accuracy: 1,
 *  //    precision: 1,
 *  //    recall: 1,
 *  //    specificity: 1
 *  //  }
 *
 *
 *  //
 *  // Train on the actual data
 *  //
 *  var x = require('./eval/main.js');
 *  x.train('a1a', x.logger);
 *  // Wait a while for it to complete...
 *  x.test('a1a', '+1', x.logger);
 *  // Wait more...
 *  //==> Output:
 *  {
 *    count: 30956,
 *    raw: { TP: 318, TN: 21556, FP: 1954, FN: 7128 },
 *    accuracy: 0.707,
 *    precision: 0.14,
 *    recall: 0.043,
 *    specificity: 0.917
 *  }
 *
 *  //
 *  // Partition comfort response data, then train and test on it
 *  //
 *  var x = require('./eval/main.js');
 *  x.partitionData(60, './eval/comfort/normalized.txt', './eval/comfort80');
 *  x.train('comfort80', x.logger)
 *  // Wait for it to complete
 *
 *  // What's the performance classifying 'good'?
 *  x.test('comfort80', 'good', x.logger)
 *  // Hot?
 *  x.test('comfort80', 'hott', x.logger)
 *  // Cold?
 *  x.test('comfort80', 'cold', x.logger)
 *
 *  //==> Example output on a good partition:
 *  // Good @60%
 *  {
 *    count: 52,
 *    raw: { TP: 6, TN: 18, FP: 7, FN: 21 },
 *    accuracy: 0.462,
 *    precision: 0.462,
 *    recall: 0.222,
 *    specificity: 0.72
 *  }
 *  // Hot @60%
 *  {
 *    count: 52,
 *    raw: { TP: 15, TN: 9, FP: 17, FN: 11 },
 *    accuracy: 0.462,
 *    precision: 0.469,
 *    recall: 0.577,
 *    specificity: 0.346
 *  }
 *  // Cold @60%
 *  {
 *    count: 52,
 *    raw: { TP: 3, TN: 21, FP: 4, FN: 24 },
 *    accuracy: 0.462,
 *    precision: 0.429,
 *    recall: 0.111,
 *    specificity: 0.84
 *  }
 */

/*global exports, process, require, exports */
"use strict";

var NAMESPACE = 'evalApi';
var URL = 'http://localhost:8080/v1/ml/' + NAMESPACE;
var TRAIN_FILE = 'train.txt';
var TEST_FILE = 'test.txt';
var NUM_ROWS = 10;
var MAX_CALLS = 10;
var PRECISION = 1000; // How accurate should results be?

var TRAIN_PATH = 'train';
var CLASSIFY_PATH = 'classify';

var WEATHER_KEYS = ['meantempi', 'maxwspdi', 'meandewpti'];
//var INDOOR_FEATURES = ['INDOOR', 'meantempi=70', 'mintempi=65', 'maxtempi=75'];
var INDOOR_FEATURES = ['INDOOR', 'meantempi=70'];

var util = require('../lib/utils/main');
var _ = util._;
var fs = require('fs');
var async = require('async');
var request = require('superagent');

/***********************************************************************************************************************
 * Train the ML API
 **/

/**
 * Train on the default dataset
 * @param {string} suite    - Which test suite to run. E.g. 'a1a', 'a2a', etc...
 * @param callback
 * @return {*}
 */
function train(suite, callback) {
    return getTrainingData(suite, trainDataset(suite, callback));
}

/**
 * Train the API on a dataset
 * @param {string} suite    - Which test suite to run. E.g. 'a1a', 'a2a', etc...
 * @param {function} callback
 * @return {*}
 */
function trainDataset(suite, callback) {
    return function (err, dataset) {
        if (err) {
            return callback(err);
        }
        if (!_.isArray(dataset)) {
            return callback(new Error('Expecting dataset to be array of data rows'));
        }

        console.log("Train " + dataset.length + " rows...");
        return async.mapLimit(dataset, MAX_CALLS, trainRow.bind(null, suite/*, row, callback*/), function (e, r) {
            console.log("Done training " + _.size(r) + " rows. " + (e ? 'Error :(' : 'Dumping dataset...') + "\n");
            return e ? callback(e) : dump(suite, callback);
        });
    };
}


/***********************************************************************************************************************
 * Test the ML API
 **/

/**
 * Test on the default dataset
 * @param {string} suite    - Which test suite to run. E.g. 'a1a', 'a2a', etc...
 * @param {string|number} posClass  - Which class to consider positive
 * @param callback
 * @return {*}
 */
function test(suite, posClass, callback) {
    return getTestingData(suite, testDataset(suite, posClass, callback));
}

/**
 * Test the API on a dataset
 * @param {string} suite    - Which test suite to run. E.g. 'a1a', 'a2a', etc...
 * @param {string|number} posClass  - Which class to consider positive
 * @param {function} callback
 * @return {*}
 */
function testDataset(suite, posClass, callback) {
    return function (err, dataset) {
        if (err) {
            return callback(err);
        }
        if (!_.isArray(dataset)) {
            return callback(new Error('Expecting dataset to be array of data rows'));
        }

        console.log("Test " + dataset.length + " rows...");
        return async.mapLimit(dataset, MAX_CALLS, testRow.bind(null, suite, posClass/*, row, callback */), function (e, r) {
            console.log("Done testing.\n");

            if (e) {
                return callback(e);
            }

            /*
             * Expect results to look like:
             * [ 'TP', 'FN', 'FN', 'FP', 'TN', ... ]
             */
            var c = _.extend({TP: 0, TN: 0, FP: 0, FN: 0}, _.countBy(_.compact(r), _.identity));

            // http://webdocs.cs.ualberta.ca/~eisner/measures.html
            var accuracy = (c.TP + c.TN) / r.length;    // The percentage of predictions that are correct.
            var precision = c.TP / (c.TP + c.FP);       // The percentage of positive predictions that are correct.
            var recall = c.TP / (c.TP + c.FN);          // The percentage of positive labeled instances that were predicted as positive.
            var specificity = c.TN / (c.TN + c.FP);     // The percentage of negative labeled instances that were predicted as negative.

            return callback(null, {
                count: _.compact(r).length,
                raw: c,
                accuracy: Math.round(PRECISION * accuracy) / PRECISION,
                precision: Math.round(PRECISION * precision) / PRECISION,
                recall: Math.round(PRECISION * recall) / PRECISION,
                specificity: Math.round(PRECISION * specificity) / PRECISION
            });
        });
    };
}

/***********************************************************************************************************************
 * Helpers
 **/

var indicators = ['|', '/', '-', '\\'];
var ind = 0;

/**
 * Train the API on a feature/class row
 * @param {string} suite    - Which test suite to run. E.g. 'a1a', 'a2a', etc...
 * @param {array} row           - [ [f1,f2,...,fn], cls ]
 * @param {function} callback
 */
function trainRow(suite, row, callback) {
    if (!_.isNonEmptyString(suite) || _.size(row) !== 2) {
        console.log("\nBad suite/row: ", {suite: suite, row: row});
        return callback(new Error('Expecting row to look like: [ [f1,f2,...,fn], cls ]'));
    }
    if (!_.isNonEmptyString(row[1])) {
        console.log("\nSkipping bad row: ", row);
        return callback(null, null);
    }
    var url = [[URL, suite].join('_'), TRAIN_PATH, row[1]].join('/');
    process.stdout.write(indicators[ind] + " Train url: " + url + "\r");
    ind = (ind + 1) % _.size(indicators);
    return request.post(url)
        .send({features: row[0]})
        .set('Accept', 'application/json')
        .end(resHandler(callback))
        .url;
}
/**
 * Test the API on a feature/class row. Assumes there are only 2 classes
 * @param {string} suite    - Which test suite to run. E.g. 'a1a', 'a2a', etc...
 * @param {string|number} posClass  - Which class to consider positive
 * @param {array} row           - [ [f1,f2,...,fn], cls ]
 * @param {function} callback
 */
function testRow(suite, posClass, row, callback) {
    if (!_.isNonEmptyString(suite) || _.size(row) !== 2) {
        console.log("\nBad suite/row: ", {suite: suite, row: row});
        return callback(new Error('Expecting row to look like: [ [f1,f2,...,fn], cls ]'));
    }
    if (!_.isNonEmptyString(row[1])) {
        console.log("\nSkipping bad row: ", row);
        return callback(null, null);
    }

    var compareClass = function (err, res) {
        if (err) {
            return callback(err);
        }
        if (!res) {
            return callback(null, null);
        }
        var correct = res.toString() === row[1].toString();
        var predictedPos = res.toString() === posClass.toString();

        var result = [correct ? 'T' : 'F', predictedPos ? 'P' : 'N'].join('');
        return callback(null, result);
    };

    var url = [[URL, suite].join('_'), CLASSIFY_PATH].join('/');
    process.stdout.write(indicators[ind] + " Classify url: " + url + "\r");
    ind = (ind + 1) % _.size(indicators);
    return request.post(url)
        .send({features: row[0]})
        .set('Accept', 'application/json')
        .end(resHandler(compareClass))
        .url;
}

/**
 * Retrieve the trained dataset
 * @param {string} suite    - Which test suite to run. E.g. 'a1a', 'a2a', etc...
 */
function dump(suite, callback) {
    return request.get([URL, suite].join('_'))
        .set('Accept', 'application/json')
        .end(resHandler(callback))
        .url;
}

function resHandler(callback) {
    if (!_.isFunction(callback)) {
        callback = function () {
            console.log("\nGot response.");
        };
    }
    return function (err, res) {
        if (err) {
            console.log("\nresHandler error: ", err);
            return callback(err);
        }

        var retVal = [null, res.body];
        if (!res.ok) {
            console.log("\nresHandler not ok res: ", {ok: res.ok, status: res.status, body: res.body, url: res.url});
        }
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
function getTrainingData(suite, callback) {
    return getData([__dirname, suite, TRAIN_FILE].join('/'), callback);
}
function getTestingData(suite, callback) {
    return getData([__dirname, suite, TEST_FILE].join('/'), callback);
}
function normalizeComfortData(filename, callback) {
    return fs.readFile(filename, {encoding: 'utf8'}, function (err, data) {
        if (err) {
            return callback(err);
        }

        /*
         * Expect data to look like:
         *
         * <class>, <path to weather info>, <gender>, <age_group>, <activity>, <subactivity>, <outfit_features[]>
         *
         * And we want it to look like:
         * [
         *   [ [ <weather_features[]>:1[]<gender>:1 <age_group>:1, <activity>:1, <subactivity>:1, <outfit_features[]>:1[] ], <class> ]
         *   ...
         * ]
         */
        return async.mapLimit(data.split("\n"), MAX_CALLS, function (row, taskCb) {
            var els = row.split(",").map(function (x) {
                return x.trim();
            });
            if (_.size(els) < 3) {
                return taskCb(null, null);
            }
            var cls = els[0];
            var weatherPath = els[1];
            var outfitFts = els.slice(2);

            if (weatherPath.indexOf('INDOOR') >= 0) {
                return taskCb(null, [cls].concat(INDOOR_FEATURES).concat(outfitFts))
            }

            return fs.readFile(['./lib/weather/wunderground', weatherPath].join('/'), {encoding: 'utf8'}, function (err, weatherJson) {
                if (err) {
                    return taskCb(err);
                }

                try {
                    var weatherData = JSON.parse(weatherJson);
                    var weatherInfo = formatWeather(weatherData);
                    var weatherFts = _.map(weatherInfo, serializeKeyVal('=')/*(val, key)*/); // Ex: { temp: 74 } becomes "temp=74"
                    return taskCb(null, [cls].concat(weatherFts).concat(outfitFts));
                } catch (e) {
                    return taskCb(e);
                }
            });
        }, function (err, res) {
            // Remove nulls
            return callback(err, !err ? _.compact(res) : res);
        });
    });
}
function serializeKeyVal(glue) {
    return function (val, key) {
        return [key, val].join(glue);
    }
}
// Info about the keys - http://www.wunderground.com/weather/api/d/docs?d=resources/phrase-glossary
function formatWeather(weatherData) {
    var rawKeys = ['snow', 'rain', 'thunder', 'precipsource'];
    // For each key we want that we can't use raw, define a transform function
    // putting it in an appropriate bucket
    var bucketKeys = {
        maxhumidity: bucketizer(10), // 0-100%. Group by Tens
        minhumidity: bucketizer(10), // 0-100%. Group by Tens
        meandewpti: bucketizer(10), // Dewpoint in F
        meanpressurei: bucketizer(1), // Min ever = 25.69 inHg; Max ever = 32.06 inHg
        meantempi: bucketizer(10), // Degrees F
        meanwindspdi: _.compose(bucketizer(1), log2), // Log_2 of the MPH. Should be 0 - 7
        minwspdi: _.compose(bucketizer(1), log2), // Log_2 of the MPH. Should be 0 - 7
        maxwspdi: _.compose(bucketizer(1), log2), // Log_2 of the MPH. Should be 0 - 7
        mintempi: bucketizer(10), // Degrees F
        maxtempi: bucketizer(10), // Degrees F
        precipi: bucketizer(0.25), // Inches of rain. Group by 1/4"
        snowfalli: bucketizer(4), // Inches of snow. Groups of 4
        snowdepthi: bucketizer(4) // Inches of snow. Groups of 4
    };
    var preppedWeather = _.extend(_.pick(weatherData, rawKeys), _.mapObject(bucketKeys, function (fun, key) {
        return fun(weatherData[key]);
    }));

    // Ignore keys with "" or NaN or null as the value
    var filteredWeather = _.omit(preppedWeather, function (val, key) {
        return _.isNull(val) || _.isNaN(val) || val === '';
    });
    return _.pick(filteredWeather, WEATHER_KEYS);
}
function bucketizer(bktSize) {
    return function (str) {
        var val = parseFloat(str);
        return val - val % bktSize;
    }
}
function log2(b) {
    return Math.log(2) / Math.log(b);
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
         * [
         *   [ [ 2, 8, 17, 19, ... ], -1 ]
         *   [ [ 4, 9, 18, 20, ... ], +1 ]
         *   ...
         * ]
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
function partitionData(percentTrain, sourceFile, destDir) {
    console.log("Partition data into " + percentTrain + "% training");
    var dataBuf = fs.readFileSync(sourceFile, {encoding: 'utf8'});
    var data = dataBuf.split("\n");

    var boundary = _.size(data) * percentTrain / 100;
    console.log(" -> " + _.size(data) + " rows. Split at " + boundary);
    var trainAndTestIdxs = _.partition(_.shuffle(_.range(data.length)), function (randIdx, i) {
        return i < boundary;
    });
    var train = _.map(trainAndTestIdxs[0], function (idx) {
        return data[idx];
    });
    var test = _.map(trainAndTestIdxs[1], function (idx) {
        return data[idx];
    });

    fs.writeFileSync([destDir, 'train.txt'].join('/'), train.join("\n"));
    fs.writeFileSync([destDir, 'test.txt'].join('/'), test.join("\n"));
    console.log("Done partitioning " + _.size(train) + " training, " + _.size(test) + " testing rows");
}

/***********************************************************************************************************************
 * Export
 **/

// Train
exports.train = train;
exports.trainDataset = trainDataset;

// Test
exports.test = test;
exports.testDataset = testDataset;

// Helpers
exports.trainRow = trainRow;
exports.testRow = testRow;
exports.dump = dump;
exports.getTrainingData = getTrainingData;
exports.getTestingData = getTestingData;
exports.normalizeComfortData = normalizeComfortData;
exports.formatWeather = formatWeather;
exports.logger = logger;
exports.partitionData = partitionData;