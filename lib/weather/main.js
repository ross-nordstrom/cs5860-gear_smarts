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
var fs = require('fs');

/* OpenWeatherMap Configuration */
var WEATHER_KEY = process.env.WUNDERGROUND_KEY;
if (!_.isNonEmptyString(WEATHER_KEY)) {
    throw new Error('Must set WUNDERGROUND_KEY environment variable. ' +
    'Setup an account on http://www.wunderground.com/weather/api to get an API Key');
}
var WUNDERGROUND_URL = ['http://api.wunderground.com/api', WEATHER_KEY].join('/');

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

    if (!geo.city || !geo.region) {
        return callback(new Error('Need a city and region (state)'));
    }

    if (date) {
        return getHistorical(date, geo, callback);
    }
    return getCurrent(geo, callback);
};

/**
 * Get current weather data. See {@link weathermapRequest} for response structure
 * @param geo
 * @param callback
 * @return {Request}
 */
function getCurrent(geo, callback) {
    var path = _.compact([
        'conditions',
        'q',
        geo.country,
        geo.region,
        geo.city
    ]).join('/');
    var query = {};
    return wundergroundRequest([path, 'json'].join('.'), query, callback);
}

/**
 * Get's weather information for historical dates.
 *
 * **WARNING:** This appears to be unavailable. Price page claims 95-99% avail.
 *      Waiting on a response to my support message:
 *      https://openweathermap.desk.com/customer/portal/questions/11526780-no-data-returned-historical-
 *
 * @param date
 * @param geo
 * @param callback
 * @return {Request}
 */
function getHistorical(date, geo, callback) {
    var path = _.compact([
        'history_' + moment(date).format('YYYYMMDD'),
        'q',
        geo.country,
        geo.region,
        geo.city
    ]).join('/');
    var query = {};
    return wundergroundRequest([path, 'json'].join('.'), query, callback);
}

/**
 *
 * @param path
 * @param query
 * @param callback
 * @return {*}
 */
function wundergroundRequest(path, query, callback) {
    try {
        return fs.readFile([__dirname, 'wunderground', path].join('/'), 'utf8', function (err, storedData) {
            if (err) {
                throw err;
            }
            var weather = JSON.parse(storedData);

            return callback(null, weather.history.dailysummary[0]);
        });
    } catch (e) {
        util.log.warn({path: path, err: 'Problem getting stored data'}, e);
    }

    return callback(new Error('not implemented'));
}


/**
 * Call OpenWeatherMap's API for weather data
 *
 * @deprecated They don't support historical queries, so don't use this
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
    return callback(new Error('deprecated'));
    //util.log.info({Path: path, Query: query});
    //return superagent.get(WEATHERMAP_URL + path)
    //    .set({'x-api-key': WEATHER_KEY})
    //    .set('Accept', 'application/json')
    //    .query(query)
    //    .end(function (err, res) {
    //        util.log.debug({Err: err, Res: res, Body: res.body});
    //        return err ? callback(err) : callback(null, _.propertyOf(res)('body'));
    //    });
}
