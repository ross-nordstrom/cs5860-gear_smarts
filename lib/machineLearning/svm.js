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
 * @param {resCallback} callback    - Handle the result of training the SVM. Returns the dataset
 */
function train(svm, namespace, classification, features, callback) {
    var badSvm = (!_.isObject(svm) || !_.isFunction(svm.train));
    if (badSvm || !_.isNonEmptyString(classification) ||
        (!_.isNonEmptyObject(features) && !_.isNonEmptyArray(features))) {
        util.log.warn({BadArgs: [svm, classification, features], Msg: 'Please read docs about train() usage'});
        return callback(new Error('Bad args'));
    }

    // TODO: Store dictionary in Redis or Mongo
    var namespaceDict = FeatureDictionary[namespace] || {
            classifications: [/*list of classifications*/],
            columns: [/*, list of features */],
            rows: [/*[apple, red, round, fruit] */]
        };

    // Update the dictionary
    namespaceDict.classifications = _.union(namespaceDict.classifications, [classification]);
    var featureVals = _.isArray(features) ? features : _.keys(features);
    namespaceDict.columns = _.union(namespaceDict.columns, featureVals);

    // Construct a normalized dataset row
    var featuresRow = featuresRowFromFeaturesObject(namespaceDict, features);
    var classId = _.indexOf(namespaceDict.classifications, classification);
    namespaceDict.rows.push([featuresRow, classId]);

    // Preserve the updated dictionary
    FeatureDictionary[namespace] = namespaceDict;

    var dataset = namespaceDict.rows;
    try {
        return svm.train(dataset).done(function () {
            return callback(null, dataset);
        });
    } catch (e) {
        util.log.warn({TrainError: e});
        return callback(null, dataset);
    }
}
exports.train = train;


/**
 * Classifies a datapoint using an SVM.
 *
 * @param {SVM} svm                 - An SVM object to operate on
 * @param {string} namespace        - An ML namespace, like 'comfort'
 * @param {object} features         - Key/value attributes
 * @param {resCallback} callback    - Handle the classification result
 */
function classify(svm, namespace, features, callback) {
    var badSvm = (!_.isObject(svm) || !_.isFunction(svm.train));
    if (badSvm ||
        (!_.isNonEmptyObject(features) && !_.isNonEmptyArray(features))) {
        util.log.warn({BadArgs: [svm, features], Msg: 'Please read docs about train() usage'});
        return callback(new Error('Bad args'));
    }

    // TODO: Retrieve dictionary from Redis or Mongo
    var namespaceDict = FeatureDictionary[namespace];
    if (!namespaceDict) {
        return callback(new Error('Namespace not trained yet'));
    }

    var featuresRow = featuresRowFromFeaturesObject(namespaceDict, features);

    try {
        return svm.train(namespaceDict.rows).done(function () {
            svm.predict(featuresRow).done(function (classId) {
                return callback(null, namespaceDict.classifications[classId]);
            });
        });
    } catch (e) {
        util.log.warn({TrainError: e});
        return callback(new Error('Problem classifying features'));
    }
}
exports.classify = classify;

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

function featuresRowFromFeaturesObject(namespaceDict, features) {
    return _.reduce(namespaceDict.columns, function (row, featureKey) {
        var val = features[featureKey];
        return row.concat(_.isUndefined(val) ? null : val);
    }, []);
}

/**
 * Echo on success and error on failure.
 * @callback resCallback
 * @param {Error} err   - Error that occurred
 * @param {object} res  - A result object of some sort
 */
