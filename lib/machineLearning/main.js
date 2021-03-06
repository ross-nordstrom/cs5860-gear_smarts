/**
 * Machine learning business logic
 * @module MachineLearning
 * @description Wires up the core machine learning logic
 */

/*global exports, process, require, exports */
"use strict";

var util = require('../utils/main');
var _ = util._;

var Svm = require('./svm');
var svms = {};

/***********************************************************************************************************************
 * MachineLearning module
 **/

/**
 * Train on a datapoint
 *
 * @param {string} namespace            - A namespace in which to train a datapoint.
 *                  Namespaces let you create domain-specific machines
 * @param {string} classification       - What class to give the datapoint
 * @param {object} attributes           - The feature set as a key/value object
 * @param {successCallback} callback    - Callback to receive successfulness
 * @return {*}
 */
exports.train = function train(namespace, classification, attributes, callback) {
    svms[namespace] = svms[namespace] || Svm.create();
    return Svm.train(svms[namespace], namespace, classification, attributes, callback);
};

/**
 * Classify on a datapoint
 *
 * @param {string} namespace            - A namespace in which to train a datapoint.
 *                  Namespaces let you create domain-specific machines
 * @param {object} attributes           - The feature set as a key/value object
 * @param {successCallback} callback    - Callback to receive successfulness
 * @return {*}
 */
exports.classify = function classify(namespace, attributes, callback) {
    svms[namespace] = svms[namespace] || Svm.create();
    return Svm.classify(svms[namespace], namespace, attributes, callback);
};

exports.dump = function dump(namespace, callback) {
    return Svm.dump(namespace, callback);
};

/**
 * Echo on success and error on failure.
 * @callback successCallback
 * @param {Error} err   - Error that occurred
 * @param {object} res  - A response echoing success
 */
