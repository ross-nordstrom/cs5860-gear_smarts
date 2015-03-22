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
 */
exports.getRoutes = function getRoutes() {
    router.route('/train')
        .post(controller.train);
    router.route('/test')
        .post(controller.test);
    router.route('/classify')
        .post(controller.classify);

    return router;
};
