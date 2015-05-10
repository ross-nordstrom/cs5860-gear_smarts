/**
 * Machine Learning Router
 * @module Routes/V1/MachineLearning
 * @memberof Routes/VA
 * @description Routes for interacting with the Machine Learning core
 */

/*global exports, process, require, exports */
"use strict";

var util = require('../../utils/main');
var _ = util._;
var express = require('express');
var router = express.Router();
var controller = require('../../controllers/machineLearning/main');

/***********************************************************************************************************************
 * Timeseries routes
 **/

/**
 * Define all the timeseries routes. Assume the caller of this will apply a namespace like "/timeseries"
 * @returns {*}
 * @example
 * //
 * // Train
 * //
 * http post http://localhost:8080/v1/ml/drseuss/train/catinthehat [onefish, bluefish]
 * // or
 * http get http://localhost:8080/v1/ml/drseuss/train/catinthehat?onefish,twofish
 */
exports.getRoutes = function getRoutes() {
    router.route('/:namespace/train/:classification')
        .post(controller.train)
        .get(controller.train);
    router.route('/:namespace/classify')
        .post(controller.classify)
        .get(controller.classify);
    router.route('/:namespace')
        .get(controller.dump);

    return router;
};
