/**
 * Weather Routes
 * @module Routes/V1/Weather
 * @memberof Routes/V1
 * @description Wires up the weather-related routes
 * @example
 * HTTP GET {{URL}}/v1/weather?date=3/30/2015&state=CO&city=Littleton&country=USA
 */

/*global exports, process, require, exports */
"use strict";

var util = require('../../utils/main');
var _ = util._;
var express = require('express');
var router = express.Router();
var controller = require('../../controllers/weather/main');

/***********************************************************************************************************************
 * Weather routes
 **/

/**
 * Define all the timeseries routes. Assume the caller of this will apply a namespace like "/timeseries"
 * @returns {*}
 */
exports.getRoutes = function getRoutes() {
    router.route('/')
        .get(controller.get);

    return router;
};
