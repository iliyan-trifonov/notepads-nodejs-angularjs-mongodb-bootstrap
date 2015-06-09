'use strict';

var Notepad = require('../../../src/models/notepad'),
    Category = require('../../../src/models/category'),
    User = require('../../../src/models/user'),
    notepadsRouter = require('../../../src/routes/notepads'),
    assert = require('assert'),
    connection = require('../../db_common'),
    Promise = require('bluebird'),
    HttpStatus = require('http-status');

describe('Notepads Routes', function () {

    var db, testUser, testCat, testNotepads, req, res;

    before(function () {
        db = connection();

        return User.createAsync({
            facebookId: +new Date(),
            name: 'Iliyan Trifonov',
            photo: 'photourl'
        }).then(function (user) {
            testUser = user;

            return Category.createAsync({
                name: 'Test category',
                user: testUser
            });
        }).then(function (cat) {
            testCat = cat;

            var notes = [
                {
                    title: 'Test notepad 1',
                    text: 'Test notepad 1 text',
                    category: testCat,
                    user: testUser
                },
                {
                    title: 'Test notepad 2',
                    text: 'Test notepad 2 text',
                    category: testCat,
                    user: testUser
                }
            ];

            return Promise.map(notes, function (note) {
                return Notepad.createAsync(note);
            });
        }).then(function (notepads) {
            testNotepads = notepads;
        });
    });

    beforeEach(function () {
        req = {
            user: {
                id: testUser._id
            }
        };

        res = {
            status: function (status) {
                if (!this.statusExpected) {
                    throw new Error('unconfigured response object!');
                }
                assert.strictEqual(status, this.statusExpected);
                return this;
            },
            json: function (obj) {
                if (!this.jsonChecker) {
                    throw new Error('unconfigured response object!');
                }
                this.jsonChecker(obj);
            }
        };
    });

    after(function (done) {
        db.close();
        done();
    });

    describe('getNotepadsHandler', function () {
        it('should return an error if no valid request params are given', function (done) {
            delete req.user.id;
            res.statusExpected = HttpStatus.FORBIDDEN;
            res.jsonChecker = function (obj) {
                assert.deepEqual(obj, []);
                done();
            };
            notepadsRouter.getNotepadsHandler(req, res);
        });

        it('should return an empty array result if user with no notepads and categories is given', function (done) {
            User.createAsync({
                facebookId: +new Date(),
                name: 'Temp User',
                photo: 'photourl'
            }).then(function (user) {
                req.user.id = user._id;
                res.statusExpected = HttpStatus.OK;
                res.jsonChecker = function (obj) {
                    assert.deepEqual(obj, []);
                    done();
                };
                notepadsRouter.getNotepadsHandler(req, res);
            });
        });

        it('should return only the categories with no notepads if such user is requested', function (done) {
            var cats = [
                { name: 'Test Cat1' },
                { name: 'Test Cat2' }
            ];

            User.createAsync({
                facebookId: +new Date(),
                name: 'Temp User',
                photo: 'photourl'
            }).then(function (user) {
                req.user.id = user._id;
                return Promise.map(cats, function (cat) {
                    return Category.create({
                        name: cat.name,
                        user: user
                    });
                });
            }).then(function (cats) {
                res.statusExpected = HttpStatus.OK;
                res.jsonChecker = function (obj) {
                    assert.strictEqual(obj.length, cats.length);
                    assert.strictEqual(obj[0].name, cats[0].name);
                    assert.strictEqual(obj[1].name, cats[1].name);
                    assert.strictEqual(obj[0].notepads.length, 0);
                    assert.strictEqual(obj[1].notepads.length, 0);
                    done();
                };
                notepadsRouter.getNotepadsHandler(req, res);
            });
        });

        it('should return the categories and notepads for a user', function (done) {
            res.statusExpected = HttpStatus.OK;
            res.jsonChecker = function (obj) {
                console.log('obj', obj);
                //1 category
                assert.strictEqual(obj.length, 1);
                //2 notepads
                assert.strictEqual(obj[0].notepads.length, 2);
                done();
            };
            notepadsRouter.getNotepadsHandler(req, res);
        });
    });

});
