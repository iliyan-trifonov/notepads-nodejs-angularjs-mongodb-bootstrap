'use strict';

import HttpStatus from 'http-status';
import connection from '../../db_common';
import User from '../../../src/models/user';
import Category from '../../../src/models/category';
import Notepad from '../../../src/models/notepad';
//import mongoose from 'mongoose';
import assert from 'assert';
import co from 'co';
import RequestUrl from './helper-functions';

let config;

try {
    config = require('../../../config/app.conf.json');
} catch (err) {
    config = require('../../../config/testing.json');
}

describe('API /notepads', () => {

    let db, testUser, testCat, testNotepad, callUrl;
    //set the main notepads API url
    let url = config.apiBase + '/notepads';

    before(() => {
        return co(function* () {
            db = connection();

            let request = new RequestUrl();

            callUrl = request.callUrl.bind(request);

            request.setUrl(url);

            testUser = yield User.createAsync({
                'facebookId': +new Date(),
                'name': 'Iliyan Trifonov',
                'photo': 'photourl'
            });

            request.setToken(testUser.accessToken);

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
        return co(function* () {
            //cleanup
            yield User.remove({});
            yield Category.remove({});
            yield Notepad.remove({});

            db.close();
        });
    });

    describe('GET /notepads', () => {
        describe('?insidecats=1', () => {
            it('should return an empty array if no cats are found', done => {
                co(function* () {
                    let user = yield User.createAsync({
                        name: 'Iliyan Trifonov',
                        facebookId: +new Date(),
                        photo: 'photourl'
                    });

                    callUrl({ token: user.accessToken, addQuery: 'insidecats=1' })
                        .expect('Content-Type', /json/)
                        .expect(HttpStatus.OK)
                        .end((err, res) => {
                            if (err) {
                                return done(err);
                            }

                            assert.deepEqual(res.body, []);

                            done();
                        });
                }).catch(done);
            });

            it('should return an array of categories with notepads inside', done => {
                callUrl({ token: testUser.accessToken, addQuery: 'insidecats=1' })
                    .expect('Content-Type', /json/)
                    .expect(HttpStatus.OK)
                    .end((err, res) => {
                        if (err) {
                            return done(err);
                        }

                        let cats = res.body;

                        assert.ok(Array.isArray(cats));
                        assert.strictEqual(cats.length, 1);
                        assert.strictEqual(cats[0].notepads.length, 1);
                        assert.ok(testCat._id.equals(cats[0]._id));
                        assert.ok(testNotepad._id.equals(cats[0].notepads[0]._id));

                        done();
                    });
            });
        });

        it('should return NOT_FOUND if user has no notepads', done => {
            co(function* () {
                let user = yield User.createAsync({
                    name: 'Iliyan Trifonov',
                    facebookId: +new Date(),
                    photo: 'photourl'
                });

                callUrl({ token: user.accessToken })
                    .expect('Content-Type', /json/)
                    .expect(HttpStatus.NOT_FOUND)
                    .end((err, res) => {
                        if (err) {
                            return done(err);
                        }

                        assert.deepEqual(res.body, []);

                        done();
                    });
            }).catch(done);
        });

        it('should return the notepads of the user', done => {
            callUrl({ token: testUser.accessToken })
                .expect('Content-Type', /json/)
                .expect(HttpStatus.OK)
                .end((err, res) => {
                    if (err) {
                        return done(err);
                    }

                    let notepads= res.body;

                    assert.ok(Array.isArray(notepads));
                    assert.strictEqual(notepads.length, 1);
                    assert.strictEqual(notepads[0].title, testNotepad.title);

                    done();
                });
        });
    });

});
