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
