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

let config = loadConfig();

describe('API /categories', () => {

    let db, testUser, testCat, testNotepad, callUrl;
    //set the main categories API url
    let url = config.apiBase + '/categories';

    before(() => {
        return co(function* () {
            db = connection();

            let request = new RequestUrl();

            callUrl = request.callUrl.bind(request);

            request.setUrl(url);

            testUser = yield User.create({
                'facebookId': +new Date(),
                'name': 'Iliyan Trifonov',
                'photo': 'photourl'
            });

            request.setToken(testUser.accessToken);

            testCat = yield Category.create({
                name: 'Test category',
                user: testUser._id
            });

            testNotepad = yield Notepad.create({
                title: 'Test notepad',
                text: 'Test notepad text',
                category: testCat._id,
                user: testUser._id
            });

            //assign the notepad to cat and user
            testCat = yield Category.increaseNotepadsCountById(testCat._id);
            testUser = yield User.addNotepad(testUser._id, testNotepad._id);

        });
    });

    after(() => {
        return co(function* () {
            //cleanup
            yield User.remove({});
            yield Category.remove({});
            yield Notepad.remove({});

            db.close();
        });
    });

    describe('GET /categories', () => {
        it('should return status OK and an empty JSON array when the user has no categories', () =>
            co(function* () {
                let user = yield User.create({
                    name: 'Iliyan Trifonov',
                    facebookId: +new Date(),
                    photo: 'photourl'
                });

                let checks = request =>
                    request
                        .expect('Content-Type', /json/)
                        .expect(HttpStatus.OK)
                        .then(res => {
                            assert.deepEqual(res.body, []);
                        })
                ;

                yield checks(callUrl({ token: user.accessToken }));
                return checks(callUrl({ token: user.accessToken, tokenInHeaders: false }));
            })
        );

        it('should return status OK and a JSON array with 1 cat that has 1 notepad assigned', () =>
            co(function* () {
                let checks = request =>
                        request
                            .expect('Content-Type', /json/)
                            .expect(HttpStatus.OK)
                            .then(res => {
                                let cats = res.body;
                                assert.strictEqual(cats.length, 1);
                                assert.strictEqual(cats[0].notepadsCount, 1);
                            })
                    ;

                yield checks(callUrl({ token: testUser.accessToken }));
                return checks(callUrl({ token: testUser.accessToken, tokenInHeaders: false }));
            })
        );
    });

    describe('POST /categories', () => {
        it('should return BAD_REQUEST when cat name is not given', () =>
            co(function* () {
                let checks = request =>
                    request
                        .expect('Content-Type', /json/)
                        .expect(HttpStatus.BAD_REQUEST)
                        .then(res => {
                            assert.deepEqual(res.body, {});
                        })
                ;

                yield checks(callUrl({ method: 'post', token: testUser.accessToken }));
                yield checks(callUrl({ method: 'post', token: testUser.accessToken, tokenInHeaders: false }));
            })
        );

        it('should create a new category and assign it to the user', () =>
            co(function* () {
                let catName = 'Test Cat Name';

                let checks = request =>
                    request
                        .send({ name: catName })
                        .expect('Content-Type', /json/)
                        .expect(HttpStatus.CREATED)
                        .then(res => {
                            co(function* () {
                                let cat = res.body;
                                assert.ok(cat._id);
                                assert.strictEqual(cat.name, catName);
                                assert.ok(testUser._id.equals(cat.user));

                                //cleanup
                                yield Category.remove({ _id: cat._id });
                                yield User.removeCategory(cat.user, cat._id);
                            });
                        });

                yield checks(callUrl({ method: 'post', token: testUser.accessToken }));
                yield checks(callUrl({ method: 'post', token: testUser.accessToken, tokenInHeaders: false }));
            })
        );
    });

    describe('GET /categories/:id', () => {
        it('should return NOT FOUND and an empty object literal when cat is not found', () =>
            co(function* () {
                let checks = request =>
                    request
                        .expect('Content-Type', /json/)
                        .expect(HttpStatus.NOT_FOUND)
                        .then(res => {
                            assert.deepEqual(res.body, {});
                        });

               yield checks(callUrl({
                   method: 'get',
                   addUrl: '/' + mongoose.Types.ObjectId(),
                   token: testUser.accessToken
               }));

               yield checks(callUrl({
                           method: 'get',
                           addUrl: '/' + mongoose.Types.ObjectId(),
                           token: testUser.accessToken,
                           tokenInHeaders: false
                       }));
            })
        );

        it('should return a category given its id', () =>
            co(function* () {
                let checks = request =>
                    request
                        .expect('Content-Type', /json/)
                        .expect(HttpStatus.OK)
                        .then(res => {
                            let cat = res.body;

                            assert.ok(cat);
                            assert.ok(testCat._id.equals(cat._id));
                            assert.strictEqual(cat.name, testCat.name);
                        });

                yield checks(callUrl({ method: 'get', addUrl: '/' + testCat._id, token: testUser.accessToken }));

                yield checks(callUrl({
                    method: 'get',
                    addUrl: '/' + testCat._id,
                    token: testUser.accessToken,
                    tokenInHeaders: false
                }));
            })
        );
    });

    describe('PUT /categories/:id', () => {
        it('should return a BAD_REQUEST status when a param is missing', done => {
            callUrl({ method: 'put', addUrl: '/1234', token: testUser.accessToken })
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

        it('should update a category given proper id and name', done => {
            let newCatName = 'New Cat Name ' + String(new Date().getTime());
            callUrl({ method: 'put', addUrl: '/' + testCat._id, token: testUser.accessToken })
                .send({ name: newCatName })
                .expect('Content-Type', /json/)
                .expect(HttpStatus.CREATED)
                .end((err, res) => {
                    if (err) {
                        return done(err);
                    }

                    let cat = res.body;

                    assert.ok(cat);
                    assert.ok(testCat._id.equals(cat._id));
                    assert.strictEqual(cat.name, newCatName);

                    //update the test category
                    testCat.name = cat.name;

                    done();
                });
        });
    });

    describe('DELETE /categories/:id', () => {
        it('should return NOT FOUND when the cat is not found by the given params', done => {
            callUrl({ method: 'delete', addUrl: '/' + mongoose.Types.ObjectId(), token: testUser.accessToken })
                .expect('Content-Type', /json/)
                .expect(HttpStatus.NOT_FOUND, done);
        });

        it('should remove the category, remove its id from user.categories, remove all notepads in that category and from user.notepads ', done => {
            co(function* () {
                //prepare
                let user = yield User.create({
                    name: 'User to be deleted',
                    facebookId: +new Date(),
                    photo: 'photourl'
                });

                let cat = yield Category.create({
                    name: 'Cat to be deleted',
                    user: user._id
                });

                user = yield User.addCategory(user._id, cat._id);

                let notepad = yield Notepad.create({
                    title: 'Notepad to be deleted',
                    text: 'Test text',
                    category: cat._id,
                    user: user._id
                });

                user = yield User.addNotepad(user._id, notepad._id);
                cat = yield Category.increaseNotepadsCountById(cat._id);

                assert.ok(user.categories.indexOf(cat._id) !== -1);
                assert.ok(user.notepads.indexOf(notepad._id) !== -1);
                assert.strictEqual(cat.notepadsCount, 1);

                //execute
                callUrl({ method: 'delete', addUrl: '/' + cat._id, token: user.accessToken })
                    //.expect('Content-Type', /json/)
                    .expect(HttpStatus.NO_CONTENT)
                    .end((err, res) => {
                        co(function* () {
                            if (err) {
                                return done(err);
                            }

                            assert.deepEqual(res.body, {});

                            //check if the should be deleted stuff exists

                            assert.strictEqual(null, yield Category.findById(cat._id).exec());
                            assert.strictEqual(null, yield Notepad.findById(notepad._id).exec());

                            user = yield User.findById(user._id).exec();
                            assert.ok(user.categories.indexOf(cat._id) === -1);
                            assert.ok(user.notepads.indexOf(notepad._id) === -1);

                            done();
                        }).catch(done);
                    });
            }).catch(done);
        });
    });

});
