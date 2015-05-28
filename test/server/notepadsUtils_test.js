'use strict';

var notepadsUtils = require('../../src/notepadsUtils'),
    assert = require('assert'),
    connection = require('../db_common'),
    User = require('../../src/models/user'),
    Category = require('../../src/models/category'),
    Notepad = require('../../src/models/notepad');

describe('notepadsUtils', function () {

    var db;

    before(function () {
        //TODO: use callback/promise:
        db = connection();
    });

    after(function (done) {
        User.removeAsync({})
            .then(function () {
                return Category.remove({});
            })
            .then(function () {
                return Notepad.remove({});
            })
            .then(function () {
                db.close();
            })
            .then(done);
    });

    it("should create a new 'Sample Category' and a new Notepad 'Read me' for a given user id", function (done) {
        var fbId = String(+new Date()),
            name = 'Iliyan Trifonov',
            photo = 'photourl';
        User.createAsync({
            facebookId: fbId,
            name: name,
            photo: photo
        }).then(function (user) {
            assert.strictEqual(user.facebookId, fbId);
            assert.strictEqual(user.name, name);
            assert.strictEqual(user.photo, photo);
            notepadsUtils.prepopulate(user._id, function (err, result) {
                assert.ifError(err);
                assert.deepEqual(result, {});
                //check if the category and notepad exist in db and their texts are as expected
                //...
            });
        }).then(done);
    });

    it('should return Error Invalid user id on missing uid param', function () {
        notepadsUtils.prepopulate(null, function (err) {
            assert.ok(err);
            assert.ok(err instanceof Error);
        });
    });

    it('should return Error on not existing user with the given uid', function (done) {
        notepadsUtils.prepopulate(+new Date(), function (err, user) {
            assert.ok(err);
            assert.ok(err instanceof Error);
            if (/0\.10/.test(process.version)) {
                assert.deepEqual(user, undefined);
            } else {
                assert.deepEqual(user, null);
            }
            done();
        });
    });

});
