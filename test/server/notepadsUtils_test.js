'use strict';

import * as notepadsUtils from '../../src/notepadsUtils';
import assert from 'assert';
import connection from '../db_common';
import mongoose from 'mongoose';
import User from '../../src/models/user';
import Category from '../../src/models/category';
import Notepad from '../../src/models/notepad';
import co from 'co';

describe('notepadsUtils', () => {

    let db, user;

    before(() => {
        return co(function* () {
            db = connection();

            let fbId = String(+new Date()), //convert to string for the comparison below
                name = 'Iliyan Trifonov',
                photo = 'photourl';

            user = yield User.create({
                facebookId: fbId,
                name: name,
                photo: photo
            });
        });
    });

    after(() => {
        return co(function* () {
            yield User.remove({});
            yield Category.remove({});
            yield Notepad.remove({});
            db.close();
        });
    });

    describe('prepopulate()', () => {
        it("should create a new 'Sample Category' and a new Notepad 'Read me' for a given user id", () => {
            return co(function* () {
                let result = yield notepadsUtils.prepopulate(user._id);
                assert.ok(result.user);
                assert.ok(result.category);
                assert.ok(result.notepad);
                //TODO: check if the category and notepad exist in db and their props/texts are as expected
            });
        });

        it('should return Error Invalid user id on missing uid param', done => {
            co(function* () {
                yield notepadsUtils.prepopulate(null);
            }).catch(err => {
                assert.ok(err);
                assert.strictEqual(err.message, 'Invalid user id!');
                done();
            });
        });

        it('should return Error on not existing user with the given uid', done => {
            co(function* () {
                yield notepadsUtils.prepopulate(mongoose.Types.ObjectId(+new Date()));
            }).catch(function (err) {
                assert.ok(err);
                assert.strictEqual(err.message, 'User not found!');
                done();
            });
        });
    });

    describe('assignNotepad()', () => {
        it('should increase the notepads of a specified cat and add the notepad id to the user.notepads', () => {
            return co(function* () {
                //prepare

                //refresh the user data:
                user = yield User.findById(user._id);
                let oldNotesLen = user.notepads.length;

                let category = yield Category.add('Test Cat Name', user._id);

                assert.strictEqual(category.notepadsCount, 0);

                let notepad = yield Notepad.create({
                    title: 'Test Notepad Title',
                    text: 'Test Notepad Text',
                    category: category._id,
                    user: user._id
                });

                //execute
                let result = yield notepadsUtils.assignNotepad(notepad._id, category._id, user._id);

                //check

                //get the latest user data:
                user = yield User.findById(user._id);
                assert.strictEqual(user.notepads.length, oldNotesLen + 1);
                assert.ok(user.notepads.indexOf(notepad._id) !== -1);

                //get the latest category data:
                category = yield Category.findById(category._id);
                assert.strictEqual(category.notepadsCount, 1);

                assert.ok(result.user._id.equals(user._id));
                assert.ok(result.category._id.equals(category._id));
            });
        });
    });

    describe('unassignNotepad()', () => {
        it('should decrease the notepads count in the category and remove the notepad from the user', () => {
            return co(function* () {
                //prepare

                //get one notepad from the test user:
                let notepad = yield Notepad.findById(user.notepads[0]);
                let oldNotesLen = user.notepads.length;

                let category = yield Category.findById(notepad.category);
                let oldNotesCount = category.notepadsCount;

                //execute
                let result = yield notepadsUtils.unassignNotepad(notepad._id, category._id, user._id);

                //check

                //update the user and category data:
                user = yield User.findById(user._id);
                category = yield Category.findById(category._id);

                assert.strictEqual(user.notepads.length, oldNotesLen - 1);
                assert.strictEqual(category.notepadsCount, oldNotesCount - 1);
                assert.ok(user.notepads.indexOf(notepad._id) === -1);

                assert.ok(result.user._id.equals(user._id));
                assert.ok(result.category._id.equals(category._id));
            });
        });
    });

});
