'use strict';

//import HttpStatus from 'http-status';
import connection from '../../db_common';
import User from '../../../src/models/user';
import Category from '../../../src/models/category';
import Notepad from '../../../src/models/notepad';
//import mongoose from 'mongoose';
//import assert from 'assert';
import co from 'co';

let config;

try {
    config = require('../../../config/app.conf.json');
} catch (err) {
    config = require('../../../config/testing.json');
}

describe('API /notepads', () => {

    let db, testUser, testCat, testNotepad;
    //set the main notepads API url
    //let url = config.apiBase + '/notepads';

    //helpers.setUrl(url);

    before(() => {
        return co(function* () {
            db = connection();

            testUser = yield User.createAsync({
                'facebookId': +new Date(),
                'name': 'Iliyan Trifonov',
                'photo': 'photourl'
            });

            //helpers.setToken(testUser.accessToken);

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

});
