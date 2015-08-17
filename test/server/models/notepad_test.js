'use strict';

var connection = require('../../db_common'),
    Notepad = require('../../../src/models/notepad'),
    Category = require('../../../src/models/category'),
    assert = require('assert');

import User from '../../../src/models/user';

describe('Notepad Model', function () {

    var db, notepads = [], cat, user, notepadsNum = 10;

    var createNotepad = function (done) {
        var unique = +new Date();
        Notepad.create({
            title: 'Test title ' + unique,
            text: 'Test text ' + unique,
            category: cat._id,
            user: user._id
        }, function (err, notepad) {
            return done(err, notepad);
        });
    };

    before(function (done) {
        //TODO: use callback
        db = connection();
        User.create({
            facebookId: +new Date(),
            name: 'Iliyan Trifonov',
            photo: 'photourl'
        }, function (err, doc) {
            assert.ifError(err);
            assert.ok(doc !== null);

            user = doc;

            Category.create({ name: 'Test cat', user: user._id }, function (err, doc) {
                assert.ifError(err);
                assert.ok(doc !== null);

                cat = doc;

                var addNotepadToArray = function (err, notepad) {
                    assert.ifError(err);
                    notepads.push(notepad);
                    if (notepads.length === notepadsNum) {
                        return done();
                    }
                };
                //create multiple Notepads in parallel
                for (var i = 0; i < notepadsNum; i++) {
                    createNotepad(addNotepadToArray);
                }
            });
        });
    });

    after(function () {
        db.close();
    });

    it('should create and save a new Notepad', function () {
        var notepad = {
            title: 'Test notepad',
            text: 'Test text',
            category: cat,
            user: user
        };
        return Notepad.create(notepad).then(function (doc) {
            assert.ok(doc !== null);
            assert.strictEqual(doc.title, notepad.title);
            assert.strictEqual(doc.text, notepad.text);
            notepadsNum++;
        });
    });

    describe('getByIdForUser', function () {
        it('should return a Notepad with title, text and category by given notepadId and uid', function () {
            var n = notepads[0];
            return Notepad.getByIdForUser(n._id, user._id).then(function (notepad) {
                assert.ok(notepad !== null);
                assert.ok(notepad._id.equals(n._id));
                assert.strictEqual(notepad.title, n.title);
                assert.strictEqual(notepad.text, n.text);
                assert.ok(notepad.category.equals(n.category));
            });
        });
    });

    describe('getByUserId', function () {
        it('should return a collection of Notepad objects given uid', function () {
            return Notepad.getByUserId(user._id).then(function (docs) {
                assert.ok(docs !== null);
                assert.strictEqual(docs.length, notepadsNum);
            });
        });
    });

    describe('updateForUserId', function () {
        it('should return an updated Notepad object', function () {
            var data =                 {
                title: 'ttt',
                text: 'txt',
                category: cat._id
            };
            return Notepad.updateForUserId(
                notepads[0]._id,
                user._id,
                data
            ).then(function (notepad) {
                assert.ok(notepad);
                assert.notDeepEqual(notepad, {});
                assert.strictEqual(notepad.title, data.title);
                assert.strictEqual(notepad.text, data.text);
                assert.ok(notepad.category.equals(data.category));
            });
        });
    });
});
