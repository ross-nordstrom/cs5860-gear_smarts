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
    var attributes = req.body;
    util.log.trace({Namespace: namespace, Classification: classification, Attributes: attributes});

    return MachineLearning.train(namespace, classification, attributes, function (err, result) {
        if (err) {
            return res.status(400).json({error: err});
        }
        return res.status(201).json(res);
    });
};
exports.test = function test(req, res) {
    return res.status(400).json({error: 'Not implemented yet'});
};
exports.classify = function classify(req, res) {
    return res.status(400).json({error: 'Not implemented yet'});
};
