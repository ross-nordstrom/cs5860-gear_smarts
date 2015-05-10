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
 * @param {object} [options] - SVM options
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
 * @param {exports.SVM} svm                 - An SVM object to operate on
 * @param {string} namespace        - An ML namespace, like 'comfort'
 * @param {string} classification   - Class. Like 'hot','ok','cold'
 * @param {object} features         - Key/value attributes
 * @param {function} callback    - Handle the result of training the SVM. Returns the dataset
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
            rows: [/* each row is a featureIdx vector + classIdx */]
        };

    // Update the dictionary
    namespaceDict.classifications = _.union(namespaceDict.classifications, [classification]);
    var featureVals = _.isArray(features) ? features : _.keys(features);
    namespaceDict.features = _.union(namespaceDict.features, featureVals);

    // Construct a normalized dataset row
    var featuresIdxs = indexedFeaturesRow(namespaceDict, features);
    var classIdx = indexedClassification(namespaceDict, classification);
    namespaceDict.rows = upsertRow(namespaceDict.rows, [featuresIdxs, classIdx]);

    // Preserve the updated dictionary
    FeatureDictionary[namespace] = namespaceDict;

    var dataset = namespaceDict.rows;
    util.log.debug({
        Features: {vals: featureVals, row: featuresIdxs},
        Class: {name: classification, id: classIdx},
        Dataset: dataset
    });
    try {
        return svm.train(dataset).done(function () {
            return callback(null, stringifyDataset(namespaceDict, dataset));
        });
    } catch (e) {
        util.log.warn({TrainError: e});
        return callback(null, stringifyDataset(namespaceDict, dataset));
    }
}
exports.train = train;


/**
 * Classifies a datapoint using an SVM.
 *
 * @param {SVM} svm                 - An SVM object to operate on
 * @param {string} namespace        - An ML namespace, like 'comfort'
 * @param {object} features         - Key/value attributes
 * @param {function} callback       - Handle the classification result
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

    var featuresRow = indexedFeaturesRow(namespaceDict, features);

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


/***********************************************************************************************************************
 * Internal Functions
 **/

function upsertRow(rows, row) {
    var compare = _.compose(
        _.isEqual.bind(null, row[0]/*, x */),
        _.property(0)
    );
    var idx = _.findIndex(rows, compare);

    // Update class or just add the new unseen features vector + class
    if (idx < 0) {
        return rows.concat([row]);
    } else {
        var clone = rows.slice(0);
        clone[idx][1] = row[1];
        return clone;
    }
}
function indexedClassification(namespaceDict, classification) {
    return _.indexOf(namespaceDict.classifications, classification);
}
function indexedFeaturesRow(namespaceDict, featuresVals) {
    return _.map(featuresVals, function (v) {
        return _.indexOf(namespaceDict.features, v);
    });
}
function stringifyDataset(namespaceDict, dataset) {
    return _.map(dataset, function (d) {
        // Idx 0 is featureIdxs
        var featureStrs = _.map(d[0], _.propertyOf(namespaceDict.features));

        // Idx 1 is classIdx
        var classStr = namespaceDict.classifications[d[1]];

        return [featureStrs, classStr];
    });
}

exports.upsertRow = upsertRow;
exports.indexedClassification = indexedClassification;
exports.indexedFeaturesRow = indexedFeaturesRow;
exports.stringifyDataset = stringifyDataset;
