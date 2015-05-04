'use strict';

var assert = require('assert'),
    connection = require('../db_common'),
    FacebookAuth = require('../../src/FacebookAuth'),
    User = require('../../src/models/user'),
    Category = require('../../src/models/category'),
    Notepad = require('../../src/models/notepad');

describe('FacebookAuth', function () {

    var db;

    before(function () {
        db = connection();
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
                assert.ok(user !== null);
                FacebookAuth.authVerification(null, null, { id: user.facebookId }, function (err, result) {
                    assert.ifError(err);
                    assert(result !== null);
                    assert.ok(result.equals(user));
                    done();
                });
            });
        });

        it('should create a new user for not existing uid', function (done) {
            var fbProfile = {
                id: +new Date(),
                displayName: 'Iliyan Trifonov',
                photos: [{ value:'' }]
            };
            FacebookAuth.authVerification(null, null, fbProfile, function (err, result) {
                assert.ifError(err);
                assert(result !== null);
                assert.equal(result.facebookId, fbProfile.id);
                assert.equal(result.name, fbProfile.displayName);
                assert.equal(result.photo, fbProfile.photos[0].value);
                done();
            });
        });
    });

});
