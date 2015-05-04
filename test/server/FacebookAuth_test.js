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

});
