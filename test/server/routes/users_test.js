'use strict';

import User from '../../../src/models/user';
import assert from 'assert';
import connection from '../../db_common';
import HttpStatus from 'http-status';
import Promise from 'bluebird';
import proxyquire from 'proxyquire';
import co from 'co';
let usersRouter;

describe('Users Routes', function () {

    var db, testUser, fbgraphMock, notepadsUtilsMock;

    before(function () {
        //TODO: use callback/promise
        db = connection();

        fbgraphMock = {
            user: {},
            setAppSecret: function (secret) {
                assert.ok(secret);
            },
            setAccessToken: function (token) {
                assert.ok(token);
            },
            getAsync: function (optionsStr) {
                assert.ok(optionsStr);
                return Promise.resolve(this.user);
            }
        };

        notepadsUtilsMock = {
            prepopulate: function (uid) {
                return co(function* () {
                    assert.ok(uid);
                    return {
                        user: yield User.findById(uid).exec(),
                        category: {},
                        notepad: {}
                    };
                });
            }
        };

        usersRouter = proxyquire('../../../src/routes/users', {
            'fbgraph': fbgraphMock,
            '../notepadsUtils': notepadsUtilsMock
        });

        return User.create({
            name: 'Iliyan Trifonov',
            photo: 'photourl',
            facebookId: +new Date()
        }).then(function (user) {
            testUser = user;
        });
    });

    beforeEach(function () {
        usersRouter.setAppConfig({
            facebook: {
                app: {
                    secret : 'secret'
                }
            }
        });
    });

    after(function () {
        return User.remove({})
            //TODO: try .then(db...bind(db)) instead:
            .then(function () {
                db.close();
            });
    });

    describe('setAppConfig', function () {
        it('should set the given config', function () {
            var config = { test: '', test2: 'asd asd asd' };
            usersRouter.setAppConfig(config);
            assert.deepEqual(usersRouter.getAppConfig(), config);
        });
    });

    describe('postAuthHandler', function () {
        it('should return BAD REQUEST with not enough params given', function (done) {
            var req = {
                body: {
                    fbId: '',
                    fbAccessToken: '',
                    accessToken: ''
                }
            };

            var res = {
                status: function status (stat) {
                    assert.strictEqual(stat, HttpStatus.BAD_REQUEST);
                    return this;
                },
                json: function json (data) {
                    assert.deepEqual(data, {});
                    done();
                }
            };

            usersRouter.postAuthHandler(req, res);
        });

        it('it should return UNAUTHORIZED for non-existent accessToken', function (done) {
            try {
                var req = {
                    body: {
                        fbId: +new Date(),
                        fbAccessToken: +new Date() + 1,
                        accessToken: '0a9s7d0as97d0asd0as7d09'
                    }
                };

                var res = {
                    status: function status (stat) {
                        assert.strictEqual(stat, HttpStatus.UNAUTHORIZED);
                        return this;
                    },
                    json: function json (data) {
                        assert.deepEqual(data, {});
                        done();
                    }
                };

                usersRouter.postAuthHandler(req, res);
            } catch(err) {
                done(err);
            }
        });

        it('should return UNAUTHORIZED for wrong fbAccessToken', function (done) {
            try {
                var req = {
                    body: {
                        fbId: +new Date(),
                        fbAccessToken: +new Date() + 1,
                        accessToken: ''
                    }
                };

                var res = {
                    status: function status (stat) {
                        assert.strictEqual(stat, HttpStatus.UNAUTHORIZED);
                        return this;
                    },
                    json: function json (data) {
                        assert.deepEqual(data, {});
                        done();
                    }
                };

                //return invalid user from fbgraph
                fbgraphMock.user = {};

                usersRouter.postAuthHandler(req, res);
            } catch(err) {
                done(err);
            }
        });

        it('should return a valid user for an existing accessToken', function (done) {
            var req = {
                body: {
                    fbId: +new Date(),
                    fbAccessToken: '',
                    accessToken: testUser.accessToken
                }
            };

            var res = {
                status: function status (stat) {
                    assert.strictEqual(stat, HttpStatus.OK);
                    return this;
                },
                json: function json (user) {
                    assert.notStrictEqual(user, null);
                    assert.notDeepEqual(user, {});
                    assert.ok(user._id.equals(testUser._id));
                    done();
                }
            };

            usersRouter.postAuthHandler(req, res);
        });

        it('should return a valid accessToken given an existing fbAccessToken', function (done) {
            var req = {
                body: {
                    fbId: testUser.facebookId,
                    fbAccessToken: +new Date(),
                    accessToken: ''
                }
            };

            var res = {
                status: function status (stat) {
                    assert.strictEqual(stat, HttpStatus.OK);
                    return this;
                },
                json: function json (data) {
                    assert.ok(data.accessToken);
                    assert.strictEqual(data.accessToken, testUser.accessToken);
                    done();
                }
            };

            fbgraphMock.user = { id: testUser.facebookId };

            usersRouter.postAuthHandler(req, res);
        });

        it('should create a new user and call prepopulate() given valid fbAccessToken for non-existent user', function (done) {
            let testUsername = 'Test user';
            var req = {
                body: {
                    fbId: +new Date(),
                    fbAccessToken: +new Date() + 1,
                    accessToken: ''
                }
            };

            var res = {
                status: function (stat) {
                    assert.strictEqual(stat, HttpStatus.CREATED);
                    return this;
                },
                json: data => {
                    co(function* () {
                        assert.ok(data.accessToken);

                        let user = yield User.findOne({ accessToken: data.accessToken }).exec();
                        assert.strictEqual(String(user.facebookId), String(req.body.fbId));
                        assert.strictEqual(user.name, testUsername);

                        done();
                    }).catch(done);
                }
            };

            fbgraphMock.user = {
                id: req.body.fbId,
                name: testUsername,
                picture: {
                    data: {
                        url: 'photourl'
                    }
                }
            };

            usersRouter.postAuthHandler(req, res);
        });

        it('should return INTERNAL_SERVER_ERROR when there was an error getting the user from DB', done => {
            let req = {
                body: {
                    accessToken: 'asdasdasd'
                }
            };

            let UserMock = {
                getByAccessToken: function (token) {
                    assert.strictEqual(token, req.body.accessToken);
                    return Promise.reject(new Error('Let\'s error!'));
                }
            };

            let usersRouterWithMocks = proxyquire('../../../src/routes/users', {
                '../models/user': UserMock
            });

            let res = {
                status: function (status) {
                    assert.strictEqual(status, HttpStatus.INTERNAL_SERVER_ERROR);
                    return this;
                },
                json: function (obj) {
                    assert.deepEqual(obj, {});
                    done();
                }
            };

            usersRouterWithMocks.postAuthHandler(req, res);
        });

        it('should return INTERNAL_SERVER_ERROR on graph or prepopulate error', done => {
            var req = {
                body: {
                    fbId: testUser.facebookId,
                    fbAccessToken: +new Date(),
                    accessToken: ''
                }
            };

            let oldAsync = fbgraphMock.getAsync;

            //override getAsync temporarily
            fbgraphMock.getAsync = function (reqStr) {
                assert.ok(reqStr);
                return Promise.reject(new Error('error from graph.getAsync()'));
            };

            var res = {
                status: function status (stat) {
                    assert.strictEqual(stat, HttpStatus.INTERNAL_SERVER_ERROR);
                    return this;
                },
                json: function json (data) {
                    assert.deepEqual(data, {});
                    //restore the original function
                    fbgraphMock.getAsync = oldAsync;
                    done();
                }
            };

            usersRouter.postAuthHandler(req, res);
        });
    });

});
