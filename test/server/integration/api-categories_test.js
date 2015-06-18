'use strict';

var request = require('supertest'),
    app = require('../../../src/app'),
    HttpStatus = require('http-status'),
    config,
    connection = require('../../db_common'),
    User = require('../../../src/models/user'),
    Category = require('../../../src/models/category'),
    assert = require('assert'),
    co = require('co');

try {
    config = require('../../../config/app.conf.json');
} catch (err) {
    config = require('../../../config/testing.json');
}

describe('API /categories', () => {

    let db, testUser, testCat, testNotepads;
    let url = config.apiBase + '/categories';

    let callUrl = (options) => {
        let opts = options || {};
        let addUrlPart = opts.addUrl || '';
        let reqMethod = opts.method ? opts.method.toLowerCase() : null;
        let req = request(app);
        if (!reqMethod || !(reqMethod in req)) {
            reqMethod = 'get';
        }
        let r = req[reqMethod];
        let accessToken = opts.token || testUser.accessToken;
        let urlFinal = `${url}${addUrlPart}?token=${accessToken}`;
        console.log(`callUrl urlFinal = ${urlFinal}`);
        return r(urlFinal);
    };

    before(() => {
        db = connection();

        return User.createAsync({
            'facebookId': +new Date(),
            'name': 'Iliyan Trifonov',
            'photo': 'photourl'
        }).then(user => {
            testUser = user;
        });
    });

    after(() => {
        db.close();
    });

    describe('GET /categories', () => {
        it('should return status OK and an empty JSON array when the user has no categories', done => {
            co(function* () {
                let user = yield User.createAsync({
                    name: 'Iliyan Trifonov',
                    facebookId: +new Date(),
                    photo: 'photourl'
                });

                callUrl({ token: user.accessToken })
                    .expect('Content-Type', /json/)
                    .expect(HttpStatus.OK)
                    .end((err, res) => {
                        assert.ifError(err);
                        assert.deepEqual(res.body, []);
                        done();
                    });
            });
        });
    });

});
