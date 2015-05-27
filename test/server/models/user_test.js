'use strict';

var User = require('../../../src/models/user'),
    assert = require('assert'),
    connection = require('../../db_common'),
    mongoose = require('mongoose'),
    Promise = require('bluebird');

describe('User model', function () {

    var db, testUser;

    before(function (done) {
        db = connection();
        User.createAsync({
            facebookId: +new Date(),
            name: 'Iliyan Trifonov',
            photo: 'photourl'
        }).then(function (user) {
            assert.notStrictEqual(user, null);

            user.categories = [
                mongoose.Types.ObjectId(),
                mongoose.Types.ObjectId(),
                mongoose.Types.ObjectId()
            ];
            user.notepads = [
                mongoose.Types.ObjectId(),
                mongoose.Types.ObjectId(),
            ];

            user.save(function (err, user) {
                assert.ifError(err);
                assert.notStrictEqual(user, null);
                testUser = user;
                done();
            });

        }).catch(function (err) {
            assert.ifError(err);
        });
    });

    after(function (done) {
        User.removeAsync({}).then(function () {
            db.close();
            done();
        });
    });

    it('should create and save a new User object', function (done) {
        var user = {
            facebookId: +new Date(),
            name: 'Iliyan Trifonov ' +new Date().getTime(),
            photo: 'photourl'
        };
        User.createAsync(user).then(function (doc) {
            assert.notStrictEqual(doc, null);
            assert.strictEqual(doc.name, user.name);
            done();
        });
    });

    describe('getByAccessToken', function () {
        it('should return a User object given existing accessToken', function (done) {
            User.getByAccessTokenAsync(testUser.accessToken).then(function (doc) {
                assert.notStrictEqual(doc, null);

                assert.ok(doc._id.equals(testUser._id));

                done();
            });
        });

        it('should return a null given non-existent accessToken', function (done) {
            User.getByAccessTokenAsync('0a9s7d0as97d0asd0as7d09').then(function (doc) {
                assert.strictEqual(doc, null);

                done();
            });
        });
    });

    describe('fb', function () {
        it('should return a User object with facebookId, accessToken, name and photo', function (done) {
            User.fbAsync(testUser.facebookId).then(function (user) {
                assert.notStrictEqual(user, null);

                assert.ok(user._id.equals(testUser._id));
                assert.strictEqual(user.facebookId, testUser.facebookId);
                assert.strictEqual(user.accessToken, testUser.accessToken);
                assert.strictEqual(user.name, testUser.name);
                assert.strictEqual(user.photo, testUser.photo);

                done();
            });
        });
    });

    describe('getCategories', function () {
        it('should return a User object with an array of 0 or more Category ids', function (done) {
            User.getCategoriesAsync(testUser._id).then(function (user) {
                assert.notStrictEqual(user, null);
                assert.strictEqual(user.categories.length, testUser.categories.length);
                done();
            });
        });
    });

    describe('getNotepads', function () {
        it('should return a User object with an array of 0 or more Notepad ids', function (done) {
            User.getNotepadsAsync(testUser._id).then(function (user) {
                assert.notStrictEqual(user, null);
                assert.strictEqual(user.notepads.length, testUser.notepads.length);

                done();
            });
        });
    });

    describe('addCategory', function () {
        it('should add one new Category id', function (done) {
            var catId = mongoose.Types.ObjectId();
            User.addCategoryAsync(testUser._id, catId).then(function (user) {
                assert.notStrictEqual(user, null);
                assert.notStrictEqual(user.categories.indexOf(catId), -1);

                testUser = user;

                done();
            });
        });
    });

    describe('addNotepad', function () {
        it('should add one new Notepad id', function (done) {
            var notepadId = mongoose.Types.ObjectId();
            User.addNotepadAsync(testUser._id, notepadId).then(function (user) {
                assert.notStrictEqual(user, null);
                assert.notStrictEqual(user.notepads.indexOf(notepadId), -1);

                testUser = user;

                done();
            });
        });
    });

    describe('removeNotepad', function () {
        it('should remove an existing Notepad given notepad Id', function (done) {
            var nId = mongoose.Types.ObjectId();
            User.addNotepadAsync(
                testUser._id,
                nId
            ).then(function (user) {
                assert.notStrictEqual(user, null);
                assert.notStrictEqual(user.notepads.indexOf(nId), -1);
            }).then(function () {
                return User.removeNotepadAsync(
                    testUser._id,
                    nId
                );
            }).then(function (user) {
                assert.notStrictEqual(user, null);
                assert.strictEqual(user.notepads.indexOf(nId), -1);

                done();
            });
        });
    });

    describe('removeNotepads', function () {
        it('should remove 0 or more existing Notepads given notepad Ids', function (done) {
            var nIds = [
                mongoose.Types.ObjectId(),
                mongoose.Types.ObjectId(),
                mongoose.Types.ObjectId()
            ];
            Promise.map(nIds, function (id) {
                return User.addNotepadAsync(testUser._id, id);
            }).then(function (users) {
                //get the last user result with all ids inserted
                var user = users[2];
                console.info('user', user);
                assert.notStrictEqual(user, null);
                assert.ok(nIds.every(function (id) {
                    return user.notepads.indexOf(id) !== -1;
                }));
            }).then(function () {
                return User.removeNotepadsAsync(
                    testUser._id,
                    nIds
                );
            }).then(function (user) {
                assert.notStrictEqual(user, null);
                assert.ok(nIds.every(function (id) {
                    return user.notepads.indexOf(id) === -1;
                }));

                done();
            });
        });
    });

});
