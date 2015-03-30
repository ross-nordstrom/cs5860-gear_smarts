/**
 * Weather controllers
 * @module Controllers/Weather
 * @description Wires up the main Weather module with consumer interactions via the API Routes.
 */

/*global process, require, exports */
"use strict";

var util = require('../../utils/main');
var _ = util._;
var async = require('async');
var express = require('express');
var Weather = require('../../weather/main');

/***********************************************************************************************************************
 * Weather controllers
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
exports.get = function get(req, res) {
    var query = req.query;
    var date = query.date || null;
    util.log.info({Query: query, Date: date});


    return async.waterfall([
        util.asyncConstant(null, req)/*(taskCb)*/,
        util.getCity/*(req, taskCb)*/,
        _.partial(Weather.get, date, _, _)/*(geo, taskCb)*/
    ], function (err, result) {
        if (err) {
            return res.status(400).json({error: err.message});
        }
        return res.status(200).json(result);
    });
};

