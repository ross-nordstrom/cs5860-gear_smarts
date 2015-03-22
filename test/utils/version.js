/*global require, describe, it, before, beforeEach, after, afterEach */
"use strict";

var expect = require('expect.js');
var version = require('../../lib/utils/version');
var _ = require('../../lib/utils/main')._;

describe('utils/version', function () {
    it('should be able to get version', _.isTrueParam(process.env.NO_INTERNET) ? undefined : function (done) {
        version.json(function (err, versionInfo) {
            expect(err).to.not.be.ok();
            expect(versionInfo).to.be.an('object');
            expect(versionInfo.PackageVersion).to.be.a('string');
            expect(versionInfo.BuildVersion).to.be.a('string');
            //expect(versionInfo.DeployVersion).to.be.an('object');
            expect(versionInfo.PackageVersion).to.contain('.');
            // RDN 4-MAR-2015 - Skip this because it's brittle
            //expect(versionInfo.BuildVersion).to.contain(versionInfo.PackageVersion);
            return done();
        });
    });
    it('should be able to get the package version', function (done) {
        version.packageVersion(function (err, version) {
            expect(err).to.not.be.ok();
            expect(typeof version).to.be('string');
            expect(version).to.contain('.');
            return done();
        });
    });
    it('should be able to get the build version', function (done) {
        version.buildVersion(function (err, version) {
            expect(err).to.not.be.ok();
            expect(typeof version).to.be('string');
            expect(version).to.contain('.');
            expect(version).to.contain('-');
            expect(version).to.contain('v');
            return done();
        });
    });
    xit('should be able to get the deployed version', _.isTrueParam(process.env.NO_INTERNET) ? undefined : function (done) {
        expect(process.env.HEROKU_API_TOKEN).to.be.a('string');
        version.deployVersion(function (err, version) {
            expect(err).to.not.be.ok();
            expect(version).to.be.an('object');
            expect(version).to.have.property('version');
            expect(version).to.have.property('description');
            expect(version).to.have.property('created_at');
            expect(version).to.have.property('updated_at');
            return done();
        });
    });
    it('should gracefully handle problems getting deployed version', function (done) {
        var testCallback = function (err, deployedVersion) {
            expect(err).to.not.be.ok();
            expect(deployedVersion).to.eql(null);
            return done();
        };
        version.deployedVersionHandler(testCallback)(new Error('Fake Error, like Heroku failed'));
    });
    it('should gracefully handle bad responses getting deployed version', function (done) {
        var testCallback = function (err, deployedVersion) {
            expect(err).to.not.be.ok();
            expect(deployedVersion).to.eql(null);
        };
        [null, {}, undefined, '', 'foobar!',
            '{badJson: "handing string/jso...', {nonVersionProperty: 'v1.2.3'}
        ].forEach(function (badResponse) {
                version.deployedVersionHandler(testCallback)(null, badResponse);
            });
        return done();
    });
    it('should gracefully handle problems reading package.json', function (done) {
        var badJsons = [null, {}, undefined, '', 'foobar!',
            '{badJson: "handing string/jso...', {nonVersionProperty: 'v1.2.3'}
        ];
        badJsons.forEach(function (badJson) {
            expect(version.versionFromPackageJson(badJson)).to.eql(null);
        });
        return done();
    });
    it('should gracefully handle git problems', function (done) {
        var testCallback = function (err, gitVersion) {
            expect(err).to.not.be.ok();
            expect(gitVersion).to.eql(null);
            return done();
        };
        version.buildVersionHandler(testCallback)(new Error('Fake Error, like Git failed'));
    });
    it('should propagate errors from version-building problems', function (done) {
        var fakeError = new Error('Fake Error, like something failed');
        var testCallback = function (err, versionInfo) {
            expect(err).to.be.ok();
            expect(versionInfo).to.not.be.ok();
            expect(err).to.eql(fakeError);
            return done();
        };
        version.jsonHandler(testCallback)(fakeError);
    });
}); // describe('utils/version')
