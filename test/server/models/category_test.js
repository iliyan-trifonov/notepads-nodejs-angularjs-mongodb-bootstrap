'use strict';

var Category = require('../../../src/models/category'),
    User = require('../../../src/models/user'),
    assert = require('assert'),
    connection = require('../../db_common');

describe('Category Model', function () {

    var db, testUser, testCats = [];

    before(function (done) {
        //TODO: use callback
        db = connection();
        //add some testing data
        User.create({
            facebookId: +new Date(),
            name: 'Iliyan Trifonov',
            photo: 'photourl'
        }, function (err, user) {
            assert.ifError(err);
            assert.ok(user !== null);

            testUser = user;

            Category.create({
                name: 'Test cat1',
                user: user._id
            }, function (err, category) {
                assert.ifError(err);
                assert.ok(category !== null);

                testCats.push(category);

                Category.create({
                    name: 'Test cat2',
                    user: user._id
                }, function (err, category) {
                    assert.ifError(err);
                    assert.ok(category !== null);

                    testCats.push(category);

                    done();
                });
            });
        });

    });

    after(function (done) {
        Category.remove({}, function () {
            User.remove({}, function () {
                db.close();
                done();
            });
        });
    });

    it('should create and save a new Category', function (done) {
        var cat = {
            name: 'Testcat',
            notepadsCount: 0,
            user: null
        };
        Category.create(cat , function (err, category) {
            assert.ifError(err);
            assert.ok(category !== null);
            assert.ok(category instanceof Category);
            assert.strictEqual(category.name, cat.name);
            assert.strictEqual(category.notepadsCount, cat.notepadsCount);
            assert.strictEqual(category.user, cat.user);
            done();
        });
    });

    describe('getByUserId', function () {
        it('should return categories by uid', function (done) {
            Category.getByUserId(testUser._id, function (err, cats) {
                assert.ifError(err);
                assert.ok(cats !== null);
                assert.ok(cats instanceof Array);
                assert.ok(cats.length === 2);
                assert.strictEqual(cats[0].name, testCats[0].name);
                assert.strictEqual(cats[1].name, testCats[1].name);
                done();
            });
        });
    });

    describe('getByIdForUser', function () {
        it('should return a category id and name by given cat Id and uid', function (done) {
            Category.getByIdForUser(testCats[0]._id, testUser._id, function (err, category) {
                assert.ifError(err);
                assert.ok(category !== null);
                assert.ok(category instanceof Category);
                assert.ok(category._id.equals(testCats[0]._id));
                assert.strictEqual(category.name, testCats[0].name);
                assert.ok(!category.user);
                assert.ok(!category.notepadsCount);
                done();
            });
        });
    });

    describe('increaseNotepadsCountById', function () {
        it('should increase notepadsCount of a cat with 1 given cat id', function (done) {
            Category.increaseNotepadsCountById(testCats[0]._id, function (err, category) {
                assert.ifError(err);
                assert.ok(category !== null);
                assert.ok(category instanceof Category);
                assert.ok(category._id.equals(testCats[0]._id));
                assert.strictEqual(category.notepadsCount, testCats[0].notepadsCount + 1);
                testCats[0] = category;
                done();
            });
        });
    });

    describe('decreaseNotepadsCountById', function () {
        it('should decrease notepadsCount of a cat with 1 given cat id', function (done) {
            Category.decreaseNotepadsCountById(testCats[0]._id, function (err, category) {
                assert.ifError(err);
                assert.ok(category !== null);
                assert.ok(category instanceof Category);
                assert.ok(category._id.equals(testCats[0]._id));
                assert.strictEqual(category.notepadsCount, testCats[0].notepadsCount - 1);
                testCats[0] = category;
                done();
            });
        });
    });

});
