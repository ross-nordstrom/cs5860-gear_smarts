/**
 * Part of Utils module
 * @module Utils/Version
 * @memberof Utils
 * @description Identify version of this package from a few important perspectives
 */

/*global process, require, exports */
"use strict";

var util = require('./main');
var _ = util._;
var async = require('async');
var pkg = require('../../package.json');
var git = require('git-rev');
var heroku_client = require('heroku-client');
var heroku, deployedApp;
if (process.env.HEROKU_API_TOKEN) {
    heroku = new heroku_client({
        token: process.env.HEROKU_API_TOKEN
    });
}
if (heroku && process.env.HEROKU_APP) {
    deployedApp = heroku.apps(process.env.HEROKU_APP);
}

/******************************************************************************
 * Main functions
 **/
/**
 * Get the current version of this codebase from package.json
 * @param callback
 * @returns {*}
 */
exports.packageVersion = packageVersion;
function packageVersion(callback) {
    var version = versionFromPackageJson(pkg);
    return callback(null, version);
}

/**
 * Get the current git version of this codebase
 * @param callback
 */
exports.buildVersion = buildVersion;
function buildVersion(callback) {
    async.parallel({
        gitTag: function (taskCb) {
            return git.tag(function (tag) {
                return taskCb(null, tag);
            });
        },
        gitShort: function (taskCb) {
            return git.short(function (shortCommit) {
                return taskCb(null, shortCommit);
            });
        }
    }, buildVersionHandler(callback)); // async.parallel
}

/**
 * Get the current deployed version of this API
 * @param callback
 * @returns {*}
 */
exports.deployVersion = deployVersion;
function deployVersion(callback) {
    if (!deployedApp) {
        util.log.debug('No deployed app found. Skipping');
        return callback(null, null);
    } else {
        deployedApp.releases().list(deployedVersionHandler(callback));
    }
}

exports.json = json;
function json(callback) {
    async.parallel({
        PackageVersion: packageVersion,
        BuildVersion: buildVersion,
        DeployVersion: deployVersion
    }, jsonHandler(callback)); // async.parallel
}

/******************************************************************************
 * Internal helper functions (mainly for testing)
 **/

function versionFromPackageJson(pkgJson) {
    var version = pkgJson && typeof pkgJson === 'object' ? pkgJson.version : null;
    return version || null;
}
function buildVersionHandler(callback) {
    return function (err, results) {
        if (err) {
            util.log.info('Error getting version from Git: ' + err.message);
        }
        var gitVersion = (!results || !results.gitTag || !results.gitShort) ?
            null : [results.gitTag, results.gitShort].join('-');
        return callback(null, gitVersion);
    };
}
function deployedVersionHandler(callback) {
    return function (err, releases) {
        if (err) {
            util.log.info({ProblemGettingDeployedVersion: err.message});
            util.log.trace(err);
            return callback(null, null);
        }
        if (!_.isArray(releases)) {
            util.log.debug({MalformedDeployedVersion: releases});
            return callback(null, null);
        }

        var sortedReleases = releases.sort(function (a, b) {
            return b.version - a.version;
        });
        var release = _.find(sortedReleases, function (rel) {
            return !_.isString(rel.description) ? false : rel.description.indexOf('Deploy') >= 0;
        });
        var version = _.pick(release, 'version', 'description', 'created_at', 'updated_at');
        return callback(null, version);
    };
}
function jsonHandler(callback) {
    return function (err, versionInfo) {
        if (err) {
            return callback(err);
        }
        util.log.trace('Version info: ' + JSON.stringify(versionInfo));
        return callback(null, versionInfo);
    };
}

// For testing
exports.versionFromPackageJson = versionFromPackageJson;
exports.buildVersionHandler = buildVersionHandler;
exports.deployedVersionHandler = deployedVersionHandler;
exports.jsonHandler = jsonHandler;
