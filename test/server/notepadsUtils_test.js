'use strict';

var notepadsUtils = require('../../src/notepadsUtils'),
    assert = require('assert'),
    connection = require('../db_common'),
    User = require('../../src/models/user');

describe('notepadsUtils', function () {

    var db;

    before(function () {
        db = connection();
    });

    after(function () {
        db.close();
    });

    it("should create a new 'Sample Category' and a new Notepad 'Read me' for a given user id", function (done) {
        var fbId = +new Date(),
            name = 'Iliyan Trifonov',
            photo = 'photourl';
        User.create({
            facebookId: fbId,
            name: name,
            photo: photo
        }, function (err, user) {
            assert.ifError(err);
            assert.equal(user.facebookId, fbId);
            assert.equal(user.name, name);
            assert.equal(user.photo, photo);
            notepadsUtils.prepopulate(user._id, function (err, result) {
                assert.ifError(err);
                assert.deepEqual(result, {});
                //check if the category and notepad exist in db and their texts
                //...
                done();
            });
        });
    });

});
