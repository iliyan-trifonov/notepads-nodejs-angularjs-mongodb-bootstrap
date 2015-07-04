'use strict';

import categoriesRouter from '../../../src/routes/categories';
import assert from 'assert';
import connection from '../../db_common';
import User from '../../../src/models/user';
import Category from '../../../src/models/category';
import Notepad from '../../../src/models/notepad';
import HttpStatus from 'http-status';
import mongoose from 'mongoose';
import proxyquire from 'proxyquire';
import Promise from 'bluebird';
import co from 'co';

describe('Categories Routes', () => {

    var db, user, category, req, res;

    before(() =>
        co(function* () {
            db = connection();

            user = yield User.createAsync({
                facebookId: +new Date(),
                name: 'Iliyan Trifonov',
                photo: 'photourl'
            });

            category = yield Category.createAsync({
                name: 'Sample Category',
                user: user._id
            });

            user = yield User.addCategory(user._id, category._id);
        })
    );

    after(() =>
        co(function* () {
            yield User.removeAsync({});
            yield Category.removeAsync({});
            yield Notepad.removeAsync({});
            db.close();
        })
    );

    beforeEach(() => {
        req = res = {};
        req.user = user;
    });

    describe('GET /categories', () => {
        it('should return status 200 and response type json with categories body', done => {
            res.status = function (status) {
                assert.strictEqual(status, HttpStatus.OK);
                return this;
            };

            res.json = cats => {
                assert.ok(cats);
                assert.strictEqual(cats.length, 1);
                assert.ok(cats[0]._id.equals(category._id));
                assert.strictEqual(cats[0].name, category.name);
                assert.strictEqual(cats[0].notepadsCount, category.notepadsCount);
                done();
            };

            categoriesRouter.getHandler(req, res);
        });

        it('should return empty JSON array when there are not categories found', done => {
            req.user = { id: mongoose.Types.ObjectId() };

            res.status = function (status) {
                assert.strictEqual(status, HttpStatus.OK);
                return this;
            };

            res.json = cats => {
                assert.deepEqual(cats, []);
                done();
            };

            categoriesRouter.getHandler(req, res);
        });

        it('should return INTERNAL SERVER ERROR on error', done => {
            req.user = { id: +new Date() };

            res.status = function (status) {
                assert.strictEqual(status, HttpStatus.INTERNAL_SERVER_ERROR);
                return this;
            };

            res.json = cats => {
                assert.deepEqual(cats, []);
                done();
            };

            categoriesRouter.getHandler(req, res);
        });
    });

    describe('POST /categories', () => {
        it('should create a new Category and assign it to the user', done => {
            var testCatName = 'Test cat ' + (+new Date());

            req.body = { name: testCatName };

            res.status = function (status) {
                assert.strictEqual(status, HttpStatus.CREATED);
                return this;
            };

            res.json = cat => {
                assert.ok(cat);
                assert.strictEqual(cat.name, testCatName);
                User.findAsync({ category: cat._id })
                    .then(user => assert.ok(user))
                    .then(done);
            };

            categoriesRouter.postHandler(req, res);
        });

        it('should return INTERNAL SERVER ERROR on error', done => {
            req.user = { id: +new Date() };

            req.body = { name: 'jhvjhvjh' };

            res.status = function (status) {
                assert.strictEqual(status, HttpStatus.INTERNAL_SERVER_ERROR);
                return this;
            };

            res.json = cat => {
                assert.deepEqual(cat, {});
                done();
            };

            categoriesRouter.postHandler(req, res);
        });
    });

    describe('GET /categories/:id', () => {
        it('should return status 200 and the required Category', done => {
            req = {
                params : { id: category._id },
                user: { id: user._id }
            };

            res.status = function (status) {
                assert.strictEqual(status, HttpStatus.OK);
                return this;
            };

            res.json = cat => {
                assert.ok(cat._id.equals(category._id));
                assert.strictEqual(cat.name, category.name);

                done();
            };

            categoriesRouter.getIdHandler(req, res);
        });

        it('should return NOT_FOUND and an empty object result for a given non-existent id', done => {
            req = {
                params : { id: mongoose.Types.ObjectId() },
                user: { id: user._id }
            };

            res.status = function (status) {
                assert.strictEqual(status, HttpStatus.NOT_FOUND);
                return this;
            };

            res.json = cat => {
                assert.deepEqual(cat, {});

                done();
            };

            categoriesRouter.getIdHandler(req, res);
        });

        it('should return status 500 and an empty json error object for a wrong cat id format given', done => {
            req = {
                params : { id: 123 },
                user: { id: user._id }
            };

            res.status = function (status) {
                assert.strictEqual(status, HttpStatus.INTERNAL_SERVER_ERROR);
                return this;
            };

            res.json = err => {
                assert.deepEqual(err, {});

                done();
            };

            categoriesRouter.getIdHandler(req, res);
        });
    });

    describe('PUT /categories/:id', () => {
        it('should update a Category\'s name given its id, uid and name', done => {
            var newCatName = 'New Cat Name';
            req = {
                params: { id: category._id },
                user: { id: user._id },
                body: { name: newCatName }
            };
            res = {
                status: function (status) {
                    assert.strictEqual(status, HttpStatus.CREATED);
                    return this;
                },
                json: cat => {
                    assert.strictEqual(cat.name, newCatName);
                    category = cat;
                    done();
                }
            };
            categoriesRouter.putIdHandler(req, res);
        });

        it('should not update given a non-existent cat id', done => {
            req = {
                params: { id: mongoose.Types.ObjectId() },
                user: { id: user._id },
                body: { name: 'asdasdasd' }
            };
            res = {
                status: function (status) {
                    assert.strictEqual(status, HttpStatus.NOT_FOUND);
                    return this;
                },
                json: cat => {
                    assert.deepEqual(cat, {});
                    done();
                }
            };
            categoriesRouter.putIdHandler(req, res);
        });

        it('should return INTERNAL SERVER ERROR on error', done => {
            req = {
                params: { id: mongoose.Types.ObjectId() },
                user: { id: +new Date() },
                body: { name: 'asdasdasd' }
            };

            res.status = function (status) {
                assert.strictEqual(status, HttpStatus.INTERNAL_SERVER_ERROR);
                return this;
            };

            res.json = cat => {
                assert.deepEqual(cat, {});
                done();
            };

            categoriesRouter.putIdHandler(req, res);
        });
    });

    describe('DELETE /categories/:id', () => {
        it('should not delete and return NOT_FOUND given a non-existent category id', done => {
            req = {
                params: { id: mongoose.Types.ObjectId() },
                user: { id: user._id }
            };
            res = {
                status: function (status) {
                    assert.strictEqual(status, HttpStatus.NOT_FOUND);
                    return this;
                },
                json: cat => {
                    assert.deepEqual(cat, {});
                    done();
                }
            };
            categoriesRouter.deleteIdHandler(req, res);
        });

        it('should return INTERNAL_SERVER_ERROR if there was a problem deleting the category', done => {
            req.params = { id: category._id };
            req.user = { id: user._id };
            let CategoryMock = {
                findByIdAndRemoveAsync: catId => {
                    assert.ok(catId);
                    return Promise.reject(null);
                }
            };
            let categoriesRouterWithMocks = proxyquire('../../../src/routes/categories', {
                '../models/category': CategoryMock
            });
            res.status = function (status) {
                assert.strictEqual(status, HttpStatus.INTERNAL_SERVER_ERROR);
                return this;
            };
            res.json = obj => {
                assert.deepEqual(obj, {});
                done();
            };
            categoriesRouterWithMocks.deleteIdHandler(req, res);
        });

        it('should return INTERNAL SERVER ERROR if there was a problem deleting the category id from User', done => {
            req.params = { id: category._id };
            req.user = { id: user._id };

            let CategoryMock = {
                findByIdAndRemoveAsync: catId => {
                    assert.ok(catId);
                    return Promise.resolve(category);
                }
            };

            let UserMock = {
                removeCategory: (uid, catId) => {
                    assert.ok(uid.equals(user._id));
                    assert.ok(catId.equals(category._id));
                    return Promise.reject(new Error('triggerred error from User.removeCategory()'));
                }
            };

            let categoriesRouterWithMocks = proxyquire('../../../src/routes/categories', {
                '../models/category': CategoryMock,
                '../models/user': UserMock
            });

            res.status = function (status) {
                assert.strictEqual(status, HttpStatus.INTERNAL_SERVER_ERROR);
                return this;
            };
            res.json = obj => {
                assert.deepEqual(obj, {});
                done();
            };
            categoriesRouterWithMocks.deleteIdHandler(req, res);
        });

        it('should delete a category, delete all notepads belonging to that category and update categories in user', done => {
            let cat;
            //create a new category
            Category.createAsync({ name: 'Test cat to delete', user: user._id }).then(category => {
                assert.ok(category);
                cat = category;
                //add it to the user's categories array
                return User.addCategory(user._id, category._id);
            }).then(user => {
                assert.ok(user);
                //create a new notepad for that category and user
                return Notepad.createAsync({
                    title: 'asdas',
                    text: 'dfgdfg',
                    category: cat._id,
                    user: user._id
                });
            }).then(notepad => {
                assert.ok(notepad);
                //add the notepad to the user's notepads array
                return User.addNotepad(user._id, notepad._id);
            }).then(user => {
                assert.ok(user);

                //prepare the test params
                req = {
                    params: { id: cat._id },
                    user: { id: user._id }
                };

                res = {
                    status: function (status) {
                        assert.strictEqual(status, HttpStatus.NO_CONTENT);
                        return this;
                    },
                    json: category => {
                        assert.deepEqual(category, {});

                        //check with the created cat above:

                        //category doesn't exist
                        Category.findOneAsync({ id: cat._id }).then(doc => {
                            assert.strictEqual(doc, null);

                            //user with that category doesn't exist
                            return User.findOneAsync({ categories: cat._id });
                        }).then(doc => {
                            assert.strictEqual(doc, null);

                            return Notepad.findOneAsync({ category: cat._id }).then(doc => {
                                assert.strictEqual(doc, null);
                            });
                        }).then(done);
                    }
                };

                //execute
                categoriesRouter.deleteIdHandler(req, res);
            });
        });
    });

});
