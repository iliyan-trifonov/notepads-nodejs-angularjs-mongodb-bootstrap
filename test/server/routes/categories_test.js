'use strict';

var categoriesRouter = require('../../../src/routes/categories'),
    assert = require('assert'),
    connection = require('../../db_common'),
    User = require('../../../src/models/user'),
    Category = require('../../../src/models/category'),
    Notepad = require('../../../src/models/notepad'),
    HttpStatus = require('http-status'),
    mongoose = require('mongoose');

describe('Categories Routes', function () {

    var db, user, category, req, res;

    before(function () {
        //TODO: use callback/promise
        db = connection();

        return User.createAsync({
            facebookId: +new Date(),
            name: 'Iliyan Trifonov',
            photo: 'photourl'
        }).then(function (doc) {
            assert.ok(doc !== null);
            user = doc;
            return Category.createAsync({
                name: 'Sample Category',
                user: user._id
            });
        }).then(function (cat) {
            assert.ok(cat !== null);
            category = cat;
            return User.addCategory(user._id, cat._id);
        }).then(function (updatedUser) {
            assert.notStrictEqual(updatedUser, null);
            user = updatedUser;
        });
    });

    after(function () {
        return User.removeAsync({}).then(function () {
            return Category.removeAsync({});
        })
        //TODO: try with then(db.close)
        .then(function () {
            db.close();
        });
    });

    beforeEach(function () {
        req = res = {};
        //TODO: possible to put in before() instead:
        req.user = user;
    });

    describe('GET /categories', function () {
        it('should return status 200 and response type json with categories body', function (done) {
            res.status = function (status) {
                assert.strictEqual(status, HttpStatus.OK);
                return this;
            };

            res.json = function (cats) {
                assert.ok(cats);
                assert.strictEqual(cats.length, 1);
                assert.ok(cats[0]._id.equals(category._id));
                assert.strictEqual(cats[0].name, category.name);
                assert.strictEqual(cats[0].notepadsCount, category.notepadsCount);
                done();
            };

            categoriesRouter.getHandler(req, res);
        });
    });

    describe('POST /categories', function () {
        it('should add new Category and assign it to the user', function (done) {
            var testCatName = 'Test cat ' + (+new Date());

            req.body = { name: testCatName };

            res.status = function (status) {
                assert.strictEqual(status, HttpStatus.OK);
                return this;
            };

            res.json = function (cat) {
                assert.ok(cat);
                assert.strictEqual(cat.name, testCatName);
                User.findAsync({ category: cat._id })
                    .then(function (user) {
                        assert.notStrictEqual(user, null);
                    })
                    .then(done);
            };

            categoriesRouter.postHandler(req, res);
        });
    });

    describe('GET /categories/:id', function () {
        it('should return status 200 and the required Category', function (done) {
            req = {
                params : { id: category._id },
                user: { id: user._id }
            };

            res.status = function (status) {
                assert.strictEqual(status, HttpStatus.OK);
                return this;
            };

            res.json = function (cat) {
                assert.ok(cat._id.equals(category._id));
                assert.strictEqual(cat.name, category.name);

                done();
            };

            categoriesRouter.getIdHandler(req, res);
        });

        it('should return status 204 and an empty object result for a given non-existent id', function (done) {
            req = {
                params : { id: mongoose.Types.ObjectId() },
                user: { id: user._id }
            };

            res.status = function (status) {
                assert.strictEqual(status, HttpStatus.NO_CONTENT);
                return this;
            };

            res.json = function (cat) {
                assert.deepEqual(cat, {});

                done();
            };

            categoriesRouter.getIdHandler(req, res);
        });

        it('should return status 500 and an empty json error object for a wrong cat id format given', function (done) {
            req = {
                params : { id: 123 },
                user: { id: user._id }
            };

            res.status = function (status) {
                assert.strictEqual(status, HttpStatus.INTERNAL_SERVER_ERROR);
                return this;
            };

            res.json = function (err) {
                assert.deepEqual(err, {});

                done();
            };

            categoriesRouter.getIdHandler(req, res);
        });
    });

    describe('PUT /categories/:id', function () {
        it('should update a Category\'s name given its id, uid and name', function (done) {
            var newCatName = 'New Cat Name';
            req = {
                params: { id: category._id },
                user: { id: user._id },
                body: { name: newCatName }
            };
            res = {
                status: function (status) {
                    assert.strictEqual(status, HttpStatus.OK);
                    return this;
                },
                json: function (cat) {
                    assert.strictEqual(cat.name, newCatName);
                    category = cat;
                    done();
                }
            };
            categoriesRouter.putIdHandler(req, res);
        });

        it('should not update given a non-existent cat id', function (done) {
            req = {
                params: { id: mongoose.Types.ObjectId() },
                user: { id: user._id },
                body: { name: 'asdasdasd' }
            };
            res = {
                status: function (status) {
                    assert.strictEqual(status, HttpStatus.NO_CONTENT);
                    return this;
                },
                json: function (cat) {
                    assert.deepEqual(cat, {});
                    done();
                }
            };
            categoriesRouter.putIdHandler(req, res);
        });
    });

    describe('DELETE /categories/:id', function () {
        it('should not delete and return NO CONTENT given a non-existent category id', function (done) {
            req = {
                params: { id: mongoose.Types.ObjectId() },
                user: { id: user._id }
            };
            res = {
                status: function (status) {
                    assert.strictEqual(status, HttpStatus.NO_CONTENT);
                    return this;
                },
                json: function (cat) {
                    assert.deepEqual(cat, {});
                    done();
                }
            };
            categoriesRouter.deleteIdHandler(req, res);
        });

        it('should delete a category, update categories in user and delete all notepads belonging to that category', function (done) {
            //create a new category
            Category.createAsync({ name: 'Test cat to delete', user: user._id }).then(function (category) {
                assert.notStrictEqual(category, null);
                //add it to the user's categories array
                return User.addCategory(user._id, category._id);
            }).then(function (user) {
                assert.notStrictEqual(user, null);
                //create a new notepad for that category and user
                return Notepad.create({ category: category._id, user: user._id });
            }).then(function (notepad) {
                assert.ok(notepad !== null);
                //add the notepad to the user's notepads array
                return User.addNotepad(user._id, notepad._id);
            }).then(function (user) {
                assert.notStrictEqual(user, null);

                //prepare the test params
                req = {
                    params: { id: category._id },
                    user: { id: user._id }
                };

                res = {
                    status: function (status) {
                        assert.strictEqual(status, HttpStatus.OK);
                        return this;
                    },
                    json: function (cat) {
                        assert.ok(cat._id);
                        assert.ok(cat._id.equals(category._id));
                        //category doesn't exist
                        Category.findOneAsync({ id: cat._id }).then(function (doc) {
                            assert.strictEqual(doc, null);

                            //user with that category doesn't exist
                            return User.findOneAsync({ categories: cat._id });
                        }).then(function (doc) {
                            assert.strictEqual(doc, null);

                            return Notepad.find({ category: cat._id }).then(function (doc) {
                                assert.deepEqual(doc, []);
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
