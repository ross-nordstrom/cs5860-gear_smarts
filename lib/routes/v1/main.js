/**
 * Main V1 routes file
 * @module Routes/V1
 * @memberof Routes
 * @description Wire up all the routes for the V1 of the API
 */

/*global exports, process, require, exports */
"use strict";

var util = require('../../utils/main');
var _ = util._;
var express = require('express');
var machineLearningRouter = require('./machineLearningRouter');
var weatherRouter = require('./weather');

/**
 * Wire up all the V1 routes
 * @param app   - Express app on which to put the routes
 */
exports.route = function route(app) {
    // REGISTER OUR ROUTES -------------------------------
    // all of our routes will be prefixed with the version (e.g. /v1)
    app.use('/v1/machinelearning', machineLearningRouter.getRoutes());
    app.use('/v1/ml', machineLearningRouter.getRoutes());
    app.use('/v1/weather', weatherRouter.getRoutes());
};
