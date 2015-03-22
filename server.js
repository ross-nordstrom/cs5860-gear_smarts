/**
 * @file server.js
 * @description Sets up the Node.js server, handling static file serving for documentation, etc.
 */

/*global process, require, exports */
"use strict";

/****************************************
 * External Dependencies
 ***/
var express = require('express');      // call express
var bodyParser = require('body-parser');  // used for parsing data from requests
var errorHandler = require('errorhandler');  // used for handling errors
var http = require('http');
var https = require('https');
var async = require('async');
var chance = new (require('chance'))();
var url = require('url');

var util = require('./lib/utils/main');
var version = require('./lib/utils/version');
var _ = util._;

// Requires for doc hosting
var serveIndex = require('serve-index');
var serveStatic = require('serve-static');
var auth = require('http-auth');

var app = express();               // define our app using express
app.disable('x-powered-by');              // we don't want to advertise this

/****************************************
 * Globals
 ***/
var STACK_ENV = process.env.NODE_ENV || 'development';
var forceTimeout;


/********************************************************************************
 * Setup middleware
 ***/
    // Configure default ports if not defined
app.set('port', process.env.PORT || 8080);
app.set('sslport', process.env.SSL_PORT || 8081);

// Require authentication for all API calls, but disable it if requested.
if (_.isTrueParam(process.env.DISABLE_API_AUTHENTICATION)) {
    util.log.warn('*Disabling API Authentication due to environment config*');
}

// configure app to use bodyParser()
// this will let us get the data from a POST
app.use(bodyParser.urlencoded({extended: true}));
app.use(bodyParser.json());

// logging for requests as they come in.
app.use(reqlogger);

// Deprecated in Express 4!
// app.use(app.router);

/********************************************************************************
 * Setup for Production
 ***/
if (STACK_ENV === 'production') {
    util.log.info('Using config: production');

    /** If we are in production, force https */
    app.all('*', function (req, res, next) {
        if (req.headers['x-forwarded-proto'] !== 'https') {
            var pathname = url.parse(req.url).pathname;
            var httpsPath = 'https://' + req.headers.host + pathname;

            util.log.info('HTTP access attempted. Redirecting to HTTPS');
            return res.redirect(httpsPath);
        }
        else {
            return next(); // Continue to other routes if we're not redirecting
        }
    });
}


/********************************************************************************
 * Setup for Development
 ***/
if (STACK_ENV === 'development') {
    util.log.info('Using config: development');
    app.use(errorHandler());
}

/********************************************************************************
 * Setup documentation, coverage, and complexity with basic auth
 ***/
// Basic authentication
var basic = auth.basic({realm: "Developer Content"}, function (username, password, callback) {
        return callback(
            (STACK_ENV !== 'production' && _.isEmpty(process.env.AUTH_USERNAME)) ||   // Allow no auth locally
            (username === process.env.AUTH_USERNAME && password === process.env.AUTH_PASSWORD)
        );
    }
);

var authMiddleware = auth.connect(basic);

/**
 * Route: "/docs"
 * Username: ENV['AUTH_USERNAME']
 * Password: ENV['AUTH_PASSWORD']
 */
// Serve /secretplace as a directory listing
app.use('/developer/docs', authMiddleware, serveIndex(__dirname + '/doc/gear-smarts'));

// Serve content under /docs/latest as files
app.use('/developer/docs', serveStatic(__dirname + '/doc/gear-smarts', {'index': false}));
version.packageVersion(function (err, vrsn) {
    if (err) {
        util.log.error({DocSetupError: err});
        return;
    }
    var latestDocs = '/developer/docs/' + vrsn + '/index.html';
    util.log.info({LatestDocsUrl: latestDocs});
    app.get('/', function (req, res) {
        res.redirect(latestDocs);
    });
    app.get('/docs', function (req, res) {
        res.redirect(latestDocs);
    });
});


