'use strict';

import HttpStatus from 'http-status';
import connection from '../../db_common';
import User from '../../../src/models/user';
import Category from '../../../src/models/category';
import Notepad from '../../../src/models/notepad';
import mongoose from 'mongoose';
import assert from 'assert';
import co from 'co';
import RequestUrl, { loadConfig } from './helper-functions';
import { assignNotepad } from '../../../src/notepadsUtils';

let config = loadConfig();

describe('API /notepads', () => {

    let db, testUser, testCat, testNotepad, callUrl;
    //set the main notepads API url
    let url = config.apiBase + '/notepads';

    before(() =>
        co(function* () {
            db = connection();

            let request = new RequestUrl();

            callUrl = request.callUrl.bind(request);

            request.setUrl(url);

            testUser = yield User.createAsync({
                'facebookId': +new Date(),
                'name': 'Iliyan Trifonov',
                'photo': 'photourl'
            });

            request.setToken(testUser.accessToken);

            testCat = yield Category.createAsync({
                name: 'Test category',
                user: testUser._id
            });

            testNotepad = yield Notepad.createAsync({
                title: 'Test notepad',
                text: 'Test notepad text',
                category: testCat._id,
                user: testUser._id
            });

            //assign the notepad to cat and user
            testCat = yield Category.increaseNotepadsCountById(testCat._id);
            testUser = yield User.addNotepad(testUser._id, testNotepad._id);
        })
    );

    after(() =>
        co(function* () {
            //cleanup
            yield User.remove({});
            yield Category.remove({});
            yield Notepad.remove({});

            db.close();
        })
    );

    describe('GET /notepads', () => {
        describe('?insidecats=1', () => {
            it('should return an empty array if no cats are found', () =>
                co(function* () {
                    let user = yield User.createAsync({
                        name: 'Iliyan Trifonov',
                        facebookId: +new Date(),
                        photo: 'photourl'
                    });

                    return callUrl({ token: user.accessToken, addQuery: 'insidecats=1' })
                        .expect('Content-Type', /json/)
                        .expect(HttpStatus.OK)
                        .then(res =>
                            assert.deepEqual(res.body, [])
                        );
                })
            );

            it('should return an array of categories with notepads inside', () =>
                callUrl({ token: testUser.accessToken, addQuery: 'insidecats=1' })
                    .expect('Content-Type', /json/)
                    .expect(HttpStatus.OK)
                    .then(res => {
                        let cats = res.body;

                        assert.ok(Array.isArray(cats));
                        assert.strictEqual(cats.length, 1);
                        assert.strictEqual(cats[0].notepads.length, 1);
                        assert.ok(testCat._id.equals(cats[0]._id));
                        assert.ok(testNotepad._id.equals(cats[0].notepads[0]._id));
                    })
            );
        });

        it('should return NOT_FOUND if user has no notepads', () =>
            co(function* () {
                let user = yield User.createAsync({
                    name: 'Iliyan Trifonov',
                    facebookId: +new Date(),
                    photo: 'photourl'
                });

                callUrl({ token: user.accessToken })
                    .expect('Content-Type', /json/)
                    .expect(HttpStatus.NOT_FOUND)
                    .then(res =>
                        assert.deepEqual(res.body, [])
                    );
            })
        );

        it('should return the notepads of the user', () =>
            callUrl({ token: testUser.accessToken })
                .expect('Content-Type', /json/)
                .expect(HttpStatus.OK)
                .then(res => {
                    let notepads= res.body;

                    assert.ok(Array.isArray(notepads));
                    assert.strictEqual(notepads.length, 1);
                    assert.strictEqual(notepads[0].title, testNotepad.title);
                })
        );
    });

    describe('GET /notepads/:id', () => {
        it('should return NOT_FOUND when there is no notepad with the given id', done => {
            callUrl({ token: testUser.accessToken, addUrl: '/' + mongoose.Types.ObjectId() })
                .expect('Content-Type', /json/)
                .expect(HttpStatus.NOT_FOUND)
                .end((err, res) => {
                    if (err) {
                        return done(err);
                    }

                    assert.deepEqual(res.body, {});

                    done();
                });
        });

        it('should return NOT_FOUND when there is no notepad with the given uid', done => {
            co(function* () {
                let user = yield User.createAsync({
                    name: 'Iliyan Trifonov',
                    facebookId: +new Date(),
                    photo: 'photourl'
                });

                callUrl({ token: user.accessToken, addUrl: '/' + testNotepad._id })
                    .expect('Content-Type', /json/)
                    .expect(HttpStatus.NOT_FOUND)
                    .end((err, res) => {
                        if (err) {
                            return done(err);
                        }

                        assert.deepEqual(res.body, {});

                        done();
                    });
            });
        });

        it('should return INTERNAL_SERVER_ERROR on error', done => {
            callUrl({ token: testUser.accessToken, addUrl: '/' + (new Date().getTime()) })
                .expect('Content-Type', /json/)
                .expect(HttpStatus.INTERNAL_SERVER_ERROR)
                .end((err, res) => {
                    if (err) {
                        return done(err);
                    }

                    assert.deepEqual(res.body, {});

                    done();
                });
        });

        it('should return the requested notepad', done => {
            callUrl({ token: testUser.accessToken, addUrl: '/' + testNotepad._id })
                .expect('Content-Type', /json/)
                .expect(HttpStatus.OK)
                .end((err, res) => {
                    if (err) {
                        return done(err);
                    }

                    let notepad = res.body;

                    assert.ok(testNotepad._id.equals(notepad._id));
                    assert.strictEqual(notepad.title, testNotepad.title);

                    done();
                });
        });
    });

    describe('POST /notepads', () => {
        it('should return BAD_REQUEST when the category of the notepad is not found', done => {
            callUrl({ token: testUser.accessToken, method: 'post' })
                .send({
                    title: 'test notepad',
                    text: 'test text'
                })
                .expect('Content-Type', /json/)
                .expect(HttpStatus.BAD_REQUEST)
                .end((err, res) => {
                    if (err) {
                        return done(err);
                    }

                    assert.deepEqual(res.body, {});

                    done();
                });
        });

        it('should return BAD_REQUEST when the title param is missing', done => {
            callUrl({ token: testUser.accessToken, method: 'post' })
                .send({
                    category: testCat._id,
                    text: 'test text'
                })
                .expect('Content-Type', /json/)
                .expect(HttpStatus.BAD_REQUEST)
                .end((err, res) => {
                    if (err) {
                        return done(err);
                    }

                    assert.deepEqual(res.body, {});

                    done();
                });
        });

        it('should return BAD_REQUEST when the text param is missing', done => {
            callUrl({ token: testUser.accessToken, method: 'post' })
                .send({
                    category: testCat._id,
                    title: 'test notepad'
                })
                .expect('Content-Type', /json/)
                .expect(HttpStatus.BAD_REQUEST)
                .end((err, res) => {
                    if (err) {
                        return done(err);
                    }

                    assert.deepEqual(res.body, {});

                    done();
                });
        });

        it('should return the created notepad', done => {
            let notepadReq = {
                category: testCat._id,
                title: 'test notepad',
                text: 'test text'
            };

            callUrl({ token: testUser.accessToken, method: 'post' })
                .send(notepadReq)
                .expect('Content-Type', /json/)
                .expect(HttpStatus.CREATED)
                .end((err, res) => {
                    if (err) {
                        return done(err);
                    }

                    let notepad = res.body;

                    assert.ok(notepad);
                    assert.ok(notepadReq.category.equals(notepad.category));
                    assert.strictEqual(notepadReq.title, notepad.title);
                    assert.strictEqual(notepadReq.text, notepad.text);

                    co(function* () {
                        //refresh the test user and cat
                        testUser = yield User.findByIdAsync(testUser._id);
                        testCat = yield Category.findByIdAsync(testCat._id);

                        done();
                    });
                });
        });

        it('should return INTERNAL_SERVER_ERROR on error', done => {
            callUrl({ token: testUser.accessToken, method: 'post' })
                .send({
                    category: +new Date()
                })
                .expect('Content-Type', /json/)
                .expect(HttpStatus.INTERNAL_SERVER_ERROR)
                .end((err, res) => {
                    if (err) {
                        return done(err);
                    }

                    assert.deepEqual(res.body, {});

                    done();
                });
        });

    });

    describe('PUT /notepads/:id', () => {
        it('should return BAD_REQUEST when a param is missing', () =>
            co(function* () {
                //missing title
                yield callUrl({ token: testUser.accessToken, method: 'put', addUrl: '/' + mongoose.Types.ObjectId() })
                    .send({
                        text: 'test text',
                        category: mongoose.Types.ObjectId()
                    })
                    .expect('Content-Type', /json/)
                    .expect(HttpStatus.BAD_REQUEST);

                //missing text
                yield callUrl({ token: testUser.accessToken, method: 'put', addUrl: '/' + mongoose.Types.ObjectId() })
                    .send({
                        title: 'test title',
                        category: mongoose.Types.ObjectId()
                    })
                    .expect('Content-Type', /json/)
                    .expect(HttpStatus.BAD_REQUEST);

                 //missing category
                 yield callUrl({ token: testUser.accessToken, method: 'put', addUrl: '/' + mongoose.Types.ObjectId() })
                     .send({
                         title: 'test title',
                         text: 'test text'
                     })
                     .expect('Content-Type', /json/)
                     .expect(HttpStatus.BAD_REQUEST);
            })
        );

        it('should return INTERNAL_SERVER_ERROR on error', done => {
            callUrl({ token: testUser.accessToken, method: 'put', addUrl: '/' + (new Date().getTime()) })
                .send({
                    title: 'test title',
                    text: 'test text',
                    category: mongoose.Types.ObjectId()
                })
                .expect('Content-Type', /json/)
                .expect(HttpStatus.INTERNAL_SERVER_ERROR, done);
        });

        it('should return NOT_FOUND when the requested notepad to update is not found', done => {
            callUrl({ token: testUser.accessToken, method: 'put', addUrl: '/' + mongoose.Types.ObjectId() })
                .send({
                    title: 'test title',
                    text: 'test text',
                    category: mongoose.Types.ObjectId()
                })
                .expect('Content-Type', /json/)
                .expect(HttpStatus.NOT_FOUND, done);
        });

        it('should update a notepad and return the updated notepad object', done => {
            let newNotepadData = {
                title: 'new notepad title',
                text: 'new notepad text',
                category: testCat._id
            };

            //make sure the title and text are different before the update
            assert.notStrictEqual(testNotepad.title, newNotepadData.title);
            assert.notStrictEqual(testNotepad.text, newNotepadData.text);

            //the category of the tested notepad should be the tested category
            assert.ok(testNotepad.category.equals(testCat._id));

            callUrl({ token: testUser.accessToken, method: 'put', addUrl: '/' + testNotepad._id })
                .send(newNotepadData)
                .expect('Content-Type', /json/)
                .expect(HttpStatus.CREATED)
                .end(function (err, res) {
                    if (err) {
                        return done(err);
                    }

                    let notepad = res.body;

                    assert.ok(notepad);
                    //the updated notepad is as expected:
                    assert.ok(testNotepad._id.equals(notepad._id));
                    assert.strictEqual(notepad.title, newNotepadData.title);
                    assert.strictEqual(notepad.text, newNotepadData.text);
                    assert.ok(testCat._id.equals(notepad.category));

                    //refresh the testNotepad:
                    testNotepad.title = notepad.title;
                    testNotepad.text = notepad.text;

                    done();
                });
        });

        it('should update a notepad, change its category and update the 2 categories involved', done =>
            co(function* () {
                //create a new category to use for updating the notepad
                let newCat = yield Category.add('test new cat', testUser._id);

                assert.ok( ! newCat._id.equals(testCat._id) );

                callUrl({ token: testUser.accessToken, method: 'put', addUrl: '/' + testNotepad._id })
                    .send({
                        title: testNotepad.title,
                        text: testNotepad.text,
                        category: newCat._id
                    })
                    .expect('Content-Type', /json/)
                    .expect(HttpStatus.CREATED)
                    .end(function (err, res) {
                        if (err) {
                            return done(err);
                        }

                        co(function* () {
                            let notepad = res.body;

                            assert.ok(notepad);
                            //the updated notepad is as expected:
                            assert.ok(testNotepad._id.equals(notepad._id));
                            assert.strictEqual(notepad.title, testNotepad.title);
                            assert.strictEqual(notepad.text, testNotepad.text);
                            assert.ok(newCat._id.equals(notepad.category));

                            let oldCatNotepadsCount = testCat.notepadsCount;

                            //refresh the new and old cats
                            testCat = yield Category.findByIdAsync(testCat._id);
                            newCat = yield Category.findByIdAsync(newCat._id);

                            assert.strictEqual(testCat.notepadsCount, oldCatNotepadsCount - 1);
                            assert.strictEqual(newCat.notepadsCount, 1);

                            //refresh the testNotepad:
                            testNotepad.title = notepad.title;
                            testNotepad.text = notepad.text;

                            //add the newCat as testCat:
                            testCat = newCat;

                            done();
                        }).catch(done);
                    });
            })
        );
    });

    describe('DELETE /notepads/:id', () => {
        it('should return INTERNAL_SERVER_ERROR on error', () =>
                callUrl({ token: testUser.accessToken, method: 'delete', addUrl: '/' + (new Date().getTime()) })
                    .expect('Content-Type', /json/)
                    .expect(HttpStatus.INTERNAL_SERVER_ERROR)
        );

        it('should return NOT_FOUND if the notepad to delete is not found', () =>
                callUrl({ token: testUser.accessToken, method: 'delete', addUrl: '/' + mongoose.Types.ObjectId() })
                    .expect('Content-Type', /json/)
                    .expect(HttpStatus.NOT_FOUND)
        );

        it('should delete the notepad, update user and category data and return NO_CONTENT', () =>
            co(function* () {
                //create a new notepad to delete
                let notepadDel = yield Notepad.createAsync({
                    title: 'del title',
                    text: 'del text',
                    category: testCat._id,
                    user: testUser._id
                });

                //modify the user and cat data
                let result = yield assignNotepad(notepadDel._id, testCat._id, testUser._id);

                //assign the latest data for test user and cat
                testUser = result.user;
                testCat = result.category;

                let oldNotepadsCount = testCat.notepadsCount;
                let oldUserNotepads = testUser.notepads;

                assert.ok(oldNotepadsCount > 0);
                assert.ok(oldUserNotepads.indexOf(notepadDel._id) !== -1);

                //delete
                yield callUrl({ token: testUser.accessToken, method: 'delete', addUrl: '/' + notepadDel._id })
                    .expect(HttpStatus.NO_CONTENT);

                //check
                assert.strictEqual(yield Notepad.findByIdAsync(notepadDel._id), null);

                //refresh the test user and cat data
                testCat = yield Category.findByIdAsync(testCat._id);
                testUser = yield User.findByIdAsync(testUser._id);

                //make sure the deleted notepad doesn't exist in user and cat data:
                assert.strictEqual(testCat.notepadsCount, oldNotepadsCount - 1);
                assert.strictEqual(testUser.notepads.length, oldUserNotepads.length - 1);
                assert.ok(testUser.notepads.indexOf(notepadDel._id) === -1);
            })
        );
    });

});
