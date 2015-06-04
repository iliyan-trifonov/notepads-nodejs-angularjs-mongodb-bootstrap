'use strict';

var notepadsUtils = require('../../src/notepadsUtils'),
    assert = require('assert'),
    connection = require('../db_common'),
    mongoose = require('mongoose'),
    User = require('../../src/models/user'),
    Category = require('../../src/models/category'),
    Notepad = require('../../src/models/notepad');

describe('notepadsUtils', function () {

    var db, user;

    before(function () {
        //TODO: use callback/promise:
        db = connection();

        var fbId = String(+new Date()), //convert to string for the comparison below
            name = 'Iliyan Trifonov',
            photo = 'photourl';
        return User.createAsync({
            facebookId: fbId,
            name: name,
            photo: photo
        }).then(function (doc) {
            assert.strictEqual(doc.facebookId, fbId);
            assert.strictEqual(doc.name, name);
            assert.strictEqual(doc.photo, photo);
            user = doc;
        });
    });

    after(function () {
        return User.removeAsync({})
            .then(function () {
                return Category.remove({});
            })
            .then(function () {
                return Notepad.remove({});
            })
            .then(function () {
                db.close();
            });
    });

    it("should create a new 'Sample Category' and a new Notepad 'Read me' for a given user id", function () {
        return notepadsUtils.prepopulate(user._id)
            .then(function (result) {
                assert.ok(result.user);
                assert.ok(result.category);
                assert.ok(result.notepad);
                //TODO: check if the category and notepad exist in db and their props/texts are as expected
            });
    });

    it('should return Error Invalid user id on missing uid param', function () {
        return notepadsUtils.prepopulate(null).catch(function (err) {
            assert.ok(err);
            assert.strictEqual(err.message, 'Invalid user id!');
        });
    });

    it('should return Error on not existing user with the given uid', function () {
        return notepadsUtils.prepopulate(mongoose.Types.ObjectId(+new Date()))
            .catch(function (err) {
                assert.strictEqual(err.message, 'User not found!');
            });
    });

});
