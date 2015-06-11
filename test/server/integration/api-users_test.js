'use strict';

var request = require('supertest'),
    app = require('../../../src/app'),
    HttpStatus = require('http-status'),
    config,
    connection = require('../../db_common'),
    User = require('../../../src/models/user'),
    assert = require('assert');

try {
    config = require('../../../config/app.conf.json');
} catch (err) {
    config = require('../../../config/testing.json');
}

describe('API /users', function () {

    var db, testUser;

    before(function () {
        db = connection();

        return User.createAsync({
            'facebookId': +new Date(),
            'name': 'Iliyan Trifonov',
            'photo': 'photourl'
        }).then(function (user) {
            testUser = user;
        });
    });

    after(function () {
        db.close();
    });

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

        //these tests pass only with a given test fb user - private CI or locally
        if (config.testFBUser && config.testFBUser.fbId) {
            /*
             it('should return FORBIDDEN if no FB user is found by the given fbAccessToken', function (done) {
             var wrongToken = 'we need a valid FB token that could not find a user';
             request(app)
             .post(url)
             .send({
             fbId: config.testFBUser.fbId,
             fbAccessToken: wrongToken
             })
             .expect('Content-Type', /json/)
             .expect(HttpStatus.FORBIDDEN, done);
             });
             */

            it('should return FORBIDDEN if FB user is found but has different id', function (done) {
                request(app)
                    .post(url)
                    .send({
                        fbId: +new Date(),
                        fbAccessToken: config.testFBUser.fbAccessToken
                    })
                    .expect('Content-Type', /json/)
                    .expect(HttpStatus.FORBIDDEN, done);
            });

            it('should return a valid accessToken if FB user is found in DB', function (done) {
                User.createAsync({
                    name: 'Iliyan Trifonov',
                    facebookId: config.testFBUser.fbId,
                    photo: 'photourl'
                }).then(function (user) {
                    request(app)
                        .post(url)
                        .send({
                            fbId: config.testFBUser.fbId,
                            fbAccessToken: config.testFBUser.fbAccessToken
                        })
                        .expect('Content-Type', /json/)
                        .expect(HttpStatus.OK)
                        .end(function (err, res) {
                            assert.ifError(err);
                            assert.strictEqual(res.body.accessToken, user.accessToken);
                            done();
                        });
                });
            });

            //TODO: check for the prepopulated cat and notepad here too:
            it('should return a valid accessToken if FB user is created by the given fbAccessToken', function (done) {
                User.removeAsync({
                    facebookId: config.testFBUser.fbId
                }).then(function () {
                    request(app)
                        .post(url)
                        .send({
                            fbId: config.testFBUser.fbId,
                            fbAccessToken: config.testFBUser.fbAccessToken
                        })
                        .expect('Content-Type', /json/)
                        .expect(HttpStatus.OK, done);
                });
            });
        }
    });
});
