'use strict';

var User = require('../../../src/models/user'),
    assert = require('assert'),
    connection = require('../../db_common'),
    mongoose = require('mongoose'),
    Promise = require('bluebird');

describe('User model', function () {

    var db, testUser;

    before(function (done) {
        //TODO: use callback/promise
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
                mongoose.Types.ObjectId()
            ];

            return user.saveAsync().then(function (params) {
                assert.notStrictEqual(params[0], null);
                assert.strictEqual(params[1], 1);
                testUser = params[0];
            });
        }).then(done);
    });

    after(function (done) {
        User.removeAsync({})
            //TODO: try .then(db...bind(db)) instead:
            .then(function () {
                db.close();
            })
            .then(done);
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
        }).then(function () {
            return User.findOneAndRemoveAsync({ _id: user._id });
        }).then(done);
    });

    describe('getByAccessToken', function () {
        it('should return a User object given existing accessToken', function (done) {
            console.info('it() testUser', testUser);
            User.getByAccessToken(testUser.accessToken).then(function (doc) {
                assert.notStrictEqual(doc, null);
                assert.ok(doc._id.equals(testUser._id));
                done();
            });
        });

        it('should return a null given non-existent accessToken', function (done) {
            User.getByAccessToken('0a9s7d0as97d0asd0as7d09').then(function (doc) {
                assert.strictEqual(doc, null);
            })
            .then(done);
        });
    });

    describe('fb', function () {
        it('should return a User object with facebookId, accessToken, name and photo', function (done) {
            User.fb(testUser.facebookId)
                .then(function (user) {
                    assert.notStrictEqual(user, null);
                    assert.ok(user._id.equals(testUser._id));
                    assert.strictEqual(user.facebookId, testUser.facebookId);
                    assert.strictEqual(user.accessToken, testUser.accessToken);
                    assert.strictEqual(user.name, testUser.name);
                    assert.strictEqual(user.photo, testUser.photo);
                })
                .then(done);
        });
    });

    describe('getCategories', function () {
        it('should return a User object with an array of 0 or more Category ids', function (done) {
            User.getCategories(testUser._id)
                .then(function (user) {
                    assert.notStrictEqual(user, null);
                    assert.strictEqual(user.categories.length, testUser.categories.length);
                }).then(done);
        });
    });

    describe('getNotepads', function () {
        it('should return a User object with an array of 0 or more Notepad ids', function (done) {
            User.getNotepads(testUser._id)
                .then(function (user) {
                    assert.notStrictEqual(user, null);
                    assert.strictEqual(user.notepads.length, testUser.notepads.length);
                })
                .then(done);
        });
    });

    describe('addCategory', function () {
        it('should add one new Category id', function (done) {
            var catId = mongoose.Types.ObjectId();
            User.addCategory(testUser._id, catId)
                .then(function (user) {
                    assert.notStrictEqual(user, null);
                    assert.notStrictEqual(user.categories.indexOf(catId), -1);

                    testUser = user;
                })
                .then(done);
        });
    });

    describe('addNotepad', function () {
        it('should add one new Notepad id', function (done) {
            var notepadId = mongoose.Types.ObjectId();
            User.addNotepad(testUser._id, notepadId)
                .then(function (user) {
                    assert.notStrictEqual(user, null);
                    assert.notStrictEqual(user.notepads.indexOf(notepadId), -1);

                    testUser = user;
                })
                .then(done);
        });
    });

    describe('removeNotepad', function () {
        it('should remove an existing Notepad given notepad Id', function (done) {
            var nId = mongoose.Types.ObjectId();
            User.addNotepad(testUser._id, nId)
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
                })
                .then(done);
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
                return User.addNotepad(testUser._id, id);
            }).then(function (users) {
                //get the last user result with all ids inserted
                var user = users[2];
                console.info('user', user);
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
            }).then(done);
        });
    });

});
