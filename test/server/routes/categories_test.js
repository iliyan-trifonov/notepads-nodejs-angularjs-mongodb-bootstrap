'use strict';

var categoriesRouter = require('../../../src/routes/categories'),
    assert = require('assert'),
    connection = require('../../db_common'),
    User = require('../../../src/models/user'),
    Category = require('../../../src/models/category'),
    HttpStatus = require('http-status');

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
    });

    describe('GET /categories', function () {
        it('should return status 200 and response type json with categories body', function (done) {
            req.user = user;

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

});
