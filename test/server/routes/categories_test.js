'use strict';

var categoriesRouter = require('../../../src/routes/categories'),
    assert = require('assert'),
    connection = require('../../db_common'),
    User = require('../../../src/models/user'),
    Category = require('../../../src/models/category'),
    HttpStatus = require('http-status'),
    mongoose = require('mongoose');

describe('Categories Routes', function () {

    var db, user, category, req, res;

    before(function (done) {
        //TODO: use callback
        db = connection();

        User.create({ name: 'Iliyan Trifonov' }, function (err, doc) {
            assert.ifError(err);
            assert.ok(doc !== null);

            user = doc;

            Category.create({
                name: 'Sample Category',
                user: doc._id
            }, function (err, cat) {
                assert.ifError(err);
                assert.ok(cat !== null);

                category = cat;

                done();
            });
        });
    });

    after(function () {
        db.close();
    });

    beforeEach(function () {
        req = res = {};
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
            var testCat = { name: 'Test cat ' + (+new Date()) };

            req.body = { name: testCat.name };

            res.status = function (status) {
                assert.strictEqual(status, HttpStatus.OK);
                return this;
            };

            res.json = function (cat) {
                assert.ok(cat);
                assert.strictEqual(cat.name, testCat.name);
                User.find({ category: cat._id }, function (err, user) {
                    assert.ifError(err);
                    assert.ok(user !== null);

                    done();
                });
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
                params : { id: mongoose.Schema.ObjectId() },
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

        it('should return status 500 and a json error object result for a wrong cat id format given', function (done) {
            req = {
                params : { id: 123 },
                user: { id: user._id }
            };

            res.status = function (status) {
                assert.strictEqual(status, HttpStatus.INTERNAL_SERVER_ERROR);
                return this;
            };

            res.json = function (err) {
                assert.strictEqual(err.name, 'CastError');
                assert.strictEqual(err.kind, 'ObjectId');
                assert.strictEqual(err.path, '_id');

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

        it('should not update given a non-existent cat id');
    });

});
