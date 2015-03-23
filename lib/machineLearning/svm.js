/**
 * Implementation of namespaced SVMs
 * @module MachineLearning/SVM
 * @memberof MachineLearning
 * @description Implements a support vector machine.
 */

/*global exports, process, require, exports */
"use strict";

var util = require('../utils/main');
var _ = util._;
var svm = require('node-svm');

/***********************************************************************************************************************
 * Main Functions
 **/

/**
 * Create an SVM.
 *
 * @param {object} options - SVM options
 * @return {exports.SVM} An SVM object
 * @see [node-svm docs]{@link https://github.com/nicolaspanel/node-svm#parameters-and-options}
 */
exports.create = function (options) {
    if (!_.isNonEmptyObject(options)) {
        util.log.warn({BadOptions: options});
        options = {};
    }

    // Classifiers: https://github.com/nicolaspanel/node-svm#classifiers
    // Kernels: https://github.com/nicolaspanel/node-svm#kernels
    var defaults = {/* rely on node-svm having reasonable defaults */};

    return new svm.SVM(_.defaults(options, defaults));
};

/**
 * Train an SVM.
 *
 * @param {SVM} svm                 - An SVM object to operate on
 * @param {string} classification   - Class. Like 'hot','ok','cold'
 * @param {object} features         - Key/value attributes
 * @param {resCallback} callback    - Handle the result of training the SVM
 * @return {boolean} Success or failure of the training
 */
exports.train = function (svm, classification, features, callback) {
    var badSvm = (!_.isObject(svm) || !_.has(svm, 'train'));
    if (badSvm || !_.isNonEmptyString(classification) || !_.isNonEmptyObject(features)) {
        util.log.warn({BadArgs: [svm, classification, features], Msg: 'Please read docs about train() usage'});
        return callback(new Error('Bad args'));
    }

    // TODO: normalize features against a dictionary.

    var dataset = _.map(features, function (featuresRow) {
        return featuresRow.concat([classification]);
    });
    return svm.train(dataset).done(callback);
};

/**
 * Echo on success and error on failure.
 * @callback resCallback
 * @param {Error} err   - Error that occurred
 * @param {object} res  - A result object of some sort
 */
