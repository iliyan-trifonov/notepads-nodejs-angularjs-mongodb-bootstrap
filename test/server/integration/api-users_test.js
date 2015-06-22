'use strict';

var request = require('supertest'),
    app = require('../../../src/app'),
    HttpStatus = require('http-status'),
    config,
    connection = require('../../db_common'),
    assert = require('assert'),
    graph = require('fbgraph'),
    Promise = require('bluebird'),
    co = require('co');

import User from '../../../src/models/user';

Promise.promisify(graph.get);

if (!graph.getAsync) {
    graph.getAsync = Promise.promisify(graph.get);
}

try {
    config = require('../../../config/app.conf.json');
} catch (err) {
    config = require('../../../config/testing.json');
}

describe('API /users', function () {

    var db, testUser;

    before(() => {
        return co(function* () {
            db = connection();

            testUser = yield User.createAsync({
                'facebookId': +new Date(),
                'name': 'Iliyan Trifonov',
                'photo': 'photourl'
            });

            //if configuration is provided, enable tests that require real FB user id and access token:
            if (config.facebook.app.id && config.facebook.app.secret) {
                console.log('using facebook app id and secret', config.facebook.app.id, config.facebook.app.secret);
                try {
                    let result = yield graph.getAsync([
                        '/',
                        config.facebook.app.id,
                        '/accounts/test-users?access_token=',
                        config.facebook.app.id,
                        '|',
                        config.facebook.app.secret
                    ].join(''));

                    console.log('result', result);
                    if (result && result.data && result.data.length > 0) {
                        config.testFBUser.fbId = result.data[0].id;
                        config.testFBUser.fbAccessToken = result.data[0].access_token;
                    }
                } catch (err) {/**/}
            }
        });
    });

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

        it('should return FORBIDDEN for a non-existent accessToken', function (done) {
            request(app)
                .post(url)
                .send({ accessToken: +new Date() })
                .expect('Content-Type', /json/)
                .expect(HttpStatus.FORBIDDEN, done);
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

        it('should return FORBIDDEN if FB user is found but has different id', function (done) {
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
                .expect(HttpStatus.FORBIDDEN, done);
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
                    .expect(HttpStatus.OK)
                    .end(function (err, result) {
                        assert.ifError(err);
                        assert.ok(result.body.accessToken);
                        done();
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
