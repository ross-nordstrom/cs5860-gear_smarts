/**
 * @file api.js
 * @description Sets up the routes and server for the API
 */

/*global process, require, exports */
"use strict";

var server = require('./server');
var routes = require('./lib/routes/main');

//****************************
// Define and setup the routes.
//****************************
routes.setup();

//****************************
// Start the server
//****************************
server.start();