/**
 * Route: "/coverage"
 * Username: ENV['AUTH_USERNAME']
 * Password: ENV['AUTH_PASSWORD']
 */
// Serve as a directory listing
app.use('/developer/coverage', authMiddleware, serveIndex(__dirname + '/coverage/lcov-report'));
app.use('/developer/coverage', serveStatic(__dirname + '/coverage/lcov-report', {'index': false}));
app.get('/coverage', function (req, res) {
    return res.redirect('/developer/coverage/index.html');
});

/**
 * Route: "/complexity"
 * Username: ENV['AUTH_USERNAME']
 * Password: ENV['AUTH_PASSWORD']
 */
// Serve as a directory listing
app.use('/developer/complexity', authMiddleware, serveIndex(__dirname + '/plato'));
app.use('/developer/complexity', serveStatic(__dirname + '/plato', {'index': false}));
app.get('/complexity', function (req, res) {
    return res.redirect('/developer/complexity/index.html');
});

/**
 * @todo Serve up /app folder here for AngularJS UI
 */
// ...

/**
 * Log all requests
 * @param req
 * @param res
 * @param next
 */
function reqlogger(req, res, next) {
    // generate a random ID to associate with this request. Makes referencing logs easier.
    var reqId = chance.string({pool: 'abcdefghijklmnopqrstuvwxyz0123456789', length: 6});

    // scrub the login info out until past the log
    var loginValue = null;
    if (req.body && req.url.indexOf('\/login') !== -1) {
        // scrub the password out here
        loginValue = req.body.value;
        req.body.value = '**scrubbed**';
    }

    // check if it is password JSON. from user create, or user update.
    var userPassword = null;
    if (req.body && req.body.user !== undefined && req.body.user.password !== undefined && req.body.user.password !== null) {
        userPassword = req.body.user.password;
        req.body.user.password = '**scrubbed**';
    }

    util.log.info({RequestMethod: req.method, RequestUrl: req.url, RequestBodyKeys: _.keys(req.body)});
    util.log.trace({Body: req.body});

    // set things back that got scrubbed.
    if (loginValue) {
        req.body.value = loginValue;      // set it back
    }
    if (userPassword) {
        req.body.user.password = userPassword;
    }

    req.id = reqId; // store the id so other methods can get at it for logging.
    next(); // Passing the request to the next handler in the stack.
}

/**
 * Start up the API
 */
function start() {
    var reqsPerSecondInterval;

    // setup HTTP listener
    // Heroku requires there to be a response to PORT.  We forward http to https.
    // Look in routes.js for forwarding to https
    var http_server = http.createServer(app).listen(app.get('port'), function () {
        util.log.info("Express HTTP server listening on port " + app.get('port'));
        util.log.info("HTTP server using maxSockets:" + http.globalAgent.maxSockets);
    });

    // flags to tell which one closed first.
    var httpClosed = false;
    var httpsClosed = false;

    process.on('SIGTERM', function () {

        // remove this timer so it doesnt hold up the node process.
        clearInterval(reqsPerSecondInterval);

        // heroku needs it to respond to SIGTERM within 10 seconds.
        // so force after 9, to make sure nothing is hanging.
        forceTimeout = setTimeout(function () {
            util.log.warn('Forcing close after 8 seconds');
            process.exit(1);
        }, 8000);

        // by waiting for 5 seconds, we give open connections time to finish.
        util.log.info('Closing due to SIGTERM...will wait for 5 seconds.');
        util.log.info('shutting down HTTP servers and database conn  ections.');
        http_server.close(function () {
            util.log.info('HTTP server closed callback');
        });
    });


    http_server.on('close', function () {
        if (!httpsClosed) {
            util.log.info('HTTP server closed: waiting for HTTPS server');
            httpClosed = true;
        } else {
            util.log.info('HTTPS server closed.');
        }
    });
}

exports.start = start;
exports.app = app;
//exports.apiAuth = apiAuth; // to be used on a per-route basis.
