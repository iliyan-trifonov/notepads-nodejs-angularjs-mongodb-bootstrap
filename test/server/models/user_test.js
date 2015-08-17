'use strict';

var assert = require('assert'),
    connection = require('../../db_common'),
    mongoose = require('mongoose'),
    Promise = require('bluebird');

import User from '../../../src/models/user';

describe('User model', function () {

    var db, testUser;

    before(function () {
        //TODO: use callback/promise
        db = connection();

        return User.create({
            facebookId: +new Date(),
            name: 'Iliyan Trifonov',
            photo: 'photourl',
            categories: [
                mongoose.Types.ObjectId(),
                mongoose.Types.ObjectId(),
                mongoose.Types.ObjectId()
            ],
            notepads: [
                mongoose.Types.ObjectId(),
                mongoose.Types.ObjectId()
            ]
        })
        .then(function (user) {
            assert.notStrictEqual(user, null);
            testUser = user;
        });
    });

    after(function () {
        return User.remove({})
            .then(function () {
                //TODO: try .then(db...bind(db)) instead:
                db.close();
            });
    });

    it('should create and save a new User object', function () {
        var user = {
            facebookId: +new Date(),
            name: 'Iliyan Trifonov ' +new Date().getTime(),
            photo: 'photourl'
        };
        return User.create(user).then(function (doc) {
            assert.notStrictEqual(doc, null);
            assert.strictEqual(doc.name, user.name);
            return doc;
        }).then(function (doc) {
            return User.findOneAndRemove({ _id: doc._id });
        });
    });

    describe('getByAccessToken', function () {
        it('should return a User object given existing accessToken', function () {
            return User.getByAccessToken(testUser.accessToken).then(function (doc) {
                assert.notStrictEqual(doc, null);
                assert.ok(doc._id.equals(testUser._id));
            });
        });

        it('should return a null given non-existent accessToken', function () {
            return User.getByAccessToken('0a9s7d0as97d0asd0as7d09').then(function (doc) {
                assert.strictEqual(doc, null);
            });
        });
    });

    describe('fb', function () {
        it('should return a User object with facebookId, accessToken, name and photo', function () {
            return User.fb(testUser.facebookId)
                .then(function (user) {
                    assert.notStrictEqual(user, null);
                    assert.ok(user._id.equals(testUser._id));
                    assert.strictEqual(user.facebookId, testUser.facebookId);
                    assert.strictEqual(user.accessToken, testUser.accessToken);
                    assert.strictEqual(user.name, testUser.name);
                    assert.strictEqual(user.photo, testUser.photo);
                });
        });
    });

    describe('getCategories', function () {
        it('should return a User object with an array of 0 or more Category ids', function () {
            return User.getCategories(testUser._id)
                .then(function (user) {
                    assert.notStrictEqual(user, null);
                    assert.strictEqual(user.categories.length, testUser.categories.length);
                });
        });
    });

    describe('getNotepads', function () {
        it('should return a User object with an array of 0 or more Notepad ids', function () {
            return User.getNotepads(testUser._id)
                .then(function (user) {
                    assert.notStrictEqual(user, null);
                    assert.strictEqual(user.notepads.length, testUser.notepads.length);
                });
        });
    });

    describe('addCategory', function () {
        it('should add one new Category id', function () {
            var catId = mongoose.Types.ObjectId();
            return User.addCategory(testUser._id, catId)
                .then(function (user) {
                    assert.notStrictEqual(user, null);
                    assert.notStrictEqual(user.categories.indexOf(catId), -1);

                    testUser = user;
                });
        });
    });

    describe('addNotepad', function () {
        it('should add one new Notepad id', function () {
            var notepadId = mongoose.Types.ObjectId();
            return User.addNotepad(testUser._id, notepadId)
                .then(function (user) {
                    assert.notStrictEqual(user, null);
                    assert.notStrictEqual(user.notepads.indexOf(notepadId), -1);

                    testUser = user;
                });
        });
    });

    describe('removeNotepad', function () {
        it('should remove an existing Notepad given notepad Id', function () {
            var nId = mongoose.Types.ObjectId();
            return User.addNotepad(testUser._id, nId)
                .then(function (user) {
                    assert.notStrictEqual(user, null);
                    assert.notStrictEqual(user.notepads.indexOf(nId), -1);
                }).then(function () {
                    return User.removeNotepad(
                        testUser._id,
                        nId
                    );
                }).then(function (user) {
                    assert.notStrictEqual(user, null);
                    assert.strictEqual(user.notepads.indexOf(nId), -1);
                });
        });
    });

    describe('removeNotepads', function () {
        it('should remove some existing Notepads given these notepads\'s Ids', function () {
            var nIds = [
                mongoose.Types.ObjectId(),
                mongoose.Types.ObjectId(),
                mongoose.Types.ObjectId()
            ];
            return Promise.map(nIds, function (id) {
                return User.addNotepad(testUser._id, id);
            }).then(function (users) {
                //get the last user result with all ids inserted
                var user = users[2];
                assert.notStrictEqual(user, null);
                assert.ok(nIds.every(function (id) {
                    return user.notepads.indexOf(id) !== -1;
                }));
            }).then(function () {
                return User.removeNotepads(
                    testUser._id,
                    nIds
                );
            }).then(function (user) {
                assert.notStrictEqual(user, null);
                assert.ok(nIds.every(function (id) {
                    return user.notepads.indexOf(id) === -1;
                }));
            });
        });
    });

});
