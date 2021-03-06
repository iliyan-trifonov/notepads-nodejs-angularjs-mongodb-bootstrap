'use strict';

var Category = require('../../../src/models/category'),
    assert = require('assert'),
    connection = require('../../db_common'),
    mongoose = require('mongoose');

import User from '../../../src/models/user';

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
        }).then(function (user) {
            assert.notStrictEqual(user, null);

            testUser = user;

            //TODO: create categories in a loop - avoids repeating code
            return Category.create({
                name: 'Test cat1',
                user: user._id
            });
        }).then(function (category) {
            assert.ok(category !== null);

            testCats.push(category);

            return Category.create({
                name: 'Test cat2',
                user: testUser._id
            });
        }).then(function (category) {
            assert.ok(category !== null);

            testCats.push(category);

        }).then(done);

    });

    after(function () {
        return Category.remove({})
            .then(function () {
                return User.remove({});
            })
            .then(function () {
                db.close();
            });
    });

    it('should create and save a new Category', function () {
        var cat = {
            name: 'Test cat',
            user: mongoose.Types.ObjectId()
        };
        return Category.create(cat).then(function (category) {
            assert.ok(category !== null);
            assert.strictEqual(category.name, cat.name);
            assert.strictEqual(category.notepadsCount, 0);
            assert.strictEqual(category.user, cat.user);
        });
    });

    describe('getByUserId', function () {
        it('should return categories by uid', function () {
            return Category.getByUserId(testUser._id).then(function (cats) {
                assert.ok(cats !== null);
                assert.ok(cats instanceof Array);
                assert.ok(cats.length === 2);
                assert.ok(cats[0].name === testCats[0].name || cats[0].name === testCats[1].name);
                assert.ok(cats[1].name === testCats[0].name || cats[1].name === testCats[1].name);
            });
        });
    });

    describe('getByIdForUser', function () {
        it('should return a category id and name by given cat Id and uid', function () {
            return Category.getByIdForUser(testCats[0]._id, testUser._id).then(function (category) {
                assert.ok(category !== null);
                assert.ok(category instanceof Category);
                assert.ok(category._id.equals(testCats[0]._id));
                assert.strictEqual(category.name, testCats[0].name);
                assert.ok(!category.user);
                assert.ok(!category.notepadsCount);
            });
        });
    });

    describe('increaseNotepadsCountById', function () {
        it('should increase notepadsCount of a cat with 1 given cat id', function () {
            return Category.increaseNotepadsCountById(testCats[0]._id)
                .then(function (category) {
                    assert.ok(category !== null);
                    assert.ok(category._id.equals(testCats[0]._id));
                    assert.strictEqual(category.notepadsCount, testCats[0].notepadsCount + 1);
                    testCats[0] = category;
                });
        });
    });

    describe('decreaseNotepadsCountById', function () {
        it('should decrease notepadsCount of a cat with 1 given cat id', function () {
            return Category.decreaseNotepadsCountById(testCats[0]._id).then(function (category) {
                assert.ok(category !== null);
                assert.ok(category instanceof Category);
                assert.ok(category._id.equals(testCats[0]._id));
                assert.strictEqual(category.notepadsCount, testCats[0].notepadsCount - 1);
                testCats[0] = category;
            });
        });
    });

});
