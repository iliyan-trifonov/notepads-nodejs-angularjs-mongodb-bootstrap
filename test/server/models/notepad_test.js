'use strict';

var connection = require('../../db_common'),
    Notepad = require('../../../src/models/notepad'),
    Category = require('../../../src/models/category'),
    User = require('../../../src/models/user'),
    assert = require('assert');

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
        User.create({name: 'Iliyan Trifonov'}, function (err, doc) {
            assert.ifError(err);
            assert.ok(doc !== null);

            user = doc;

            Category.create({}, function (err, doc) {
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

    it('should create and save a new Notepad', function (done) {
        var notepad = {
            title: 'Test notepad',
            text: 'Test text',
            category: null,
            user: null
        };
        Notepad.create(notepad, function (err, doc) {
            assert.ifError(err);
            assert.ok(doc !== null);
            assert.ok(doc instanceof Notepad);
            assert.strictEqual(doc.title, notepad.title);
            assert.strictEqual(doc.text, notepad.text);
            done();
        });
    });

    describe('getByIdForUser', function () {
        it('should return a Notepad with title, text and category by given notepadId and uid', function (done) {
            var n = notepads[0];
            Notepad.getByIdForUser(n._id, user._id, function (err, notepad) {
                assert.ifError(err);
                assert.ok(notepad !== null);

                assert.ok(notepad._id.equals(n._id));
                assert.strictEqual(notepad.title, n.title);
                assert.strictEqual(notepad.text, n.text);
                assert.ok(notepad.category.equals(n.category));

                done();
            });
        });
    });

    describe('getByUserId', function () {
        it('should return a collection of Notepad objects given uid', function (done) {
            Notepad.getByUserId(user._id, function (err, docs) {
                assert.ifError(err);
                assert.ok(docs !== null);
                assert.strictEqual(docs.length, notepadsNum);
                done();
            });
        });
    });
});
