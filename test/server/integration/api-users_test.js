'use strict';

import User from '../../../src/models/user';
import Category from '../../../src/models/category';
import Notepad from '../../../src/models/notepad';
import { loadConfig } from './helper-functions';

let request = require('supertest'),
    app = require('../../../src/app'),
    HttpStatus = require('http-status'),
    connection = require('../../db_common'),
    assert = require('assert'),
    graph = require('fbgraph'),
    Promise = require('bluebird'),
    co = require('co');

Promise.promisify(graph.get);

if (!graph.getAsync) {
    graph.getAsync = Promise.promisify(graph.get);
}

let config = loadConfig();

describe('API /users', function () {

    var db, testUser;

    before(() =>
        co(function* () {
            db = connection();

            testUser = yield User.createAsync({
                'facebookId': +new Date(),
                'name': 'Iliyan Trifonov',
                'photo': 'photourl'
            });

            //if configuration is provided, enable tests that require real FB user id and access token:
            if (config.facebook.app.id && config.facebook.app.secret) {
                try {
                    let result = yield graph.getAsync([
                        '/',
                        config.facebook.app.id,
                        '/accounts/test-users?access_token=',
                        config.facebook.app.id,
                        '|',
                        config.facebook.app.secret
                    ].join(''));

                    if (result && result.data && result.data.length > 0) {
                        config.testFBUser.fbId = result.data[0].id;
                        config.testFBUser.fbAccessToken = result.data[0].access_token;
                    }
                } catch (err) {/**/}
            }
        })
    );

    after(() => db.close());

    describe('/auth', function () {

        var url = config.apiBase + '/users/auth';

        it('should return BAD_REQUEST if no params are given', function (done) {
            request(app)
                .post(url)
                .expect('Content-Type', /json/)
                .expect(HttpStatus.BAD_REQUEST, done);
        });

        it('should return BAD_REQUEST if fbId is given but not fbAccessToken', function (done) {
            request(app)
                .post(url)
                .send({ fbId: +new Date() })
                .expect('Content-Type', /json/)
                .expect(HttpStatus.BAD_REQUEST, done);
        });

        it('should return BAD_REQUEST if fbAccessToken is given but not fbId', function (done) {
            request(app)
                .post(url)
                .send({ fbAccessToken: +new Date() })
                .expect('Content-Type', /json/)
                .expect(HttpStatus.BAD_REQUEST, done);
        });

        it('should return UNAUTHORIZED for a non-existent accessToken', function (done) {
            request(app)
                .post(url)
                .send({ accessToken: +new Date() })
                .expect('Content-Type', /json/)
                .expect(HttpStatus.UNAUTHORIZED, done);
        });

        it('should return a user for an existing accessToken', function (done) {
            request(app)
                .post(url)
                .send({ accessToken: testUser.accessToken })
                .expect('Content-Type', /json/)
                .expect(HttpStatus.OK)
                .end(function (err, res) {
                    assert.ifError(err);
                    assert.strictEqual(res.body._id, testUser._id.toString());
                    assert.strictEqual(res.body.accessToken, testUser.accessToken);
                    done();
                });
        });

////////these tests pass only with a given real test fb user - test on private CI or locally://////////////////////////

        it('should return UNAUTHORIZED if FB user is found but has different id', function (done) {
            if (!config.testFBUser || !config.testFBUser.fbAccessToken) {
                this.skip();
            }

            request(app)
                .post(url)
                .send({
                    fbId: +new Date(),
                    fbAccessToken: config.testFBUser.fbAccessToken
                })
                .expect('Content-Type', /json/)
                .expect(HttpStatus.UNAUTHORIZED, done);
        });

        //TODO: check for the prepopulated cat and notepad here too:
        it('should return a valid accessToken if FB user is created by the given fbAccessToken', function (done) {
            if (!config.testFBUser || !config.testFBUser.fbAccessToken) {
                this.skip();
            }

            //remove the user if exists
            User.removeAsync({
                facebookId: config.testFBUser.fbId
            }).then(() => {
                request(app)
                    .post(url)
                    .send({
                        fbId: config.testFBUser.fbId,
                        fbAccessToken: config.testFBUser.fbAccessToken
                    })
                    .expect('Content-Type', /json/)
                    .expect(HttpStatus.CREATED)
                    .end(function (err, result) {
                        co(function* () {
                            if (err) {
                                return done(err);
                            }
                            assert.ok(result.body.accessToken);

                            //check the data inserted by prepopulate():

                            let user = yield User.findOneAsync({ accessToken: result.body.accessToken });
                            assert.strictEqual(String(user.facebookId), String(config.testFBUser.fbId));
                            assert.strictEqual(user.categories.length, 1);
                            assert.strictEqual(user.notepads.length, 1);

                            let cat = yield Category.findByIdAsync(user.categories[0].toString());
                            assert.ok(cat._id.equals(user.categories[0]));
                            assert.strictEqual(cat.notepadsCount, 1);
                            assert.strictEqual(cat.name, 'Sample category');

                            let notepad = yield Notepad.findByIdAsync(user.notepads[0]);
                            assert.ok(notepad._id.equals(user.notepads[0]));
                            assert.ok(notepad.category.equals(cat._id));
                            assert.strictEqual(notepad.title, 'Read me');
                            assert.ok(notepad.text.startsWith('Use the menu on the top left to create your own categories'));

                            done();
                        }).catch(done);
                    });
            });
        });

        it('should return a valid accessToken if FB user is found in DB', function (done) {
            if (!config.testFBUser || !config.testFBUser.fbAccessToken) {
                this.skip();
            }

            //the user should be created by the previous test
            User.findOneAsync({
                facebookId: config.testFBUser.fbId
            }).then(user => {
                assert.ok(user);
                assert.ok(user.accessToken);

                request(app)
                    .post(url)
                    .send({
                        fbId: config.testFBUser.fbId,
                        fbAccessToken: config.testFBUser.fbAccessToken
                    })
                    .expect('Content-Type', /json/)
                    .expect(HttpStatus.OK)
                    .end((err, res) => {
                        assert.ifError(err);
                        assert.strictEqual(res.body.accessToken, user.accessToken);
                        done();
                    });
            });
        });

///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    });
});
