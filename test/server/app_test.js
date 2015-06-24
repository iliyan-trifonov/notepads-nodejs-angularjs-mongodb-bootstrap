'use strict';

let app = require('../../src/app'),
    assert = require('assert'),
    HttpStatus = require('http-status'),
    connection = require('../db_common'),
    co = require('co');

import User from '../../src/models/user';

describe('app', function () {
    it('should have the port set to 3000', function () {
        assert.strictEqual(app.get('port'), 3000);
    });

    describe('parseAccessToken', function () {
        let db, req, res, next;

        before(() => {
            db = connection();
        });

        beforeEach(() => {
            req = { query: { token: null } };
            res = {
                status: function (status) {
                    if (!this.statusExpected) {
                        throw new Error('No statusExpected set!');
                    }
                    assert.strictEqual(status, this.statusExpected);
                    return this;
                },
                send: function (data) {
                    if (!this.sendDataExpected) {
                        throw new Error('No sendDataExpected set!');
                    }
                    assert.strictEqual(data, this.sendDataExpected);
                    if (this.sendCb) {
                        this.sendCb();
                    }
                },
                json: function (data) {
                    if (!this.jsonDataExpected) {
                        throw new Error('No jsonDataExpected set!');
                    }
                    assert.deepEqual(data, this.jsonDataExpected);
                    if (this.jsonCb) {
                        this.jsonCb();
                    }
                }
            };
            next = () => {
                throw new Error('next() not initialized!');
            };
        });

        after(() => {
            db.close();
        });

        it('should return FORBIDDEN for a given but invalid accessToken', done => {
            req.query.token = 'asdasdasdasd';
            res.statusExpected = HttpStatus.FORBIDDEN;
            res.jsonDataExpected = {};
            res.jsonCb = done;

            app.parseAccessToken(req, res, null);
        });

        it('should set req.user by given valid accessToken', done => {
            co(function* () {
                let user = yield User.createAsync({
                    name: 'Iliyan Trifonov',
                    facebookId: +new Date(),
                    photo: 'photourl'
                });

                req.query.token = user.accessToken;
                next = () => {
                    assert.strictEqual(req.user.id, String(user._id));
                    done();
                };

                app.parseAccessToken(req, null, next);
            });
        });

        it('should call next() with missing accessToken', done => {
            next = () => {
                done();
            };

            app.parseAccessToken(req, null, next);
        });
    });
});
