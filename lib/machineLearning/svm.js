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
 * Feature Dictionary. Yup... in memory
 **/
var FeatureDictionary = {};

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
 * @param {string} namespace        - An ML namespace, like 'comfort'
 * @param {string} classification   - Class. Like 'hot','ok','cold'
 * @param {object} features         - Key/value attributes
 * @param {resCallback} callback    - Handle the result of training the SVM
 * @return {resCallback} Success or failure of the training
 */
function train(svm, namespace, classification, features, callback) {
    var badSvm = (!_.isObject(svm) || !_.has(svm, 'train'));
    if (badSvm || !_.isNonEmptyString(classification) || !_.isNonEmptyObject(features)) {
        util.log.warn({BadArgs: [svm, classification, features], Msg: 'Please read docs about train() usage'});
        return callback(new Error('Bad args'));
    }

    // TODO: normalize features against a dictionary.
    var namespaceDictionary = FeatureDictionary[namespace] || {
            features: {/* keyed features, each with array of known values */},
            classifications: []
        };

    // Update the dictionary
    namespaceDictionary.features = _.reduce(features, indexFeaturesReducer, namespaceDictionary.features);
    namespaceDictionary.classifications = _.indexOf(namespaceDictionary.classifications, classification) >= 0 ?
        namespaceDictionary.classifications : namespaceDictionary.classifications.concat(classification);

    // Preserve the updated dictionary
    FeatureDictionary[namespace] = namespaceDictionary;

    var dataset = null; // TODO: dictionary to dataset conversion (or for just the one new row)
    return svm.train(dataset).done(callback);
}
exports.train = train;

/**
 * Helper function for normalizing a features key/value object
 *
 * @protected
 * @param {object} allFeatures          - Keyed object of arrays of known values for each feature
 * @param {string|number} featureVal    - The feature's value to index
 * @param {string} featureKey           - The feature to index
 * @return {object} Updated allFeatures
 */
function indexFeaturesReducer(allFeatures, featureVal, featureKey) {
    allFeatures[featureKey] = allFeatures[featureKey] || [];

    if (_.indexOf(allFeatures[featureKey], featureVal) < 0) {
        // Wasn't indexed. Add it!
        allFeatures[featureKey].push(featureVal);
    }

    return allFeatures;
}
exports.indexFeaturesReducer = indexFeaturesReducer;

/**
 * Echo on success and error on failure.
 * @callback resCallback
 * @param {Error} err   - Error that occurred
 * @param {object} res  - A result object of some sort
 */
