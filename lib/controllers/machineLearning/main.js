/**
 * MachineLearning controllers
 * @module Controllers/MachineLearning
 * @description Wires up the main MachineLearning module with consumer interactions via the API Routes.
 */

/*global process, require, exports */
"use strict";

var util = require('../../utils/main');
var _ = util._;
var MachineLearning = require('../../machineLearning/main');
var express = require('express');

/***********************************************************************************************************************
 * MachineLearning controllers
 **/

/**
 * Train the machine learning core on a feature set for a given classification.
 *
 * Path: /v1/machinelearning/:namespace/train/:classification {attributes}
 *
 * @param req   The request object
 * @param res   The response object
 * @return {*}
 * @example
 * http post http://localhost:8080/v1/ml/drseuss/train/catinthehat feature1=onefish feature2=bluefish
 */
exports.train = function train(req, res) {
    var namespace = req.params.namespace;
    var classification = req.params.classification;
    var attributes = _.isEmpty(req.body) ? req.query : req.body;
    var features = attributes;
    try {
        features = JSON.parse(attributes.features) || attributes;
    } catch (e) {
        util.log.warn(e, 'Problem parsing features from query');
    }
    util.log.trace({Namespace: namespace, Classification: classification, Attributes: features});

    return MachineLearning.train(namespace, classification, features, function (err, result) {
        if (err) {
            return res.status(400).json({error: err});
        }
        return res.status(201).json(result);
    });
};
exports.classify = function classify(req, res) {
    var namespace = req.params.namespace;
    var attributes = _.isEmpty(req.body) ? req.query : req.body;
    util.log.trace({Namespace: namespace, Attributes: attributes});

    return MachineLearning.classify(namespace, attributes, function (err, classification) {
        if (err) {
            return res.status(400).json({error: err.message});
        }
        return res.status(200).json(classification);
    });
};
