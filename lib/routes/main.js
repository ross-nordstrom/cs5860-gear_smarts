/**
 * Main routes file
 * @namespace Routes
 * @module Routes
 * @description Wire up all the routes for the API
 */

/* global exports, process, require */
"use strict";

var async = require('async');
var url = require('url');
var util = require('../utils/main');
var version = require('../utils/version');
var server = require('../../server');
var app = server.app;
var v1 = require('./v1/main.js');

/**
 * Wire up all child routes and do some production-specific setup, like enforcing HTTPS.
 */
function setup() {

    if (process.env.NODE_ENV === 'production') {
        // if we are in production, force https
        app.all('*', function (req, res, next) {
            if (req.headers['x-forwarded-proto'] === 'https') {
                next(); // Continue to other routes if we're not redirecting
            } else {
                var pathname = url.parse(req.url).pathname;
                var httpsPath = 'https://' + req.headers.host + pathname;

                res.redirect(httpsPath);
            }
        });
    }

    // Returns the build version of the API.
    // This route doesn't require an API key.
    app.get('/version', function (req, res) {
        version.json(function (err, versionInfo) {
            if (err) {
                res.send('N/A');
            }
            else {
                util.log.debug('Version info: ' + JSON.stringify(versionInfo), req.id);
                res.send(versionInfo);
            }
        });
    });

    // This is where all the routes are specified in our RESTful API
    v1.route(app);      //current
    // v2.route();   // doesn't exist yet
}

exports.setup = setup;
