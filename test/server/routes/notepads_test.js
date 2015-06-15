'use strict';

var Notepad = require('../../../src/models/notepad'),
    Category = require('../../../src/models/category'),
    User = require('../../../src/models/user'),
    notepadsRouter = require('../../../src/routes/notepads'),
    assert = require('assert'),
    connection = require('../../db_common'),
    mongoose = require('mongoose'),
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

    describe('checkAuth', function () {
        it('should return UNAUTHORIZED when user is not authenticated', function () {
            req.isAuthenticated = function () {
                return false;
            };
            var oldConsoleError = console.error;
            console.error = function (msg) {
                assert.strictEqual(msg, 'API notepads: checkAuth(), not authenticated!');
                console.error = oldConsoleError;
            };
            res.statusExpected = HttpStatus.UNAUTHORIZED;
            res.jsonChecker = function (obj) {
                assert.deepEqual(obj, {});
            };
            notepadsRouter.checkAuth(req, res);
        });

        it('should call next if user is authenticated', function (done) {
            req.isAuthenticated = function () {
                return true;
            };
            var next = function () {
                assert.strictEqual(arguments.length, 0);
                done();
            };
            notepadsRouter.checkAuth(req, res, next);
        });
    });

    describe('insidecatsFromQueryString', function () {
        it('should add req.params.insidecats if existing in req.query.insidecats', function (done) {
            req.query = { insidecats: 1 };
            var next = function () {
                assert.strictEqual(arguments.length, 0);
                assert.strictEqual(req.params.insidecats, "1");
                done();
            };
            notepadsRouter.insidecatsFromQueryString()(req, res, next);
        });
        it('should call next(route) if req.query.insidecats is not set', function (done) {
            req.query = {};
            var next = function () {
                assert.strictEqual(arguments.length, 1);
                assert.strictEqual(arguments[0], "route");
                done();
            };
            notepadsRouter.insidecatsFromQueryString()(req, res, next);
        });
    });

    describe('getNotepadsHandler', function () {
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
                    return Category.createAsync({
                        name: cat.name,
                        user: user
                    });
                });
            }).then(function (cats) {
                res.statusExpected = HttpStatus.OK;
                res.jsonChecker = function (obj) {
                    //TODO: change the checks to not depend on the order of the results: [0]/[1]/etc.
                    assert.strictEqual(obj.length, cats.length);
                    assert.ok(obj[0].name === cats[0].name || obj[0].name === cats[1].name);
                    assert.ok(obj[1].name === cats[0].name || obj[1].name === cats[1].name);
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

    describe('getNotepadByIdHandler', function () {
        it('should return NO_CONTENT if no notepad is found', function (done) {
            req.params = {};
            res.execDone = false;
            res.statusExpected = HttpStatus.NO_CONTENT;
            res.jsonChecker = function (obj) {
                assert.deepEqual(obj, {});
                //allow a second call before done
                if (!res.execDone) {
                    res.execDone = true;
                } else {
                    done();
                }
            };
            notepadsRouter.getNotepadByIdHandler(req, res);

            //second call
            req.params.id = mongoose.Types.ObjectId();
            notepadsRouter.getNotepadByIdHandler(req, res);
        });

        it('should return a notepad given a valid existing notepad and user id', function (done) {
            req.params = { id: testNotepads[0]._id };
            req.user = { id: testUser._id };
            res.statusExpected = HttpStatus.OK;
            res.jsonChecker = function (obj) {
                assert.ok(obj._id.equals(testNotepads[0]._id));
                done();
            };
            notepadsRouter.getNotepadByIdHandler(req, res);
        });
    });

    describe('postNotepadsHandler', function () {
        it('should return NO_CONTENT when the category given is not found', function (done) {
            req.body = { category: mongoose.Types.ObjectId() };
            req.user = { id: testUser._id };
            res.statusExpected = HttpStatus.NO_CONTENT;
            res.jsonChecker = function (obj) {
                assert.deepEqual(obj, {});
                done();
            };
            notepadsRouter.postNotepadsHandler(req, res);
        });

        //TODO: convert this to BAD_REQUEST with added checking for the required params
        it('should return INTERNAL SERVER ERROR when there is an error in Notepad.createAsync (like not enough of the required params)', function (done) {
            req.body = { category: testCat._id };
            req.user = { id: testUser._id };
            res.statusExpected = HttpStatus.INTERNAL_SERVER_ERROR;
            res.jsonChecker = function (obj) {
                assert.deepEqual(obj, {});
                done();
            };
            notepadsRouter.postNotepadsHandler(req, res);
        });

        it('should return the created notepad and the User and Category should be with updated params', function (done) {
            req.body = {
                category: testCat._id,
                title: 'Test title',
                text: 'Test text'
            };
            req.user = { id: testUser._id };
            res.statusExpected = HttpStatus.OK;
            res.jsonChecker = function (obj) {
                assert.ok(obj);
                assert.strictEqual(obj.user, req.user.id);
                assert.strictEqual(obj.category, req.body.category);
                assert.strictEqual(obj.title, req.body.title);
                assert.strictEqual(obj.text, req.body.text);

                Category.findOneAsync(testCat._id).then(function (cat) {
                    assert.strictEqual(cat.notepadsCount, testCat.notepadsCount + 1);
                    testCat = cat;

                    return User.findOneAsync(testUser._id);
                }).then(function (user) {
                    assert.strictEqual(user.notepads.length, testUser.notepads.length + 1);
                    testUser = user;
                }).then(done);
            };
            notepadsRouter.postNotepadsHandler(req, res);
        });
    });

});
