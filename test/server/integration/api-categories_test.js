'use strict';

var request = require('supertest'),
    app = require('../../../src/app'),
    HttpStatus = require('http-status'),
    config,
    connection = require('../../db_common'),
    Category = require('../../../src/models/category'),
    Notepad = require('../../../src/models/notepad'),
    assert = require('assert'),
    co = require('co');

import User from '../../../src/models/user';

try {
    config = require('../../../config/app.conf.json');
} catch (err) {
    config = require('../../../config/testing.json');
}

describe('API /categories', () => {

    let db, testUser, testCat, testNotepad;
    //set the main categories url
    let url = config.apiBase + '/categories';

    //helper function to make the request and to make the testing code more dry
    let callUrl = (options = {}) => {
        let addUrlPart = options.addUrl || '';
        let reqMethod = options.method ? options.method.toLowerCase() : null;
        let req = request(app);
        if (!reqMethod || !(reqMethod in req)) {
            reqMethod = 'get';
        }
        let r = req[reqMethod];
        let accessToken = options.token || testUser.accessToken;
        let urlFinal = `${url}${addUrlPart}?token=${accessToken}`;
        console.info(`callUrl urlFinal = ${urlFinal}`);
        return r(urlFinal);
    };

    before(() => {
        return co(function* () {
            db = connection();

            testUser = yield User.createAsync({
                'facebookId': +new Date(),
                'name': 'Iliyan Trifonov',
                'photo': 'photourl'
            });

            testCat = yield Category.createAsync({
                name: 'Test category',
                user: testUser._id
            });

            testNotepad = yield Notepad.createAsync({
                title: 'Test notepad',
                text: 'Test notepad text',
                category: testCat._id,
                user: testUser._id
            });

        });
    });

    after(() => {
        db.close();
    });

    describe('GET /categories', () => {
        it('should return status OK and an empty JSON array when the user has no categories', done => {
            return co(function* () {
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
