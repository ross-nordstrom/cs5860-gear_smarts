/**
 * Weather business logic
 * @module Weather
 * @description Calls a weather service to get data about the weather
 */

/*global exports, process, require, exports */
"use strict";

var util = require('../utils/main');
var _ = util._;
var superagent = require('superagent');
var moment = require('moment');

/* OpenWeatherMap Configuration */
var APPID = process.env.WEATHERMAP_APPID;
if (!_.isNonEmptyString(APPID)) {
    throw new Error('Must set WEATHERMAP_APPID environment variable. ' +
    'Setup an account on http://openweathermap.org/ to get an API Key');
}
var WEATHERMAP_URL = 'http://api.openweathermap.org/data/2.5/';

/***********************************************************************************************************************
 * Weather module
 **/

/**
 * Find out weather for the given location on the given date.
 * @param date
 * @param geo
 * @param callback
 * @return {*}
 */
exports.get = function get(date, geo, callback) {
    util.log.info({Date: date, Geo: geo});

    if (!geo.city) {
        return callback(new Error('Need a city'));
    }

    if (date) {
        return getHistorical(date, geo.city, callback);
    }
    return getCurrent(geo.city, callback);
};

/**
 * Get current weather data. See {@link weathermapRequest} for response structure
 * @param city
 * @param callback
 * @return {Request}
 */
function getCurrent(city, callback) {
    var path = '/weather';
    var query = {q: city};
    return weathermapRequest(path, query, callback);
}

/**
 * Get's weather information for historical dates.
 *
 * **WARNING:** This appears to be unavailable. Price page claims 95-99% avail. Waiting on a response to my support message:
 * https://openweathermap.desk.com/customer/portal/questions/11526780-no-data-returned-historical-
 *
 * @param date
 * @param city
 * @param callback
 * @return {Request}
 */
function getHistorical(date, city, callback) {
    var path = '/history/city';
    var query = {
        q: city,
        start: moment(date).startOf('day').unix(),
        end: moment(date).endOf('day').unix(),
        type: 'day'
    };
    return weathermapRequest(path, query, callback);
}

/**
 * Call OpenWeatherMap's API for weather data
 *
 * @param path
 * @param query
 * @param callback
 * @return {Request}
 * @example
 * HTTP GET localhost:8080/v1/weather
 *
 * Response ==>
 * {
 *     "coord": {
 *         "lon": -104.82,
 *         "lat": 38.83
 *     },
 *     "sys": {
 *         "type": 3,
 *         "id": 27911,
 *         "message": 0.0118,
 *         "country": "US",
 *         "sunrise": 1427719566,
 *         "sunset": 1427764865
 *     },
 *     "weather": [
 *         {
 *             "id": 800,
 *             "main": "Clear",
 *             "description": "Sky is Clear",
 *             "icon": "01n"
 *         }
 *     ],
 *     "base": "stations",
 *     "main": {
 *         "temp": 288.9,
 *         "pressure": 1023,
 *         "temp_min": 282.04,
 *         "temp_max": 292.04,
 *         "humidity": 17
 *     },
 *     "wind": {
 *         "speed": 8.22,
 *         "gust": 8.22,
 *         "deg": 180
 *     },
 *     "clouds": {
 *         "all": 0
 *     },
 *     "dt": 1427675334,
 *     "id": 5417598,
 *     "name": "Colorado Springs",
 *     "cod": 200
 * }
 */
function weathermapRequest(path, query, callback) {
    util.log.info({Path: path, Query: query});
    return superagent.get(WEATHERMAP_URL + path)
        .set({'x-api-key': APPID})
        .set('Accept', 'application/json')
        .query(query)
        .end(function (err, res) {
            return err ? callback(err) : callback(null, _.propertyOf(res.body)('body'));
        });
}
