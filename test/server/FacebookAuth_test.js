'use strict';

var assert = require('assert'),
    connection = require('../db_common'),
    User = require('../../src/models/user'),
    Category = require('../../src/models/category'),
    Notepad = require('../../src/models/notepad'),
    proxyquire = require('proxyquire'),
    mongoose = require('mongoose'),
    FacebookAuth;

describe('FacebookAuth', function () {

    var db, notepadsUtilsMock;

    before(function () {
        db = connection();
        notepadsUtilsMock = {
            prepopulate: function (uid, cb) {
                assert.ok(uid);
                assert.ok('function' === typeof cb);
                //assert.ok(uid instanceof mongoose.Schema.ObjectId);
                cb(null, {});
            }
        };
        FacebookAuth = proxyquire('../../src/FacebookAuth', { './notepadsUtils': notepadsUtilsMock });
    });

    after(function (done) {
        User.remove({}, function () {
            Category.remove({}, function () {
                Notepad.remove({}, function () {
                    db.close();
                    done();
                });
            });
        });
    });

    describe('authVerification', function () {
        it('should return an existing user when existing uid is given', function (done) {
            User.create({ facebookId: +new Date() }, function (err, user) {
                assert.ifError(err);
                assert.notStrictEqual(user, null);
                FacebookAuth.authVerification(null, null, { id: user.facebookId }, function (err, result) {
                    assert.ifError(err);
                    assert.notStrictEqual(result, null);
                    assert.ok(result.equals(user));
                    done();
                });
            });
        });

        it('should create a new user for not existing uid', function (done) {
            var fbProfile = {
                id: String(+new Date()),
                displayName: 'Iliyan Trifonov',
                photos: [{ value:'' }]
            };
            FacebookAuth.authVerification(null, null, fbProfile, function (err, result) {
                assert.ifError(err);
                assert.notStrictEqual(result, null);
                assert.strictEqual(result.facebookId, fbProfile.id);
                assert.strictEqual(result.name, fbProfile.displayName);
                assert.strictEqual(result.photo, fbProfile.photos[0].value);
                done();
            });
        });
    });

    describe('authSerialize', function () {
        it('should call the callback function with no error and facebookId', function () {
            var user = { facebookId: +new Date() };
            FacebookAuth.authSerialize(user, function (err, fbID) {
                assert.deepEqual(err, null);
                assert.deepEqual(fbID, user.facebookId);
            });
        });
    });

    describe('authDeserialize', function () {
        it('should return a user from a given facebookId', function (done) {
            User.create({ facebookId: +new Date() }, function (err, user) {
                assert.ifError(err);
                assert.ok(user);
                FacebookAuth.authDeserialize(user.facebookId, function (err, doc) {
                    assert.ifError(err);
                    assert.deepEqual(doc.facebookId, user.facebookId);
                    done();
                });
            });
        });
    });

    describe('login', function () {
        it('should redirect to /', function () {
            var res = {
                redirect: function (path) {
                    assert.deepEqual(path, '/');
                }
            };

            FacebookAuth.login({}, res);
        });
    });

    describe('logout', function () {
        it('should call req.logout() and redirect to /', function () {
            var logoutCalled = false;
            var req = {
                logout: function () {
                    logoutCalled = true;
                }
            };
            //TODO: refactor this repeating code block
            var res = {
                redirect: function (path) {
                    assert.ok(logoutCalled);
                    assert.deepEqual(path, '/');
                }
            };
            FacebookAuth.logout(req, res);
        });
    });

    describe('verifyAuth', function () {
        it('should call next() if user is authenticated', function (done) {
            var req = {
                isAuthenticated: function () {
                    return true;
                }
            };
            FacebookAuth.verifyAuth(req, {}, function () {
                done();
            });
        });

        it('should redirect to / if not authenticated', function () {
            //TODO: refactor this code repetition by giving only the return result: true/false:
            var req = {
                isAuthenticated: function () {
                    return false;
                }
            };
            //TODO: refactor to avoid repetion, func redirect() given on every test:
            var res = {
                redirect: function (path) {
                    assert.deepEqual(path, '/');
                }
            };
            FacebookAuth.verifyAuth(req, res);
        });
    });

    describe('setAppConfig', function () {
        it('should assign the given cnf to config', function () {
            var config = { "testvar1": 1, "testvar2": 2 };
            FacebookAuth.setAppConfig(config);
            assert.deepEqual(FacebookAuth.getAppConfig(), config);
        });
    });

});