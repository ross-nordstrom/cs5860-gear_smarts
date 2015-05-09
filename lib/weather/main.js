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
var mkdirp = require("mkdirp");
var async = require('async');

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
    return wundergroundRequest([path, 'json'].join('.'), query, _.property('current_observation'), callback);
}

/**
 * Get's weather information for historical dates.
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
    /*
     * Response will come back like:
     *
     * {
     *   "response":{"version":"0.1","termsofService":"http://www.wunderground.com/weather/api/d/terms.html",".":"..."},
     *   "history": {
     *     "date": { "pretty":"February 22, 2015","year":"2015","mon":"02","mday":"22","...":"..." },
     *     "utcdate": { "pretty":"February 22, 2015","year":"2015","mon":"02","mday":"22","...":"..." },
     *     "observations":[
     *       {
     *         "date":{"pretty":"...","...":"..."},"utcdate":{"...":"..."},
     *         "tempm":"-11.0","tempi":"12.2","dewptm":"-15.0","dewpti":"5.0","hum":"73","wspdm":"20.4","wspdi":"12.7",
     *         "wgustm":"-9999.0","wgusti":"-9999.0","wdird":"190","wdire":"South","vism":"2.0","visi":"1.2",
     *         "pressurem":"1011.7","pressurei":"29.88","windchillm":"-19.2","windchilli":"-2.5","heatindexm":"-9999",
     *         "heatindexi":"-9999","precipm":"-9999.00","precipi":"-9999.00","conds":"Light Snow","icon":"snow",
     *         "fog":"0","rain":"0","snow":"1","hail":"0","thunder":"0","tornado":"0","metar":"METAR ..."
     *       },
     *       // ... repeated for every 10-30 minutes of the day ...
     *     ],
     *     "dailysummary": [ // Array of length 1 (always 1 as far as I can tell)
     *       {
     *         // Don't care about date
     *         "date":{
     *           "pretty":"12:00 PM MST on February 22, 2015","year":"2015","mon":"02","mday":"22",
     *           "hour":"12","min":"00","tzname":"America/Denver"
     *         },
     *         "fog":"0","rain":"0","snow":"1","snowfallm":"0.00","snowfalli":"0.00","monthtodatesnowfallm":"",
     *         "monthtodatesnowfalli":"","since1julsnowfallm":"","since1julsnowfalli":"","snowdepthm":"",
     *         "snowdepthi":"","hail":"0","thunder":"0","tornado":"0","meantempm":"-10","meantempi":"14",
     *         "meandewptm":"-14","meandewpti":"6","meanpressurem":"1011","meanpressurei":"29.86","meanwindspdm":"14",
     *         "meanwindspdi":"9","meanwdire":"","meanwdird":"186","meanvism":"5","meanvisi":"3","humidity":"",
     *         "maxtempm":"-7","maxtempi":"19","mintempm":"-13","mintempi":"8","maxhumidity":"79","minhumidity":"67",
     *         "maxdewptm":"-11","maxdewpti":"12","mindewptm":"-18","mindewpti":"0","maxpressurem":"1013",
     *         "maxpressurei":"29.92","minpressurem":"1009","minpressurei":"29.81","maxwspdm":"32","maxwspdi":"20",
     *         "minwspdm":"0","minwspdi":"0","maxvism":"16","maxvisi":"10","minvism":"0","minvisi":"0",
     *         "gdegreedays":"0","heatingdegreedays":"52","coolingdegreedays":"0","precipm":"0.00","precipi":"0.00",
     *         "precipsource":"","heatingdegreedaysnormal":"","monthtodateheatingdegreedays":"",
     *         "monthtodateheatingdegreedaysnormal":"","since1sepheatingdegreedays":"",
     *         "since1sepheatingdegreedaysnormal":"","since1julheatingdegreedays":"",
     *         "since1julheatingdegreedaysnormal":"","coolingdegreedaysnormal":"","monthtodatecoolingdegreedays":"",
     *         "monthtodatecoolingdegreedaysnormal":"","since1sepcoolingdegreedays":"",
     *         "since1sepcoolingdegreedaysnormal":"","since1jancoolingdegreedays":"",
     *         "since1jancoolingdegreedaysnormal":""
     *       }
     *     ]
     *   } // end of "history"
     * } // end of response
     */
    var getter = _.compose( // Compose operates last-to-first (right-to-left)
        _.partial(_.omit, _/*dailysummary*/, 'date'), // Remove the date property b/c I don't want it
        _.nestedProperty('history', 'dailysummary', 0)
    );
    return wundergroundRequest([path, 'json'].join('.'), query, getter, callback);
}

/**
 *
 * @param path
 * @param query
 * @param {function} getter - Function to get the useful data off the request
 * @param callback
 * @return {*}
 */
function wundergroundRequest(path, query, getter, callback) {
    try {
        var filename = [__dirname, 'wunderground', path].join('/');
        return fs.readFile(filename, 'utf8', function (err, storedData) {
            if (err) {
                if (err.code !== "ENOENT") {
                    throw err;
                } else {
                    // File doesn't exist aka we've never made this query
                    var url = [WUNDERGROUND_URL, path].join('/');
                    util.log.info({url: url});
                    return superagent.get(url)
                        .set('Accept', 'application/json')
                        .query(query)
                        .end(function (err, res) {
                            util.log.debug({Err: err, Res: res, Body: res.body});
                            if (err) {
                                return callback(err);
                            }

                            var body = _.property('body')(res);
                            var content = getter(body);

                            if (!content) {
                                throw new Error("No content!");
                            }

                            // Store the result on the filesystem
                            // Deliberately let Node.js fall through so this happens "in the background"
                            async.series([
                                function (taskCb) {
                                    var filepath = filename.split('/').slice(0, -1).join('/');
                                    return mkdirp(filepath, taskCb);
                                },
                                function (taskCb) {
                                    return fs.writeFile(filename, JSON.stringify(content), taskCb);
                                }
                            ], function (err) {
                                if (err) {
                                    util.log.warn({
                                        err: err,
                                        msg: 'Problem storing weather result!',
                                        content: content,
                                        filename: filename
                                    });
                                } else {
                                    util.log.debug({msg: 'Stored file', filename: filename});
                                }
                            });

                            // Return the content, even though we're not done storing it. That will eventually happen
                            return callback(null, content);
                        });
                }
            }
            var weather = JSON.parse(storedData);

            return callback(null, weather.history.dailysummary[0]);
        });
    } catch (e) {
        util.log.warn({path: path, err: 'Problem getting stored data'}, e);
        return callback(new Error('Problem getting weather data'));
    }

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
    return callback(new Error('no longer available'));
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
