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

    var db, testUser, testCat, testNotepads = [], req, res;

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
                    category: testCat._id,
                    user: testUser._id
                },
                {
                    title: 'Test notepad 2',
                    text: 'Test notepad 2 text',
                    category: testCat._id,
                    user: testUser._id
                }
            ];

            return Promise.map(notes, function (note) {
                return Notepad.createAsync(note).then(function (doc) {
                    testNotepads.push(doc);
                    return Promise.join(
                        Category.increaseNotepadsCountById({_id: doc.category}),
                        User.addNotepad(testUser._id, testNotepads[testNotepads.length - 1]._id),
                        function (cat, user) {
                            testCat = cat;
                            testUser = user;
                        }
                    );
                });
            });
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
                title: 'Test title',
                text: 'Test text',
                category: testCat._id
            };
            req.user = { id: testUser._id };
            res.statusExpected = HttpStatus.OK;
            res.jsonChecker = function (obj) {
                assert.ok(obj);
                assert.strictEqual(obj.user, req.user.id);
                assert.strictEqual(obj.category, req.body.category);
                assert.strictEqual(obj.title, req.body.title);
                assert.strictEqual(obj.text, req.body.text);

                testNotepads.push(obj);

                Category.findOneAsync({ _id: testCat._id }).then(function (cat) {
                    assert.strictEqual(cat.notepadsCount, testCat.notepadsCount + 1);
                    testCat = cat;

                    return User.findOneAsync({ _id: testUser._id, notepads: obj._id });
                }).then(function (user) {
                    assert.strictEqual(user.notepads.length, testUser.notepads.length + 1);
                    testUser = user;
                }).then(done);
            };
            notepadsRouter.postNotepadsHandler(req, res);
        });
    });

    describe('putNotepadsIdHandler', function () {
        it('should return BAD_REQUEST when a required param is not given', function (done) {
            var paramsToCheck = 4;
            req.params = {};
            req.body = {};
            res.statusExpected = HttpStatus.BAD_REQUEST;
            res.jsonChecker = function (obj) {
                assert.deepEqual(obj, {});
                if (--paramsToCheck === 0) {
                    done();
                }
            };

            notepadsRouter.putNotepadsIdHandler(req, res);

            req.params.id = testNotepads._id;
            notepadsRouter.putNotepadsIdHandler(req, res);

            req.body.title = 'Test notepad';
            notepadsRouter.putNotepadsIdHandler(req, res);

            req.body.text = 'Test text';
            notepadsRouter.putNotepadsIdHandler(req, res);
        });

        it('should return NO_CONTENT when the given notepad id is not found', function (done) {
            req.params = { id: mongoose.Types.ObjectId() };
            req.user = { id: testUser._id };
            req.body = {
                title: 'test',
                text: 'test',
                category: testCat._id
            };
            res.statusExpected = HttpStatus.NO_CONTENT;
            res.jsonChecker = function (obj) {
                assert.deepEqual(obj, {});
                done();
            };

            notepadsRouter.putNotepadsIdHandler(req, res);
        });

        it('should return the updated Notepad object', function (done) {
            req.params = { id: testNotepads[0]._id };
            req.user = { id: testUser._id };
            req.body = {
                title: 'test',
                text: 'test',
                category: testCat._id
            };
            res.statusExpected = HttpStatus.OK;
            res.jsonChecker = function (obj) {
                assert.ok(obj);
                assert.notDeepEqual(obj, {});
                assert.strictEqual(obj.title, req.body.title);
                assert.strictEqual(obj.text, req.body.text);
                assert.ok(obj.category.equals(req.body.category));
                assert.ok(obj.user.equals(req.user.id));
                testNotepads[0] = obj;
                done();
            };

            notepadsRouter.putNotepadsIdHandler(req, res);
        });

        it('should return the updated Notepad object + category change', done => {
            var cat, notepad;
            req.user = { id: testUser._id };
            //create a new cat
            Category.createAsync({
                name: 'Test cat 2',
                user: testUser
            }).then(function (doc) {
                cat = doc;
                //create a new notepad for that cat
                return Notepad.createAsync({
                    title: 'Temp notepad',
                    text: 'Temp text',
                    category: cat._id,
                    user: testUser._id
                });
            }).then(function (doc) {
                notepad = doc;
                req.params = {id: notepad._id};
                //add the new notepad to the user
                return User.addNotepad(testUser._id, notepad._id);
            }).then(function (user) {
                testUser = user;
                //increase the notepadsCount for the category
                return Category.increaseNotepadsCountById({_id: cat._id});
            }).then(function (doc) {
                cat = doc;
                assert.strictEqual(cat.notepadsCount, 1);
                req.body = {
                    title: 'test',
                    text: 'test',
                    category: testCat._id
                };
                res.statusExpected = HttpStatus.OK;
                res.jsonChecker = function (obj) {
                    assert.ok(obj);
                    assert.notDeepEqual(obj, {});
                    assert.strictEqual(obj.title, req.body.title);
                    assert.strictEqual(obj.text, req.body.text);
                    assert.ok(obj.category.equals(testCat._id));
                    assert.ok(obj.user.equals(req.user.id));

                    //add the new notepad to the testing ones
                    testNotepads.push(obj);

                    Category.findOneAsync({
                        _id: cat._id
                    }).then(function (cat) {
                        assert.strictEqual(cat.notepadsCount, 0);
                        return Category.findOneAsync({ _id: testCat._id });
                    }).then(function (cat) {
                        testCat = cat;
                        assert.strictEqual(testCat.notepadsCount, testNotepads.length);
                    }).then(done);
                };

                assert.strictEqual(testCat.notepadsCount, testNotepads.length);

                notepadsRouter.putNotepadsIdHandler(req, res);
            });
        });

    });

    describe('deleteNotepadsIdHandler', function () {
        it('should return NO_CONTENT if the Notepad is not found by the given params', done => {
            req.params = req.user = {};
            res.statusExpected = HttpStatus.NO_CONTENT;
            res.jsonChecker = function (obj) {
                assert.deepEqual(obj, {});
                done();
            };
            notepadsRouter.deleteNotepadsIdHandler(req, res);
        });

        it('should delete the notepad, update the entries in User and Category and return the deleted notepad object', done => {
            console.log('testUser.notepads.length', testUser.notepads.length);
            var note = testNotepads[testNotepads.length - 1];
            req.params = { id: note._id };
            req.user = { id: testUser._id };
            res.statusExpected = HttpStatus.OK;

            User.findOneAsync({ _id: testUser._id }).then(function (user) {
                console.log('user before test', user);
            }).then(function () {
                res.jsonChecker = function (obj) {
                    assert.ok(obj);
                    assert.notDeepEqual(obj, {});
                    assert.ok(obj._id.equals(note._id));
                    assert.strictEqual(obj.title, note.title);

                    Category.findOneAsync({ _id: note.category })
                        .then(cat => {
                            assert.strictEqual(cat.notepadsCount, testCat.notepadsCount - 1);
                            testCat = cat;
                            testNotepads.pop();
                            return User.findOneAsync({ _id: note.user });
                        })
                        .then(user => {
                            console.log('updated user.notepads.length', user.notepads.length);
                            assert.strictEqual(user.notepads.length, testUser.notepads.length - 1);
                            testUser = user;
                        }).then(done);
                };
                notepadsRouter.deleteNotepadsIdHandler(req, res);
            });
        });
    });

});
