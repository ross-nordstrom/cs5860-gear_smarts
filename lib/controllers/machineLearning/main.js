/**
 * MachineLearning controllers
 * @module Controllers
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
exports.train = function train(req, res) {
    return res.status(400).json({error: 'Not implemented yet'});
};
exports.test = function test(req, res) {
    return res.status(400).json({error: 'Not implemented yet'});
};
exports.classify = function classify(req, res) {
    return res.status(400).json({error: 'Not implemented yet'});
};
