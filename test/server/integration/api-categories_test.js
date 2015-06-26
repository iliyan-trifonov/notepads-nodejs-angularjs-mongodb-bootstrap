'use strict';

import request from 'supertest';
import app from '../../../src/app';
import HttpStatus from 'http-status';
import connection from '../../db_common';
import User from '../../../src/models/user';
import Category from '../../../src/models/category';
import Notepad from '../../../src/models/notepad';
import assert from 'assert';
import co from 'co';
let config;

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

            //assign the notepad to cat and user
            testCat = yield Category.increaseNotepadsCountById(testCat._id);
            testUser = yield User.addNotepad(testUser._id, testNotepad._id);

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
            }).catch(done);
        });

        it('should return status OK and a JSON array with 1 cat that has 1 notepad assigned', done => {
            callUrl({ token: testUser.accessToken })
                .expect('Content-Type', /json/)
                .expect(HttpStatus.OK)
                .end((err, res) => {
                    assert.ifError(err); //or return done(err) on error
                    let cats = res.body;
                    assert.strictEqual(cats.length, 1);
                    assert.strictEqual(cats[0].notepadsCount, 1);
                    done();
                });
        });
    });

    describe('POST /categories', () => {
        it('should return BAD_REQUEST when cat name is not given', done => {
            callUrl({ method: 'post', token: testUser.accessToken })
                .expect('Content-Type', /json/)
                .expect(HttpStatus.BAD_REQUEST)
                .end((err, res) => {
                    if (err) {
                        return done(err);
                    }
                    assert.deepEqual(res.body, {});
                    done();
                });
        });

        it('should add a new category and assign it to the user', done => {
            let catName = 'Test Cat Name';
            callUrl({ method: 'post', token: testUser.accessToken })
                .send({ name: catName })
                .expect('Content-Type', /json/)
                .expect(HttpStatus.OK)
                .end((err, res) => {
                    co(function* () {
                        if (err) {
                            return done(err);
                        }
                        let cat = res.body;
                        assert.ok(cat._id);
                        assert.strictEqual(cat.name, catName);
                        assert.ok(testUser._id.equals(cat.user));

                        //cleanup
                        yield Category.remove({ _id: cat._id });
                        yield User.removeCategory(cat.user, cat._id);

                        done();
                    });
                });
        });
    });

});
